require('./aliases');
import Electron = require('electron');

const { app, protocol } = require('electron');
const { info } = require('electron-log');
const {
	CLIENT_NAME,
	CLIENT_AUTHOR,
	CLIENT_LICENSE_PERMALINK,
	TARGET_GAME_URL,
	SPLASH_CONSTRUCTOR_OPTIONS,
	GAME_CONSTRUCTOR_OPTIONS
} = require('@constants');
const { join } = require('path');
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

	/** @description Set flags, event listeners before the app is ready. */
	public constructor() {
		info('Constructing initializer class');

		SplashUtils.setFlags(app);
		this.eventHandler.registerEventListeners();
	}

	/**
	 * @returns {Promise<boolean>} Successful initialization
	 * @description
	 * Initialize the app, register protocols.  
	 * Create the splash window, followed by the game window.
	 */
	public async init(): Promise<boolean> {
		app.setName(CLIENT_NAME);

		// Register resource swapper file protocols. TODO: Dynamic protocol source.
		const protocolRegex = new RegExp(`^${ CLIENT_NAME }:`, 'u');
		const protocolSource = global.resourceswapProtocolSource;
		protocol.registerFileProtocol(CLIENT_NAME, (request, callback) => callback(decodeURI(`${ protocolSource }${ request.url.replace(protocolRegex, '') }`)));

		info('Initializing splash window');
		const splashLoadTime = Date.now();

		this.splashWindow = WindowUtils.createWindow(SPLASH_CONSTRUCTOR_OPTIONS);
		await SplashUtils.load(this.splashWindow);

		info(`Splash window done after ${ Date.now() - splashLoadTime } ms`);
		info('Initializing game window');

		this.gameWindow = WindowUtils.createWindow(GAME_CONSTRUCTOR_OPTIONS, TARGET_GAME_URL);
		await GameUtils.load(this.gameWindow, this.splashWindow);

		return true;
	}

}

// Register the protocol source for the resource swapper. TODO: User-specified protocol source in settings.
global.resourceswapProtocolSource = join(app.getPath('documents'), `/${ CLIENT_NAME }`);
protocol.registerSchemesAsPrivileged([{
	scheme: CLIENT_NAME,
	privileges: { secure: true, corsEnabled: true }
}]);

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
