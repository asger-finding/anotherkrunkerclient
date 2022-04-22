import { BrowserWindow as AcrylicBrowserWindow, setVibrancy } from 'electron-acrylic-window';
import {
	CLIENT_REPO,
	CLIENT_VERSION,
	ELECTRON_FLAGS,
	IS_DEVELOPMENT,
	MESSAGE_RELEASES_DATA,
	MESSAGE_SPLASH_DONE
} from '@constants';
import { info, warn } from 'electron-log';
import { ReleaseData } from '../client';
import WindowUtils from '@window-utils';
import { fetch } from 'cross-fetch';
import { ipcMain } from 'electron';
import { join } from 'path';

export default class {

	/**
	 * @param  {AcrylicBrowserWindow} window
	 * @returns {Promise<AcrylicBrowserWindow>} window promise
	 * @description
	 * Load the splash window with the splash.html file.  
	 * Get the client release data and emit it to the splash window.  
	 * Show the window on ready-to-show and callback.
	 */
	public static load(window: Electron.BrowserWindow): Promise<Electron.BrowserWindow> {
		// Set the vibrancy of the splash window
		setVibrancy((window as AcrylicBrowserWindow), {
			theme: 'dark',
			effect: 'blur'
		});
		window.loadFile(join(__dirname, '../renderer/html/splash.html'));

		// Show the splash window when things have all loaded.
		return new Promise(resolve => {
			window.webContents.once('did-finish-load', async() => {
				info('ready-to-show reached on Splash window');

				await this.emitReleaseData(window);
				if (IS_DEVELOPMENT) window.webContents.openDevTools({ mode: 'detach' });
				window.show();

				// Resolve the promise when everything is done and dusted in the splash window.
				ipcMain.once(MESSAGE_SPLASH_DONE, () => {
					info(`${ MESSAGE_SPLASH_DONE } received`);

					// Hack to close the splash window without ending the electron process. TODO: Find better method.
					setTimeout(() => {
						WindowUtils.destroyWindow(window);
					}, 1);

					return resolve(window);
				});
			});
		});
	}

	/**
	 * @param  {Electron.App} app
	 * @description
	 * Get Electron flags from Constants and set them in the app.  
	 * Return the flags.
	 */
	public static setFlags(app: Electron.App): void {
		info('Setting Electron flags');

		for (const flag of Object.keys(ELECTRON_FLAGS)) app.commandLine.appendSwitch(flag, ELECTRON_FLAGS[flag as keyof typeof ELECTRON_FLAGS] ?? '');
	}

	/**
	 * @returns {Promise<ReleaseData>} ReleaseData promise for current client version, latest client version, and (optional) url to update
	 * @description
	 * Get the latest release from GitHub.  
	 * If none is found, return v0.0.0 to resolve with semver.
	 */
	private static async getReleaseData(): Promise<ReleaseData> {
		info('Getting latest GitHub release...');

		return fetch(`https://api.github.com/repos/${ CLIENT_REPO }/releases/latest`)
			.then((response: any) => {
				if (response.status >= 400) throw new Error(response.status);
				return response.json();
			})
			.then((response: { data: { tag_name: string, html_url: string } }) => (<ReleaseData>{
				clientVersion: CLIENT_VERSION,
				releaseVersion: response.data.tag_name,
				releaseUrl: response.data.html_url
			}))
			.catch((err: Error) => {
				warn(`Bad response getting GitHub release: ${ err.message }`);
				return <ReleaseData>{
					clientVersion: CLIENT_VERSION,
					releaseVersion: '0.0.0',
					releaseUrl: ''
				};
			});
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

}
