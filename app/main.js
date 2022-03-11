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

	/**
	 * @param  {Electron.App} _app
	 * @description
	 * Set the Electron flags before initializing the windows.
	 */
	constructor(_app) {
		info('Constructing initializer class');

		this.app = _app;
		this.flags = SplashUtils.setFlags(this.app);
	}

	/**
	 * @returns {Boolean} success Whether the app was successfully initialized
	 * @description
	 * Initialize the app and create the splash window.
	 */
	async init() {
		info('INITIALIZING SPLASH WINDOW');
		let splashLoadTime = Date.now();

		this.splashWindow = SplashUtils.createSplashWindow();
		await SplashUtils.load(this.splashWindow);

		splashLoadTime = Date.now() - splashLoadTime;

		info(`SPLASH WINDOW LOADED IN ${ splashLoadTime } ms`);

		info('INITIALIZING GAME WINDOW');
	}

}

const client = new Initializer(app);
client.app.on('ready', () => {
	client.init();
});
