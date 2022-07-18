import { BrowserWindow, app, dialog } from 'electron';
import {
	TABS,
	getDefaultConstructorOptions,
	getURLData,
	preferences
} from '@constants';
import { WindowData, WindowSaveData } from '@client';
import GameUtils from '@game-utils';
import ResourceSwapper from '@resource-swapper';
import { getSpoofedUA } from '@useragent-spoof';
import { info } from '@logger';
import { lt as lessThan } from 'semver';
import { register } from 'electron-localshortcut';
import { spawn } from 'child_process';

export default class {

	/**
	 * Create a new window instance, load given URL (if any)  
	 * Register shortcuts for the window. If show is true in parameters, show the window.  
	 * If the window is a Krunker tab, set the window scaling preferences.
	 * @param constructorOptions - The options to pass to the window constructor
	 * @param windowURL - The URL to load in the window
	 * @returns Newly generated window instance
	 */
	public static async createWindow(constructorOptions: Electron.BrowserWindowConstructorOptions, windowURL?: string): Promise<Electron.BrowserWindow> {
		const windowData = getURLData(windowURL);
		const browserWindow = new BrowserWindow(constructorOptions);

		if (windowURL) this.loadSpoofedURL(browserWindow, windowURL);
		if (preferences.get(`window.${ windowData.tab }.maximized`)) browserWindow.maximize();
		if (windowData.isKrunker) {
			this.registerSwapper(browserWindow);
			this.hideCaptchaBar(browserWindow);
		}
		browserWindow.removeMenu();

		this.registerEventListeners(constructorOptions, browserWindow, windowData);
		const specialWindowCb = this.createSpecialWindow(windowData);
		if (typeof specialWindowCb === 'function') await specialWindowCb(browserWindow);

		return browserWindow;
	}

	/**
	 * Load a URL in the specified window with a spoofed user agent
	 * @param browserWindow - The target window to spoof
	 * @param url - URL to load
	 */
	private static async loadSpoofedURL(window: Electron.BrowserWindow, url: string): Promise<void> {
		const spoofedUserAgent = await getSpoofedUA();
		window.loadURL(url, spoofedUserAgent ? { userAgent: spoofedUserAgent } : {});
	}

	private static openExternal(url: string): void {
		let command = 'xdg-open';
		if (process.platform === 'darwin') command = 'open';
		if (process.platform === 'win32') command = 'explorer';

		spawn(command, [url]);
	}

	/**
	 * Register global shortcuts for the window. Should be done before dom-ready
	 * @param window - The window to register the event on
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
	 * Register the resource swapper for the window. Should be done before dom-ready.
	 * @param browserWindow - The window to register the event on
	 */
	private static registerSwapper(browserWindow: Electron.BrowserWindow): void {
		const resourceSwapper = new ResourceSwapper(browserWindow);
		return resourceSwapper.start();
	}

	/**
	 * Hide the captcha bar in the window that krunker may spawn.
	 * @param browserWindow - The window to inject the css in
	 */
	private static hideCaptchaBar(browserWindow: Electron.BrowserWindow): void {
		browserWindow.webContents.once('did-frame-finish-load', () => {
			browserWindow.webContents.insertCSS('body > div:not([class]):not([id]) > div:not(:empty):not([class]):not([id]) { display: none; }');
		});
	}

	/**
	 * Create electron event listeners for the window.  
	 * Some one-time events are triggered onces, some are triggered on every event.
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
				if (frameName === '_self') browserWindow.loadURL(newWindowURL);
				else this.createWindow(getDefaultConstructorOptions(newWindowData.tab), newWindowURL);
			} else {
				this.openExternal(newWindowURL);
			}
		});

		webContents.on('will-navigate', (evt, newWindowURL) => {
			evt.preventDefault();

			const newWindowData = getURLData(newWindowURL);
			if (!newWindowData.isKrunker) this.openExternal(newWindowURL);
			else if (!newWindowData.invalid) {
				this.hideCaptchaBar(browserWindow);
				browserWindow.loadURL(newWindowURL);
			}
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
	 * @param window - The window to open the DevTools in
	 * @param mode - The mode to open the DevTools in
	 */
	public static openDevToolsWithFallback(window: Electron.BrowserWindow, mode?: Electron.OpenDevToolsOptions): void {
		// Addresses https://stackoverflow.com/q/69969658/11452298 for electron < 13.5.0
		window.webContents.openDevTools(mode);

		// Get electron version
		const electronVersion = process.versions.electron;
		if (lessThan(electronVersion, '13.5.0')) {
			// devtools-opened takes about 300 ms to fire on a Windows 10 VirtualBox VM with 8 gb of ram and 8 threads.
			const fallback = setTimeout(() => {
				// Fallback if openDevTools fails
				window.webContents.closeDevTools();

				const devtoolsWindow = new BrowserWindow();
				devtoolsWindow.setMenuBarVisibility(false);

				window.webContents.setDevToolsWebContents(devtoolsWindow.webContents);
				window.webContents.openDevTools({ mode: 'detach' });
				window.once('closed', () => devtoolsWindow.destroy());
			}, 500);
			window.webContents.once('devtools-opened', () => clearTimeout(fallback));
		}
	}

	/**
	 * Destroy the splash window.
	 * @param browserWindow - The window to destroy
	 */
	public static destroyWindow(browserWindow: Electron.BrowserWindow): void {
		info('Destroying a window instance');
		if (browserWindow.webContents.isDevToolsOpened()) browserWindow.webContents.closeDevTools();

		browserWindow.hide();
		browserWindow.destroy();
	}

}
