const { CLIENT_REPO, CLIENT_VERSION, ELECTRON_FLAGS, SPLASH_PHYSICAL_PARAMETERS, SPLASH_WEBPREFERENCES } = require('./constants.js');
const { setVibrancy } = require('electron-acrylic-window');
const { BrowserWindow } = require('electron');
const path = require('path');
const axios = require('axios');

exports.PreloadUtils = class {

	static getClientVersion() {
		const version = CLIENT_VERSION;
		return version;
	}
	static async getNewestGitHubVersion() {
		const newest = await axios.get(`https://api.github.com/repos/${ CLIENT_REPO }/releases/latest`);
		return newest;
	}

};

exports.SplashUtils = class {

	static setFlags(app) {
		for (const [ flag, value ] of ELECTRON_FLAGS) app.commandLine.appendSwitch(flag, value);
		return ELECTRON_FLAGS;
	}
	static createSplashWindow() {
		return new BrowserWindow({
			...SPLASH_PHYSICAL_PARAMETERS,
			webPreferences: {
				...SPLASH_WEBPREFERENCES,
				preload: path.join(__dirname, 'preload/splash.js')
			}
		});
	}
	static load(splash) {
		// Set the vibrancy of the splash window. Silly that you have to do it this way, but it works.
		setVibrancy(splash, 'dark');
		splash.removeMenu();
		splash.loadFile(path.join(__dirname, 'html/splash.html'));

		// Show the splash window when the DOM is fully loaded.
		splash.webContents.once('dom-ready', () => {
			splash.show();
		});

		return splash;
	}
	static setVersionElementAsClientVersion() {
		const version = exports.PreloadUtils.getClientVersion();
		const versionElement = document.getElementById('clientVersion');

		if (versionElement instanceof HTMLElement) versionElement.innerText = `v${ version }`;

		return versionElement;
	}

};
