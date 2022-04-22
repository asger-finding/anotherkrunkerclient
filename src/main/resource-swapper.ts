import * as fs from 'fs';
import { CLIENT_NAME, TARGET_GAME_DOMAIN } from '@constants';
import { error } from 'electron-log';
import { join } from 'path';

export default class {

	/**
	 * @type {string}
	 * @description Target directory path.
	 */
	private target: string = global.resourceswapProtocolSource;

	/**
	 * @type {Electron.BrowserWindow}
	 * @description Target window.
	 */
	private window: Electron.BrowserWindow;

	/**
	 * @type {string[]}
	 * @description The list of URLs to swap.
	 */
	private urls: string[] = [];

	/**
	 * @param {Electron.BrowserWindow} window The target window.
	 * @description Set the target window.
	 */
	public constructor(window: Electron.BrowserWindow) {
		this.window = window;
	}

	/** @description Initialize the resource swapper for the target window.*/
	public start(): void {
		// If the target directory doesn't exist, create it.
		if (!fs.existsSync(global.resourceswapProtocolSource)) fs.mkdirSync(global.resourceswapProtocolSource, { recursive: true });

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
	 * @param {string} prefix The target directory to swap.
	 * @description
	 * Recursively swap all files in the target directory.
	 */
	private recursiveSwap(prefix: string): void {
		try {
			for (const dirent of fs.readdirSync(join(this.target, prefix), { withFileTypes: true })) {
				const name = `${ prefix }/${ dirent.name }`;

				// If the file is a directory, swap it recursively.
				if (dirent.isDirectory()) { this.recursiveSwap(name); } else {
					// browserfps.com has the server name as the subdomain instead of 'assets', so we need to take that into account.
					const tests = [
						`*://*.${ TARGET_GAME_DOMAIN }${ name }`,
						`*://*.${ TARGET_GAME_DOMAIN }${ name }?*`,
						`*://*.${ TARGET_GAME_DOMAIN }/assets${ name }`,
						`*://*.${ TARGET_GAME_DOMAIN }/assets${ name }?*`
					];
					this.urls.push(...(/^\/(models|textures|sound|scares)($|\/)/u.test(name)
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
