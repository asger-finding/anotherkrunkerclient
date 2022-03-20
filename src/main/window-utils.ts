const { BrowserWindow, shell, app } = require('electron');
const { info } = require('electron-log');
const { register } = require('electron-localshortcut');
const {
	getDefaultConstructorOptions,
	getURL,
	TABS,
	TARGET_GAME_URL,
	QUICKJOIN_URL_QUERY_PARAM
} = require('@constants');

module.exports = class {

	/**
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

		const url = getURL(window);
		if (url.tab === TABS.GAME) {
			info('Registering shortcuts for the game tab');

			register(window, 'F6', () => window.loadURL(TARGET_GAME_URL));
			register(window, 'F4', () => window.loadURL(`${ TARGET_GAME_URL }?${ QUICKJOIN_URL_QUERY_PARAM }`));
		}

		return window;
	}

	public static createWindow(parameters: Electron.BrowserWindowConstructorOptions, windowURL: string | undefined): Electron.BrowserWindow {
		info(`Creating a window instance${ windowURL ? ` with URL: ${ windowURL }` : '' }`);

		const window = new BrowserWindow(parameters);
		if (windowURL) window.loadURL(windowURL);

		window.removeMenu();
		window.webContents.on('new-window', (evt, newWindowURL, frameName) => {
			evt.preventDefault();

			const url = getURL(window);
			if (url.isKrunker) {
				if (frameName === '_self') window.webContents.loadURL(newWindowURL);
				else this.createWindow(getDefaultConstructorOptions(url.tab), newWindowURL);
			} else {
				shell.openExternal(newWindowURL);
			}
		});
		window.once('ready-to-show', () => { if (typeof parameters.show === 'undefined' ? true : parameters.show) window.show(); });
		window.webContents.once('did-finish-load', () => this.registerShortcuts(window));

		return window;
	}

};
