import Electron = require('electron');

const { BrowserWindow, ipcMain } = require('electron');
const { info } = require('electron-log');
const path = require('path');
const WindowUtils = require('@window-utils');
const {
	IS_DEVELOPMENT,
	GAME_PHYSICAL_PARAMETERS,
	GAME_WEBPREFERENCES,
	MESSAGE_GAME_DONE
} = require('@constants');

module.exports = class {

	/**
	 * @param  {Electron.BrowserWindow} gameWindow
	 * @returns {Promise<Electron.BrowserWindow>} gameWindow promise
	 * @description
	 * Load the game window with the krunker.io URL
	 * Show the window on dom-ready and callback.
	 */
	public static load(gameWindow: Electron.BrowserWindow, precursor: Electron.BrowserWindow | undefined): Promise<Electron.BrowserWindow> {
		gameWindow.loadURL('https://krunker.io');
		gameWindow.removeMenu();

		// Show the game window when things have all loaded.
		return new Promise(resolve => {
			gameWindow.webContents.once('dom-ready', () => {
				info('dom-ready reached on Game window');

				WindowUtils.registerShortcuts(gameWindow);
				gameWindow.show();
				if (IS_DEVELOPMENT) gameWindow.webContents.openDevTools();
				if (precursor) WindowUtils.destroyWindow(precursor);

				// Resolve the promise when everything is done and dusted in the game window.
				ipcMain.once(MESSAGE_GAME_DONE, () => {
					info(`${ MESSAGE_GAME_DONE } received`);

					return resolve(gameWindow);
				});
			});
		});
	}

	/**
	 * @returns {Electron.BrowserWindow} gameWindow
	 * @description
	 * Create new Electron.BrowserWindow for the game window.
	 */
	public static createGameWindow(): Electron.BrowserWindow {
		info('Creating new Game window instance');

		return new BrowserWindow({
			...GAME_PHYSICAL_PARAMETERS,
			webPreferences: {
				...GAME_WEBPREFERENCES,
				preload: path.join(__dirname, '../preload/game-pre')
			}
		});
	}

};
