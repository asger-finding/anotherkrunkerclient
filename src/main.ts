import Electron = require('electron');
import 'module-alias/register';
require('v8-compile-cache');

const { CLIENT_NAME, CLIENT_AUTHOR, CLIENT_LICENSE_SHORTLINK } = require('./constants');
const SplashUtils = require('./utils/SplashUtils.js');
const { app } = require('electron');
const { info } = require('electron-log');

// eslint-disable-next-line no-console
console.log(`${ CLIENT_NAME }  Copyright (C) 2022  ${ CLIENT_AUTHOR }
This program comes with ABSOLUTELY NO WARRANTY.
This is free software, and you are welcome to redistribute it under certain
conditions; read ${ CLIENT_LICENSE_SHORTLINK } for more details.\n`);

class Initializer {

	private splashWindow: Electron.BrowserWindow | undefined;

	/**
	 * @description
	 * Set the Electron flags before initializing the windows.
	 */
	public constructor() {
		info('Constructing initializer class');

		SplashUtils.setFlags(app);
	}

	/**
	 * @returns {Promise<boolean>} success Whether the app was successfully initialized
	 * @description
	 * Initialize the app and create the splash window.
	 */
	public async init() : Promise<boolean> {
		info('INITIALIZING SPLASH WINDOW');

		const splashLoadTime = Date.now();
		this.splashWindow = SplashUtils.createSplashWindow();
		await SplashUtils.load(this.splashWindow);

		info(`Splash window done after ${ Date.now() - splashLoadTime } ms`);
		info('INITIALIZING GAME WINDOW');

		return true;
	}

}

const client = new Initializer();
app.on('ready', async() => {
	await client.init();
});
