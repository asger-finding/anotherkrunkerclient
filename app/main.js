require('v8-compile-cache');

const SplashUtils = require('./utils/SplashUtils.js');
const { app } = require('electron');
const { info } = require('electron-log');

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
	init() {
		info('Initializing app');

		this.splashWindow = SplashUtils.createSplashWindow();
		SplashUtils.load(this.splashWindow);

		return true;
	}

}

const client = new Initializer(app);
client.app.on('ready', () => {
	client.init();
});
