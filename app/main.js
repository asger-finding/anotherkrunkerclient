require('v8-compile-cache');

const SplashUtils = require('./utils/SplashUtils.js');
const { app } = require('electron');

class Initiator {

	/**
	 * @param  {Electron.App} _app
	 * @description
	 * Set the Electron flags before initializing the windows.
	 */
	constructor(_app) {
		this.app = _app;
		this.flags = SplashUtils.setFlags(this.app);
	}

	/**
	 * @returns {Boolean} success Whether the app was successfully initialized
	 * @description
	 * Initialize the app and create the splash window.
	 */
	init() {
		this.splashWindow = SplashUtils.createSplashWindow();
		SplashUtils.load(this.splashWindow);

		return true;
	}

}

const client = new Initiator(app);
client.app.on('ready', () => {
	client.init();
});
