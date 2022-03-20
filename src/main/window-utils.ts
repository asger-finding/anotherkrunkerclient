const { app } = require('electron');
const { info } = require('electron-log');
const { register } = require('electron-localshortcut');
const {
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

};
