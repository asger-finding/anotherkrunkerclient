const fs = require('fs');
const { join } = require('path');
const { CLIENT_NAME } = require('@constants');
const { error } = require('electron-log');

module.exports = class {

	// Target directory path.
	private target: string = global.resourceswapProtocolSource;

	// Target window.
	private window: Electron.BrowserWindow;

	// The list of URLs to swap.
	private urls: string[] = [];

	/**
	 * @param {Electron.BrowserWindow} window The target window.
	 * @description
	 * Set the target window.
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
				callback({ redirectURL: `${ CLIENT_NAME }:/${ new URL(details.url).pathname }` });
			});
		}
	}

	/**
	 * @param {string} prefix The target directory to swap.
	 * @description
	 * Recursively swap all files in the target directory.
	 */
	private recursiveSwap(prefix: string): void {
		try {
			for (const dirent of fs.readdirSync(join(this.target, prefix), { withFileTypes: true })) {
				const name = `${prefix}/${dirent.name}`;

				// If the file is a directory, swap it recursively.
				if (dirent.isDirectory()) { this.recursiveSwap(name); } else {
					this.urls.push(...(/^\/(models|textures|sound|scares)($|\/)/u.test(name)
						? [
							`*://assets.krunker.io${name}`,
							`*://assets.krunker.io${name}?*`
						]
						: [
							`*://krunker.io${name}`,
							`*://krunker.io${name}?*`,
							`*://comp.krunker.io${name}`,
							`*://comp.krunker.io${name}?*`
						]
					));
				}
			}
		} catch (err) {
			error('Failed to resource-swap', err, prefix);
		}
	}

};
