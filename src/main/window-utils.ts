import { BrowserWindow, app, shell } from 'electron';
import {
	QUICKJOIN_URL_QUERY_PARAM,
	TABS,
	TARGET_GAME_URL,
	getDefaultConstructorOptions,
	getURLData,
	preferences
} from '@constants';
import GameUtils from '@game-utils';
import Swapper from '@resource-swapper';
import { WindowData } from '@client';
import { info } from 'electron-log';
import { register } from 'electron-localshortcut';

export default class {

	/**
	 * @param  {Electron.BrowserWindowConstructorOptions} parameters
	 * @param  {(string | undefined)} windowURL
	 * @returns {Electron.BrowserWindow} Newly generated window instance
	 * @description
	 * Create a new window instance, load given URL (if any)  
	 * Register shortcuts for the window. If show is true in parameters, show the window.  
	 * If the window is a Krunker tab, set the window scaling preferences.  
	 * Return the window
	 */
	public static async createWindow(parameters: Electron.BrowserWindowConstructorOptions, windowURL?: string): Promise<Electron.BrowserWindow> {
		info(`Creating a window instance${ windowURL ? ` with URL: ${ windowURL }` : '' }`);

		const window = new BrowserWindow(parameters);
		const windowData: WindowData = getURLData(windowURL);

		if (windowURL) window.loadURL(windowURL);
		if (preferences.get(`window.${ windowData.tab }.maximized`)) window.maximize();
		if (windowData.isKrunker) this.registerSwapper(window);
		window.removeMenu();

		this.registerEventListeners(parameters, window, windowData);
		await this.createSpecialWindow(windowData)(window);

		return window;
	}

	/**
	 * @param {Electron.BrowserWindow} window The window to register the event on
	 * @returns {Electron.BrowserWindow} window The window instance
	 * @description
	 * Register global shortcuts for the window. Should be done before dom-ready
	 */
	private static registerShortcuts(window: Electron.BrowserWindow, windowData: WindowData): Electron.BrowserWindow {
		const { webContents } = window;

		info(`Registering shortcuts for window: ${ window.id }`);

		register(window, 'Esc', () => webContents.executeJavaScript('document.exitPointerLock()', true));
		register(window, 'Alt+F4', () => app.quit());
		register(window, 'F11', () => window.setFullScreen(!window.isFullScreen()));
		register(window, [ 'F5', 'Ctrl+R' ], () => webContents.reload());
		register(window, [ 'Ctrl+F5', 'Ctrl+Shift+R' ], () => webContents.reloadIgnoringCache());
		register(window, [ 'F12', 'Ctrl+Shift+I' ], () => webContents.openDevTools());

		if (windowData.tab === TABS.GAME) {
			info('Registering shortcuts for the game tab');

			register(window, 'F6', () => window.loadURL(TARGET_GAME_URL));
			register(window, 'F4', () => window.loadURL(`${ TARGET_GAME_URL }?${ QUICKJOIN_URL_QUERY_PARAM }`));
		}

		return window;
	}

	/**
	 * @param {Electron.BrowserWindow} window The window to register the event on 
	 * @returns {Electron.BrowserWindow} window The window instance
	 * @description
	 * Register the resource swapper for the window. Should be done before dom-ready.
	 */
	private static registerSwapper(window: Electron.BrowserWindow) {
		const swapper = new Swapper(window);
		return swapper.start();
	}

	/**
	 * @param {Electron.BrowserWindowConstructorOptions} parameters The parameters the window was created with
	 * @param {Electron.BrowserWindow} window 
	 * @param {WindowData} windowData Data about the window target URL 
	 * @returns {Electron.BrowserWindow} window The window instance
	 * @description
	 * Create electron event listeners for the window.  
	 * Some one-time events are triggered onces, some are triggered on every event.
	 */
	private static registerEventListeners(parameters: Electron.BrowserWindowConstructorOptions, window: Electron.BrowserWindow, windowData: WindowData): Electron.BrowserWindow {
		// If the window is a Krunker tab, set the window scaling preferences.
		if (windowData.isInTabs) {
			window.once('close', () => {
				info(`Closing window instance${ window.webContents.getURL() ? ` with URL: ${ window.webContents.getURL() }` : '' }`);

				const windowPref = {
					...window.getBounds(),
					fullscreen: window.isFullScreen(),
					maximized: window.isMaximized()
				};
				for (const key in windowPref) preferences.set(`window.${ windowData.tab }.${ key }`, windowPref[key as keyof typeof windowPref]);
			});
		}

		// When Krunker URLs are opened, open them in the default electron window. If the URL is external, open it in the default browser.
		window.webContents.on('new-window', (evt, newWindowURL, frameName) => {
			evt.preventDefault();

			const newWindowData: WindowData = getURLData(newWindowURL);
			if (newWindowData.isKrunker) {
				if (frameName === '_self') window.webContents.loadURL(newWindowURL);
				else this.createWindow(getDefaultConstructorOptions(newWindowData.tab), newWindowURL);
			} else {
				shell.openExternal(newWindowURL);
			}
		});

		window.webContents.on('will-navigate', (evt, newWindowURL) => {
			evt.preventDefault();

			const newWindowData: WindowData = getURLData(newWindowURL);
			if (!newWindowData.isKrunker) shell.openExternal(newWindowURL);
			else if (!newWindowData.invalid) window.webContents.loadURL(newWindowURL);
		});

		// Don't allow the target website to set the window title.
		window.on('page-title-updated', evt => evt.preventDefault());

		// If parameters have an explicit show true value, show the window.
		window.once('ready-to-show', () => { if (typeof parameters.show === 'undefined' ? true : parameters.show) window.show(); });

		// Set the window title and register shortcuts for the window.
		window.webContents.once('did-finish-load', () => {
			if (windowData.tab) window.setTitle(`${ windowData.tab } — ${ app.getName() }`);

			this.registerShortcuts(window, windowData);
		});

		return window;
	}

	private static createSpecialWindow(windowData: WindowData) {
		switch (windowData.tab) {
			case TABS.GAME:
				return GameUtils.load;
			default:
				return function() {};
		}
	}

	/**
	 * @param {Electron.BrowserWindow} window The window to destroy
	 * @description
	 * Destroy the splash window.
	 */
	public static destroyWindow(window: Electron.BrowserWindow): void {
		info('Destroying a window instance');
		if (window.webContents.isDevToolsOpened()) window.webContents.closeDevTools();

		window.hide();
		return window.destroy();
	}

}
