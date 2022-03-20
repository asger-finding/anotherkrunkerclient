require('./aliases');
import Electron = require('electron');

const { app } = require('electron');
const { info } = require('electron-log');
const {
	CLIENT_NAME,
	CLIENT_AUTHOR,
	CLIENT_LICENSE_PERMALINK,
	SPLASH_CONSTRUCTOR_OPTIONS,
	GAME_CONSTRUCTOR_OPTIONS
} = require('@constants');
const WindowUtils = require('@window-utils');
const SplashUtils = require('@splash-utils');
const GameUtils = require('@game-utils');
const EventHandler = require('@event-handler');

// eslint-disable-next-line no-console
console.log(`${ CLIENT_NAME }  Copyright (C) 2022  ${ CLIENT_AUTHOR }
This program comes with ABSOLUTELY NO WARRANTY.
This is free software, and you are welcome to redistribute it under certain
conditions; read ${ CLIENT_LICENSE_PERMALINK } for more details.\n`);

class Application {

	private splashWindow: Electron.BrowserWindow | null;

	private gameWindow: Electron.BrowserWindow;

	private eventHandler = new EventHandler();

	/**
	 * @description
	 * Set flags, event listeners before the app is ready.
	 */
	public constructor() {
		info('Constructing initializer class');

		SplashUtils.setFlags(app);
		this.eventHandler.registerEventListeners();
	}

	/**
	 * @returns {Promise<boolean>} Successful initialization
	 * @description
	 * Initialize the app and create the splash window.
	 */
	public async init(): Promise<boolean> {
		info('Initializing splash window');
		const splashLoadTime = Date.now();

		this.splashWindow = WindowUtils.createWindow(SPLASH_CONSTRUCTOR_OPTIONS);
		await SplashUtils.load(this.splashWindow);

		info(`Splash window done after ${ Date.now() - splashLoadTime } ms`);
		info('Initializing game window');

		this.gameWindow = WindowUtils.createWindow(GAME_CONSTRUCTOR_OPTIONS);
		await GameUtils.load(this.gameWindow, this.splashWindow);

		return true;
	}

}

const client = new Application();
app.once('ready', async() => {
	await client.init();

	info('Client initialized');
});

app.on('quit', () => app.quit());
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') return app.quit();
	return null;
});
