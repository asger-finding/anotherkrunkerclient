import { BrowserWindow, app, shell } from 'electron';
import {
	TABS,
	getDefaultConstructorOptions,
	getURLData,
	preferences
} from '@constants';
import GameUtils from '@game-utils';
import ResourceSwapper from '@resource-swapper';
import { WindowData } from '@client';
import { getSpoofedUA } from '@useragent-spoof';
import { info } from 'electron-log';
import { register } from 'electron-localshortcut';

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
		info(`Creating a window instance${ windowURL ? ` with URL: ${ windowURL }` : '' }`);

		const window = new BrowserWindow(constructorOptions);
		const windowData = getURLData(windowURL);

		if (windowURL) this.loadSpoofedURL(window, windowURL);
		if (preferences.get(`window.${ windowData.tab }.maximized`)) window.maximize();
		if (windowData.isKrunker) this.registerSwapper(window);
		window.removeMenu();

		this.registerEventListeners(constructorOptions, window, windowData);
		await this.createSpecialWindow(windowData)(window);

		return window;
	}

	/**
	 * Load a URL in the specified window with a spoofed user agent
	 * @param window - The target window to spoof
	 * @param url - URL to load
	 */
	private static async loadSpoofedURL(window: Electron.BrowserWindow, url: string): Promise<void> {
		const spoofedUserAgent = await getSpoofedUA();
		window.loadURL(url, spoofedUserAgent ? { userAgent: spoofedUserAgent } : {});
	}

	/**
	 * Register global shortcuts for the window. Should be done before dom-ready
	 * @param window - The window to register the event on
	 */
	private static registerShortcuts(window: Electron.BrowserWindow): void {
		const { webContents } = window;

		info(`Registering shortcuts for window: ${ window.id }`);

		register(window, 'Esc', () => webContents.executeJavaScript('document.exitPointerLock()', true));
		register(window, 'Alt+F4', () => app.quit());
		register(window, 'F11', () => window.setFullScreen(!window.isFullScreen()));
		register(window, ['F5', 'Ctrl+R'], () => webContents.reload());
		register(window, ['Ctrl+F5', 'Ctrl+Shift+R'], () => webContents.reloadIgnoringCache());
		register(window, ['F12', 'Ctrl+Shift+I'], () => webContents.openDevTools());
	}

	/**
	 * Register the resource swapper for the window. Should be done before dom-ready.
	 * @param window - The window to register the event on
	 */
	private static registerSwapper(window: Electron.BrowserWindow): void {
		const resourceSwapper = new ResourceSwapper(window);
		return resourceSwapper.start();
	}

	/**
	 * Create electron event listeners for the window.  
	 * Some one-time events are triggered onces, some are triggered on every event.
	 * @param constructorOptions - The parameters the window was created with
	 * @param window - Target window
	 * @param windowData - Data from Constants.getURLData on the target window URL
	 */
	private static registerEventListeners(constructorOptions: Electron.BrowserWindowConstructorOptions, window: Electron.BrowserWindow, windowData: WindowData): void {
		const { webContents } = window;

		// If the window is a Krunker tab, set the window scaling preferences.
		if (windowData.isInTabs) {
			window.once('close', () => {
				info(`Closing window instance${ webContents.getURL() ? ` with URL: ${ webContents.getURL() }` : '' }`);

				// Save the window sizing and bounds to the store
				const windowPreferences = {
					...window.getBounds(),
					fullscreen: window.isFullScreen(),
					maximized: window.isMaximized()
				};
				for (const [key, value] of Object.entries(windowPreferences)) preferences.set(`window.${ windowData.tab }.${ key }`, value);
			});
		}

		// When Krunker URLs are opened, open them in the default electron window. If the URL is external, open it in the default browser.
		webContents.on('new-window', (evt, newWindowURL, frameName) => {
			evt.preventDefault();

			const newWindowData = getURLData(newWindowURL);
			if (newWindowData.isKrunker) {
				if (frameName === '_self') window.loadURL(newWindowURL);
				else this.createWindow(getDefaultConstructorOptions(newWindowData.tab), newWindowURL);
			} else {
				shell.openExternal(newWindowURL);
			}
		});

		webContents.on('will-navigate', (evt, newWindowURL) => {
			evt.preventDefault();

			const newWindowData = getURLData(newWindowURL);
			if (!newWindowData.isKrunker) shell.openExternal(newWindowURL);
			else if (!newWindowData.invalid) window.loadURL(newWindowURL);
		});

		// Don't allow the target website to set the window title.
		window.on('page-title-updated', evt => evt.preventDefault());

		// If constructorOptions have an explicit show true value, show the window.
		window.once('ready-to-show', () => { if (typeof constructorOptions.show === 'undefined' ? true : constructorOptions.show) window.show(); });

		// Set the window title and register shortcuts for the window.
		webContents.once('did-finish-load', () => {
			if (windowData.tab) window.setTitle(`${ windowData.tab } — ${ app.getName() }`);

			this.registerShortcuts(window);
		});
	}

	/**
	 * If the tab matches the switch case, apply tab-specific methods to the window.
	 * @param windowData - Data from Constants.getURLData on the target window URL
	 * @returns A function that returns a void promise when all is done
	 */
	private static createSpecialWindow(windowData: WindowData): (window: Electron.BrowserWindow) => Promise<void> {
		switch (windowData.tab) {
			case TABS.GAME:
				return GameUtils.load;
			default:
				return async() => {};
		}
	}

	/**
	 * Destroy the splash window.
	 * @param window - The window to destroy
	 */
	public static destroyWindow(window: Electron.BrowserWindow): void {
		info('Destroying a window instance');
		if (window.webContents.isDevToolsOpened()) window.webContents.closeDevTools();

		window.hide();
		window.destroy();
	}

}
