require('v8-compile-cache');

const { SplashUtils } = require('./utils.js');
const { app } = require('electron');

class Initiator {

	constructor(_app) {
		this.app = _app;
		this.flags = SplashUtils.setFlags(this.app);
	}

	init() {
		this.splashWindow = SplashUtils.createSplashWindow();
		SplashUtils.load(this.splashWindow);
	}

}

const client = new Initiator(app);
client.app.on('ready', () => {
	client.init();
});
