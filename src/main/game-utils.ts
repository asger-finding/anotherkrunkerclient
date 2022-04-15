const { ipcMain } = require('electron');
const { info } = require('electron-log');
const { IS_DEVELOPMENT, MESSAGE_GAME_DONE } = require('@constants');

module.exports = class {

	/**
	 * @param  {Electron.BrowserWindow} window
	 * @returns {Promise<Electron.BrowserWindow>} window promise
	 * @description
	 * Load the game window with the game URL
	 * Show the window on ready-to-show and callback.
	 */
	public static load(window: Electron.BrowserWindow): Promise<Electron.BrowserWindow> {
		// Show the game window when things have all loaded.
		return new Promise(resolve => {
			window.once('ready-to-show', () => {
				info('ready-to-show reached on Game window');

				if (IS_DEVELOPMENT) window.webContents.openDevTools();

				window.show();
			});
			window.webContents.once('did-finish-load', () => {
				info('did-finish-load reached on Game window');

				// Resolve the promise when everything is done and dusted in the game window.
				ipcMain.once(MESSAGE_GAME_DONE, () => {
					info(`${ MESSAGE_GAME_DONE } received`);

					return resolve(window);
				});
			});
		});
	}

};
