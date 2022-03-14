import { ReleaseData } from '../akc';
import Electron = require('electron');

const {
	CLIENT_REPO,
	CLIENT_VERSION,
	ELECTRON_FLAGS,
	SPLASH_PHYSICAL_PARAMETERS,
	SPLASH_WEBPREFERENCES,
	MESSAGE_SPLASH_DONE,
	MESSAGE_RELEASES_DATA
} = require('@constants');
const { setVibrancy } = require('electron-acrylic-window');
const { BrowserWindow, ipcMain } = require('electron');
const { info, warn } = require('electron-log');
const { get } = require('axios');
const path = require('path');

module.exports = class {

	/**
	 * @param  {Electron.BrowserWindow} splash BrowserWindow instance for the splash window
	 * @returns {Promise<Electron.BrowserWindow>} splash Promised BrowserWindow instance for the splash window
	 * @description
	 * Load the splash window with the splash.html file.  
	 * Show it on dom-ready and callback when everything is done.
	 */
	public static async load(splash: Electron.BrowserWindow): Promise<Electron.BrowserWindow> {
		// Set the vibrancy of the splash window (again)
		setVibrancy(splash, {
			theme: 'dark',
			effect: 'blur'
		});
		splash.removeMenu();
		splash.loadFile(path.join(__dirname, '../html/splash.html'));

		// Show the splash window when things have all loaded.
		return new Promise(resolve => {
			splash.webContents.once('did-frame-finish-load', () => {
				info('Emitting release data');

				this.emitReleaseData(splash);
			});
			splash.webContents.once('dom-ready', () => {
				info('dom-ready reached on Splash window');

				splash.show();
				splash.webContents.openDevTools({ mode: 'detach' });

				// Resolve the promise when everything is done and dusted in the splash window.
				ipcMain.on(MESSAGE_SPLASH_DONE, () => {
					info(`${ MESSAGE_SPLASH_DONE } received`);

					resolve(splash);
				});
			});
		});
	}

	/**
	 * @param  {Electron.App} app
	 * @returns {Array<Array<string>>} Constants.ELECTRON_FLAGS The constants.js array of flags
	 * @description
	 * Get the Electron flags from the constants.js file and set them in the electron app.  
	 * Return the flags.
	 */
	public static setFlags(app: Electron.App): Array<Array<string | null>> {
		info('Setting Electron flags');

		for (const [ flag, value ] of ELECTRON_FLAGS) app.commandLine.appendSwitch(flag, value);
		return <Array<Array<string | null>>>ELECTRON_FLAGS;
	}

	/**
	 * @returns {Electron.BrowserWindow} splash Return the new splash BrowserWindow instance
	 * @description
	 * Create a new BrowserWindow instance for the splash window.
	 */
	public static createSplashWindow(): Electron.BrowserWindow {
		info('Creating new Splash window instance');

		return new BrowserWindow({
			...SPLASH_PHYSICAL_PARAMETERS,
			webPreferences: {
				...SPLASH_WEBPREFERENCES,
				preload: path.join(__dirname, '../preload/splash')
			}
		});
	}

	/**
	 * 
	 * @returns {string} version The package.json version
	 * @description
	 * Get the current version of the client from the package.
	 */
	public static getClientVersion(): string {
		const version: string = CLIENT_VERSION;
		return version;
	}

	/**
	 * @returns {string} releaseVersion The latest version of the client from GitHub
	 * @returns {Promise<ReleaseData>} ReleaseData Promise for the current version, latest version, and url of the client.
	 * @description
	 * Get the latest release from GitHub.  
	 * If none is found, return v0.0.0 to resolve with semver.
	 */
	private static async getReleaseData(): Promise<ReleaseData> {
		info('Getting latest GitHub release...');

		const newest: ReleaseData = await get(`https://api.github.com/repos/${ CLIENT_REPO }/releases/latest`)
			.then((response: { data: { tag_name: string; html_url: string; } }) => (<ReleaseData>{
				clientVersion: this.getClientVersion(),
				releaseVersion: response.data.tag_name,
				releaseUrl: response.data.html_url
			}))
			.catch(() => <ReleaseData>{
				clientVersion: this.getClientVersion(),
				releaseVersion: 'v0.0.0',
				releaseUrl: null
			}, warn('No latest GitHub release was found.'));

		return newest;
	}

	private static async emitReleaseData(splash: Electron.BrowserWindow): Promise<void> {
		splash.webContents.send(MESSAGE_RELEASES_DATA, await this.getReleaseData());
	}

};
