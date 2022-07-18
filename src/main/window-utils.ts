import { AsyncReturnType, WindowData, WindowSaveData } from '@client';
import { BrowserWindow, app, dialog } from 'electron';
import {
	TABS,
	getDefaultConstructorOptions,
	getURLData,
	preferences
} from '@constants';
import GameUtils from '@game-utils';
import ResourceSwapper from '@resource-swapper';
import { getSpoofedUA } from '@useragent-spoof';
import { info } from '@logger';
import { lt as lessThan } from 'semver';
import { register } from 'electron-localshortcut';
import { spawn } from 'child_process';

/**
 * Load a URL in the specified window with a spoofed user agent
 *
 * @param browserWindow - The target window to spoof
 * @param windowUrl - URL to load
 */
async function loadSpoofedURL(browserWindow: Electron.BrowserWindow, windowUrl: string): Promise<void> {
	let ua: AsyncReturnType<typeof getSpoofedUA> = '';
	const windowUserAgent = browserWindow.webContents.getUserAgent();
	const isElectron = windowUserAgent.includes('Electron');

	if (isElectron) ua = await getSpoofedUA();
	browserWindow.loadURL(windowUrl, { userAgent: ua || windowUserAgent });
}

/**
 * Run when navigated (exclude `windowUrl` param) or when navigating (include `windowUrl` param) to a new URL.
 * Spoofs the user agent, loads the URL, and triggers site-specific behavior.
 *
 * @param browserWindow - The target window
 * @param windowUrl - URL to load, if any
 */
export function navigate(browserWindow: BrowserWindow & { resourceSwapper?: ResourceSwapper }, windowUrl?: string): void {
	if (windowUrl) loadSpoofedURL(browserWindow, windowUrl);
	const { isKrunker } = getURLData(windowUrl ?? browserWindow.webContents.getURL());

	if (isKrunker) {
		// Hide the captcha bar in the window that krunker may spawn.
		browserWindow.webContents.once('did-frame-finish-load', () => {
			browserWindow.webContents.insertCSS('body > div:not([class]):not([id]) > div:not(:empty):not([class]):not([id]) { display: none; }');
		});

		// Assign the BrowserWindow a ResourceSwapper.
		if (!browserWindow.resourceSwapper) browserWindow.resourceSwapper = new ResourceSwapper(browserWindow);
		browserWindow.resourceSwapper.start();
	}
}

/**
 * Open an outlink in the default browser.
 * Fix for `shell.openExternal()` in some electron versions.
 *
 * @param externalUrl - The URL to open externally
 */
export function openExternal(externalUrl: string): void {
	let command = 'xdg-open';
	if (process.platform === 'darwin') command = 'open';
	if (process.platform === 'win32') command = 'explorer';

	spawn(command, [externalUrl]);
}

export default class {

	/**
	 * Create a new window instance, load given URL (if any)  
	 * Register shortcuts for the window. If show is true in parameters, show the window.  
	 * If the window is a Krunker tab, set the window scaling preferences.
	 *
	 * @param constructorOptions - The options to pass to the window constructor
	 * @param windowURL - The URL to load in the window
	 * @returns Newly generated window instance
	 */
	public static async createWindow(constructorOptions: Electron.BrowserWindowConstructorOptions, windowURL?: string): Promise<Electron.BrowserWindow> {
		const windowData = getURLData(windowURL);
		const browserWindow = new BrowserWindow(constructorOptions);

		if (windowURL) navigate(browserWindow, windowURL);
		if (preferences.get(`window.${ windowData.tab }.maximized`)) browserWindow.maximize();

		browserWindow.removeMenu();

		this.registerEventListeners(constructorOptions, browserWindow, windowData);
		const specialWindowCb = this.createSpecialWindow(windowData);
		if (typeof specialWindowCb === 'function') await specialWindowCb(browserWindow);

		return browserWindow;
	}

	/**
	 * Register global shortcuts for the window. Should be done before dom-ready
	 *
	 * @param browserWindow - The window to register the event on
	 */
	private static registerShortcuts(browserWindow: Electron.BrowserWindow): void {
		const { webContents } = browserWindow;

		info(`Registering shortcuts for window: ${ browserWindow.id }`);

		register(browserWindow, 'Esc', () => webContents.executeJavaScript('document.exitPointerLock()', true));
		register(browserWindow, 'Alt+F4', () => browserWindow.close());
		register(browserWindow, 'F11', () => browserWindow.setFullScreen(!browserWindow.isFullScreen()));
		register(browserWindow, ['F5', 'Ctrl+R'], () => webContents.reload());
		register(browserWindow, ['Ctrl+F5', 'Ctrl+Shift+R'], () => webContents.reloadIgnoringCache());
		register(browserWindow, ['F12', 'Ctrl+Shift+I'], () => this.openDevToolsWithFallback(browserWindow));
	}

	/**
	 * Create electron event listeners for the window.  
	 * Some one-time events are triggered onces, some are triggered on every event.
	 *
	 * @param constructorOptions - The parameters the window was created with
	 * @param browserWindow - Target window
	 * @param windowData - Data from Constants.getURLData on the target window URL
	 */
	private static registerEventListeners(constructorOptions: Electron.BrowserWindowConstructorOptions, browserWindow: Electron.BrowserWindow, windowData: WindowData): void {
		const { webContents } = browserWindow;

		// If the window is a Krunker tab, set the window scaling preferences.
		if (windowData.isInTabs) {
			browserWindow.once('close', () => {
				// Save the window sizing and bounds to the store
				const windowPreferences: WindowSaveData = {
					...browserWindow.getBounds(),
					fullscreen: browserWindow.isFullScreen(),
					maximized: browserWindow.isMaximized()
				};
				for (const [key, value] of Object.entries(windowPreferences)) preferences.set(`window.${ windowData.tab }.${ key }`, value);
			});
		}

		// When Krunker URLs are opened, open them in the default electron window. If the URL is external, open it in the default browser.
		webContents.on('new-window', (evt, newWindowURL, frameName) => {
			evt.preventDefault();

			const newWindowData = getURLData(newWindowURL);
			if (newWindowData.isKrunker) {
				if (frameName === '_self') navigate(browserWindow, newWindowURL);
				else this.createWindow(getDefaultConstructorOptions(newWindowData.tab), newWindowURL);
			} else {
				openExternal(newWindowURL);
			}
		});

		webContents.on('will-navigate', async(evt, newWindowURL) => {
			evt.preventDefault();

			const newWindowData = getURLData(newWindowURL);

			if (!newWindowData.isKrunker) openExternal(newWindowURL);
			else if (!newWindowData.invalid) navigate(browserWindow, newWindowURL);
		});

		webContents.on('will-prevent-unload', evt => {
			if (!dialog.showMessageBoxSync({
				buttons: ['Leave', 'Cancel'],
				title: 'Leave site?',
				message: 'Changes you made may not be saved.',
				type: 'question',
				noLink: true
			})) evt.preventDefault();
		});


		// Don't allow the target website to set the window title.
		browserWindow.on('page-title-updated', evt => evt.preventDefault());

		// If constructorOptions have an explicit show true value, show the window.
		browserWindow.once('ready-to-show', () => { if (typeof constructorOptions.show === 'undefined' ? true : constructorOptions.show) browserWindow.show(); });

		// Set the window title and register shortcuts for the window.
		webContents.once('did-finish-load', () => {
			if (windowData.tab) browserWindow.setTitle(`${ windowData.tab } — ${ app.getName() }`);

			this.registerShortcuts(browserWindow);
		});
	}

	/**
	 * If the tab matches the switch case, apply tab-specific methods to the window.
	 *
	 * @param windowData - Data from Constants.getURLData on the target window URL
	 * @returns A function that returns a void promise when all is done
	 */
	private static createSpecialWindow(windowData: WindowData): ((browserWindow: Electron.BrowserWindow) => Promise<void>) | null {
		switch (windowData.tab) {
			case TABS.GAME:
				return GameUtils.load;
			default:
				return null;
		}
	}

	/**
	 * Attempt to open the DevTools for the window.
	 * If it refuses to open after 500 ms, use a fallback method.
	 *
	 * @param browserWindow - The window to open the DevTools in
	 * @param mode - The mode to open the DevTools in
	 */
	public static openDevToolsWithFallback(browserWindow: Electron.BrowserWindow, mode?: Electron.OpenDevToolsOptions): void {
		// Addresses https://stackoverflow.com/q/69969658/11452298 for electron < 13.5.0
		browserWindow.webContents.openDevTools(mode);

		// Get electron version
		const electronVersion = process.versions.electron;
		if (lessThan(electronVersion, '13.5.0')) {
			// devtools-opened takes about 300 ms to fire on a Windows 10 VirtualBox VM with 8 gb of ram and 8 threads.
			const fallback = setTimeout(() => {
				// Fallback if openDevTools fails
				browserWindow.webContents.closeDevTools();

				const devtoolsWindow = new BrowserWindow();
				devtoolsWindow.setMenuBarVisibility(false);

				browserWindow.webContents.setDevToolsWebContents(devtoolsWindow.webContents);
				browserWindow.webContents.openDevTools({ mode: 'detach' });
				browserWindow.once('closed', () => devtoolsWindow.destroy());
			}, 500);
			browserWindow.webContents.once('devtools-opened', () => clearTimeout(fallback));
		}
	}

	/**
	 * Destroy the splash window.
	 *
	 * @param browserWindow - The window to destroy
	 */
	public static destroyWindow(browserWindow: Electron.BrowserWindow): void {
		info('Destroying a window instance');
		if (browserWindow.webContents.isDevToolsOpened()) browserWindow.webContents.closeDevTools();

		browserWindow.hide();
		browserWindow.destroy();
	}

}
