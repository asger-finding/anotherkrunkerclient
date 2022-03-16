import { ReleaseData } from '../akc';
import Electron = require('electron');

const { setVibrancy } = require('electron-acrylic-window');
const { BrowserWindow, ipcMain } = require('electron');
const { info, warn } = require('electron-log');
const { get } = require('axios');
const path = require('path');
const {
	CLIENT_REPO,
	CLIENT_VERSION,
	ELECTRON_FLAGS,
	SPLASH_PHYSICAL_PARAMETERS,
	SPLASH_WEBPREFERENCES,
	MESSAGE_SPLASH_DONE,
	MESSAGE_RELEASES_DATA
} = require('@constants');

module.exports = class {

	/**
	 * @param  {Electron.BrowserWindow} splashWindow
	 * @returns {Promise<Electron.BrowserWindow>} splashWindow promise
	 * @description
	 * Load the splash window with the splash.html file.  
	 * Get the client release data and emit it to the splash window.  
	 * Show the window on dom-ready and callback.
	 */
	public static async load(splashWindow: Electron.BrowserWindow): Promise<Electron.BrowserWindow> {
		// Set the vibrancy of the splash window
		setVibrancy(splashWindow, {
			theme: 'dark',
			effect: 'blur'
		});
		splashWindow.removeMenu();
		splashWindow.loadFile(path.join(__dirname, '../renderer/html/splash.html'));

		// Show the splash window when things have all loaded.
		return new Promise(resolve => {
			splashWindow.webContents.once('dom-ready', async() => {
				info('dom-ready reached on Splash window');

				await this.emitReleaseData(splashWindow);
				splashWindow.show();
				splashWindow.webContents.openDevTools({ mode: 'detach' });

				// Resolve the promise when everything is done and dusted in the splash window.
				ipcMain.on(MESSAGE_SPLASH_DONE, () => {
					info(`${ MESSAGE_SPLASH_DONE } received`);

					resolve(splashWindow);
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

		for (const [ flag, value ] of ELECTRON_FLAGS) app.commandLine.appendSwitch(flag, value);
		return <Array<Array<string | null>>>ELECTRON_FLAGS;
	}

	/**
	 * @returns {Electron.BrowserWindow} splashWindow
	 * @description
	 * Create new Electron.BrowserWindow for the splash window.
	 */
	public static createSplashWindow(): Electron.BrowserWindow {
		info('Creating new Splash window instance');

		return new BrowserWindow({
			...SPLASH_PHYSICAL_PARAMETERS,
			webPreferences: {
				...SPLASH_WEBPREFERENCES,
				preload: path.join(__dirname, '../preload/splash-pre')
			}
		});
	}

	/**
	 * 
	 * @returns {string} package version
	 * @description
	 * Get the current version of the client from the package.
	 */
	public static getClientVersion(): string {
		const version: string = CLIENT_VERSION;
		return version;
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
				clientVersion: this.getClientVersion(),
				releaseVersion: response.data.tag_name,
				releaseUrl: response.data.html_url
			}))
			.catch((error: Error) => {
				warn(`Error getting latest GitHub release: ${ error.message }`);
				return <ReleaseData>{
					clientVersion: this.getClientVersion(),
					releaseVersion: '0.0.0',
					releaseUrl: ''
				};
			});

		return newest;
	}

	/**
	 * @param {Electron.BrowserWindow} splashWindow
	 * @returns {Promise<void>}
	 * @description
	 * Emit the client release data to the splash window event listener.
	 */
	private static async emitReleaseData(splashWindow: Electron.BrowserWindow): Promise<void> {
		await splashWindow.webContents.send(MESSAGE_RELEASES_DATA, await this.getReleaseData());
	}

};
