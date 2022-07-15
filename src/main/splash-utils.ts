import {
	CLIENT_REPO,
	CLIENT_VERSION,
	IS_DEVELOPMENT,
	MESSAGE_RELEASES_DATA,
	MESSAGE_SPLASH_DONE
} from '@constants';
import { GitHubResponse, ReleaseData } from '@client';
import { info, warn } from '@logger';
import WindowUtils from '@window-utils';
import fetch from 'node-fetch';
import { ipcMain } from 'electron';
import { join } from 'path';

export default class {

	/**
	 * Load the splash window with the splash.html file.  
	 * Get the client release data and emit it to the splash window.  
	 * Show the window on ready-to-show and callback.
	 * @param window - The target window to load onto
	 * @returns Promise for when everything is done
	 */
	public static load(window: Electron.BrowserWindow): Promise<void> {
		window.loadFile(join(__dirname, '../renderer/html/splash.html'));

		// Show the splash window when things have all loaded.
		return new Promise(resolve => {
			window.webContents.once('did-finish-load', async() => {
				info('ready-to-show reached on Splash window');

				await this.emitReleaseData(window);
				window.show();

				// Resolve the promise when everything is done and dusted in the splash window.
				ipcMain.once(MESSAGE_SPLASH_DONE, () => {
					info(`${ MESSAGE_SPLASH_DONE } received`);
					WindowUtils.destroyWindow(window);

					resolve();
				});
			});
		});
	}

	/**
	 * Get the latest release from GitHub.  
	 * If none is found, return v0.0.0 to resolve with semver.
	 * @returns ReleaseData promise for current client version, latest client version, and (optional) url to update
	 */
	private static async getReleaseData(): Promise<ReleaseData> {
		info('Getting latest GitHub release...');

		if (!IS_DEVELOPMENT) {
			const response: GitHubResponse = await fetch(`https://api.github.com/repos/${ CLIENT_REPO }/releases/latest`);

			const { data } = await response.json();
			if (response.ok) {
				return <ReleaseData>{
					clientVersion: CLIENT_VERSION,
					releaseVersion: data.tag_name,
					releaseUrl: data.html_url
				};
			}

			warn(`Bad response getting latest release: ${ response.status } ${ response.statusText }`);
		} else {
			info('Development mode, skipping release check');
		}

		return <ReleaseData>{
			clientVersion: CLIENT_VERSION,
			releaseVersion: '0.0.0',
			releaseUrl: ''
		};
	}

	/**
	 * Emit the client release data to the splash window event listener.
	 * @param window - The target window to emit the release data to
	 */
	private static async emitReleaseData(window: Electron.BrowserWindow): Promise<void> {
		return window.webContents.send(MESSAGE_RELEASES_DATA, await this.getReleaseData());
	}

}
