import { CLIENT_NAME, TARGET_GAME_DOMAIN } from '@constants';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { error } from 'electron-log';
import { join } from 'path';

export default class {

	/** Target directory path. */
	private target: string = global.resourceswapProtocolSource;

	/** Target window. */
	private window: Electron.BrowserWindow;

	/** The list of URLs to swap. */
	private urls: string[] = [];

	/**
	 * Set the target window.
	 * @param window - The target window.
	 */
	public constructor(window: Electron.BrowserWindow) {
		this.window = window;
	}

	/** Initialize the resource swapper for the target window.*/
	public start(): void {
		// If the target directory doesn't exist, create it.
		if (!existsSync(global.resourceswapProtocolSource)) mkdirSync(global.resourceswapProtocolSource, { recursive: true });

		this.recursiveSwap('');
		if (this.urls.length) {
			this.window.webContents.session.webRequest.onBeforeRequest({ urls: this.urls }, (details, callback) => {
				const path = new URL(details.url).pathname;
				callback({ redirectURL: `${ CLIENT_NAME }:/${ path.startsWith('/assets/') ? path.substring(7) : path }` });
			});
		}

		// Fix CORS problem with browserfps.com.
		this.window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
			for (const key in details.responseHeaders) {
				const lowercase = key.toLowerCase();

				// If the credentials mode is 'include', callback normally or the request will error with CORS.
				if (lowercase === 'access-control-allow-credentials' && details.responseHeaders[key][0] === 'true') return callback(details.responseHeaders);

				// Response headers may have varying letter casing, so we need to check in lowercase.
				if (lowercase === 'access-control-allow-origin') {
					delete details.responseHeaders[key];
					break;
				}
			}

			return callback({
				responseHeaders: {
					...details.responseHeaders,
					'access-control-allow-origin': ['*']
				}
			});
		});
	}

	/**
	 * Recursively swap all files in the target directory.
	 * @param prefix - The target directory to swap.
	 */
	private recursiveSwap(prefix: string): void {
		try {
			for (const dirent of readdirSync(join(this.target, prefix), { withFileTypes: true })) {
				const name = `${ prefix }/${ dirent.name }`;

				// If the file is a directory, swap it recursively.
				if (dirent.isDirectory()) { this.recursiveSwap(name); } else {
					// browserfps.com has the server name as the subdomain instead of 'assets', so we must take that into account.
					const tests = [
						`*://*.${ TARGET_GAME_DOMAIN }${ name }`,
						`*://*.${ TARGET_GAME_DOMAIN }${ name }?*`,
						`*://*.${ TARGET_GAME_DOMAIN }/assets${ name }`,
						`*://*.${ TARGET_GAME_DOMAIN }/assets${ name }?*`
					];
					this.urls.push(...(/^\/(?:models|textures|sound|scares)(?:$|\/)/u.test(name)
						? tests
						: [
							...tests,
							`*://comp.${ TARGET_GAME_DOMAIN }${ name }?*`,
							`*://comp.${ TARGET_GAME_DOMAIN }assets/${ name }?*`
						]
					));
				}
			}
		} catch (err) {
			error('Failed to resource-swap', err, prefix);
		}
	}

}
