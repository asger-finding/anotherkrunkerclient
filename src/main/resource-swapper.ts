const fs = require('fs');
const { join } = require('path');
const { CLIENT_NAME, TARGET_GAME_DOMAIN } = require('@constants');
const { error } = require('electron-log');

module.exports = class {

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

	/**
	 * @description
	 * Initialize the resource swapper for the target window.
	 */
	public start(): void {
		// If the target directory doesn't exist, create it.
		if (!fs.existsSync(global.resourceswapProtocolSource)) {
			fs.mkdir(global.resourceswapProtocolSource, { recursive: true }, (err: Error) => {
				if (err) error('Error creating resource-swap folder', err);
			});
		}

		this.recursiveSwap('');
		if (this.urls.length) {
			this.window.webContents.session.webRequest.onBeforeRequest({ urls: this.urls }, (details, callback) => {
				const path = new URL(details.url).pathname;
				callback({ redirectURL: `${ CLIENT_NAME }:/${ path.startsWith('/assets/') ? path.substring(7) : path }` });
			});
		}

		this.window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
			if (details.responseHeaders && details.responseHeaders['access-control-allow-credentials']) return callback(details.responseHeaders);

			for (const key in details.responseHeaders) {
				if (key.toLowerCase() === 'access-control-allow-origin') {
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

};
