import { MESSAGE_GAME_DONE, QUICKJOIN_URL_QUERY_PARAM, TARGET_GAME_URL } from '@constants';
import { info } from '@logger';
import { ipcMain } from 'electron';
import { navigate } from '@window-utils';
import { register } from 'electron-localshortcut';

export default class {

	/**
	 * Load the game window with the game URL.  
	 * Show the window on ready-to-show and callback.
	 *
	 * @param browserWindow The target window to load onto
	 * @returns Promise for when everything is done
	 */
	public static load(browserWindow: Electron.BrowserWindow): Promise<void> {
		// Show the game window when things have all loaded.
		return new Promise<void>(resolve => {
			register(browserWindow, 'F6', () => navigate(browserWindow, TARGET_GAME_URL));
			register(browserWindow, 'F4', () => navigate(browserWindow, `${ TARGET_GAME_URL }?${ QUICKJOIN_URL_QUERY_PARAM }`));

			browserWindow.once('ready-to-show', () => {
				info('ready-to-show reached on Game window');
				browserWindow.show();
			});
			browserWindow.webContents.once('did-finish-load', () => {
				info('did-finish-load reached on Game window');

				// Resolve the promise when everything is done and dusted in the game window.
				ipcMain.once(MESSAGE_GAME_DONE, () => {
					info(`${ MESSAGE_GAME_DONE } received`);

					resolve();
				});
			});
		});
	}

}
