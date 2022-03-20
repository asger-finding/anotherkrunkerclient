const { BrowserWindow, shell, app } = require('electron');
const { info } = require('electron-log');
const { register } = require('electron-localshortcut');
const {
	preferences,
	getDefaultConstructorOptions,
	getURLData,
	TABS,
	TARGET_GAME_URL,
	QUICKJOIN_URL_QUERY_PARAM
} = require('@constants');

module.exports = class {

	/**
	 * @param {Electron.BrowserWindow} window The window to destroy
	 * @description
	 * Destroy the splash window.
	 */
	public static destroyWindow(window: Electron.BrowserWindow): void {
		info('Destroying a window instance');
		if (window.webContents.isDevToolsOpened()) window.webContents.closeDevTools();

		return window.destroy();
	}

	/**
	 * @param {Electron.BrowserWindow} window The window to register the event on
	 * @returns {Electron.BrowserWindow} window The window instance
	 * @description
	 * Register global shortcuts for the window. Should be done before dom-ready
	 */
	public static registerShortcuts(window: Electron.BrowserWindow) {
		const { webContents } = window;

		info(`Registering shortcuts for window: ${ window.id }`);

		register(window, 'Esc', () => webContents.executeJavaScript('document.exitPointerLock()', true));
		register(window, 'Alt+F4', () => app.quit());
		register(window, 'F11', () => window.setFullScreen(!window.isFullScreen()));
		register(window, 'F5', () => webContents.reload());
		register(window, 'F12', () => webContents.openDevTools());

		const url = getURLData(window.webContents.getURL());
		if (url.tab === TABS.GAME) {
			info('Registering shortcuts for the game tab');

			register(window, 'F6', () => window.loadURL(TARGET_GAME_URL));
			register(window, 'F4', () => window.loadURL(`${ TARGET_GAME_URL }?${ QUICKJOIN_URL_QUERY_PARAM }`));
		}

		return window;
	}

	/**
	 * @param  {Electron.BrowserWindowConstructorOptions} parameters
	 * @param  {(string|undefined)} windowURL
	 * @returns {Electron.BrowserWindow} Newly generated window instance
	 * @description
	 * Create a new window instance, load given URL (if any)  
	 * Register shortcuts for the window. If show is true in parameters, show the window.  
	 * If the window is a Krunker tab, set the window scaling preferences.  
	 * Return the window
	 */
	public static createWindow(parameters: Electron.BrowserWindowConstructorOptions, windowURL: string | undefined): Electron.BrowserWindow {
		info(`Creating a window instance${ windowURL ? ` with URL: ${ windowURL }` : '' }`);

		const window = new BrowserWindow(parameters);
		const windowData = getURLData(windowURL);

		if (windowURL) window.loadURL(windowURL);
		if (preferences.get(`window.${ windowData.tab }.maximized`)) window.maximize();
		window.removeMenu();
		window.setTitle(`${ app.getName() } — ${ windowData.tab }`);

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

			if (windowData.isKrunker) {
				const newWindowData = getURLData(newWindowURL);

				if (frameName === '_self') window.webContents.loadURL(newWindowURL);
				else this.createWindow(getDefaultConstructorOptions(newWindowData.tab), newWindowURL);
			} else {
				shell.openExternal(newWindowURL);
			}
		});

		// If parameters have an explicit show true value, show the window.
		window.once('ready-to-show', () => { if (typeof parameters.show === 'undefined' ? true : parameters.show) window.show(); });

		// Register shortcuts for the window.
		window.webContents.once('did-finish-load', () => this.registerShortcuts(window));

		return window;
	}

};
