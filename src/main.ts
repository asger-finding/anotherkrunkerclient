require('./aliases.js');
import Electron = require('electron');

const { CLIENT_NAME, CLIENT_AUTHOR, CLIENT_LICENSE_PERMALINK } = require('@constants');
const { app } = require('electron');
const { info } = require('electron-log');
const SplashUtils = require('./utils/SplashUtils');

// eslint-disable-next-line no-console
console.log(`${ CLIENT_NAME }  Copyright (C) 2022  ${ CLIENT_AUTHOR }
This program comes with ABSOLUTELY NO WARRANTY.
This is free software, and you are welcome to redistribute it under certain
conditions; read ${ CLIENT_LICENSE_PERMALINK } for more details.\n`);

class Initializer {

	private splashWindow: Electron.BrowserWindow | undefined;

	/**
	 * @description
	 * Set the Electron flags before initializing the app.
	 */
	public constructor() {
		info('Constructing initializer class');

		SplashUtils.setFlags(app);
	}

	/**
	 * @returns {Promise<boolean>} Successful initialization
	 * @description
	 * Initialize the app and create the splash window.
	 */
	public async init(): Promise<boolean> {
		info('Initializing splash window');
		const splashLoadTime = Date.now();

		this.splashWindow = SplashUtils.createSplashWindow();
		await SplashUtils.load(this.splashWindow);

		info(`Splash window done after ${ Date.now() - splashLoadTime } ms`);
		info('Initializing game window');

		return true;
	}

}

const client = new Initializer();
app.on('ready', async() => {
	await client.init();

	info('Client initialized');
});
