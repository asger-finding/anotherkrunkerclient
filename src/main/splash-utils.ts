import { ReleaseData } from '../akc';
import Electron = require('electron');

const { setVibrancy } = require('electron-acrylic-window');
const { ipcMain } = require('electron');
const { info, warn } = require('electron-log');
const { get } = require('axios');
const path = require('path');
const {
	IS_DEVELOPMENT,
	CLIENT_REPO,
	CLIENT_VERSION,
	ELECTRON_FLAGS,
	MESSAGE_SPLASH_DONE,
	MESSAGE_RELEASES_DATA
} = require('@constants');

module.exports = class {

	/**
	 * @param  {Electron.BrowserWindow} window
	 * @returns {Promise<Electron.BrowserWindow>} window promise
	 * @description
	 * Load the splash window with the splash.html file.  
	 * Get the client release data and emit it to the splash window.  
	 * Show the window on ready-to-show and callback.
	 */
	public static load(window: Electron.BrowserWindow): Promise<Electron.BrowserWindow> {
		// Set the vibrancy of the splash window
		setVibrancy(window, {
			theme: 'dark',
			effect: 'blur'
		});
		window.loadFile(path.join(__dirname, '../renderer/html/splash.html'));

		// Show the splash window when things have all loaded.
		return new Promise(resolve => {
			window.webContents.once('did-finish-load', async() => {
				info('ready-to-show reached on Splash window');

				await this.emitReleaseData(window);
				window.show();
				if (IS_DEVELOPMENT) window.webContents.openDevTools({ mode: 'detach' });

				// Resolve the promise when everything is done and dusted in the splash window.
				ipcMain.once(MESSAGE_SPLASH_DONE, () => {
					info(`${ MESSAGE_SPLASH_DONE } received`);

					return resolve(window);
				});
			});
		});
	}

	/**
	 * @param  {Electron.App} app
	 * @returns {Array<Array<string>>} Constants.ELECTRON_FLAGS The constants.js array of flags
	 * @description
	 * Get Electron flags from Constants and set them in the app.  
	 * Return the flags.
	 */
	public static setFlags(app: Electron.App): Array<Array<string | null>> {
		info('Setting Electron flags');

		for (const [ flag, value ] of ELECTRON_FLAGS) app.commandLine.appendSwitch(flag, typeof value === 'undefined' ? null : value);
		return <Array<Array<string | null>>>ELECTRON_FLAGS;
	}

	/**
	 * @returns {Promise<ReleaseData>} ReleaseData promise for current client version, latest client version, and (optional) url to update
	 * @description
	 * Get the latest release from GitHub.  
	 * If none is found, return v0.0.0 to resolve with semver.
	 */
	private static async getReleaseData(): Promise<ReleaseData> {
		info('Getting latest GitHub release...');

		const newest: ReleaseData = await get(`https://api.github.com/repos/${ CLIENT_REPO }/releases/latest`)
			.then((response: { data: { tag_name: string, html_url: string } }) => (<ReleaseData>{
				clientVersion: CLIENT_VERSION,
				releaseVersion: response.data.tag_name,
				releaseUrl: response.data.html_url
			}))
			.catch((error: Error) => {
				warn(`Error getting latest GitHub release: ${ error.message }`);
				return <ReleaseData>{
					clientVersion: CLIENT_VERSION,
					releaseVersion: '0.0.0',
					releaseUrl: ''
				};
			});

		return newest;
	}

	/**
	 * @param {Electron.BrowserWindow} window
	 * @returns {Promise<void>}
	 * @description
	 * Emit the client release data to the splash window event listener.
	 */
	private static async emitReleaseData(window: Electron.BrowserWindow): Promise<void> {
		return window.webContents.send(MESSAGE_RELEASES_DATA, await this.getReleaseData());
	}

};
