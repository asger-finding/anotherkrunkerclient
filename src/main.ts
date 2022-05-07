import './aliases';

import {
	CLIENT_AUTHOR,
	CLIENT_LICENSE_PERMALINK,
	CLIENT_NAME,
	GAME_CONSTRUCTOR_OPTIONS,
	SPLASH_CONSTRUCTOR_OPTIONS,
	TARGET_GAME_URL
} from '@constants';
import { app, protocol } from 'electron';
import EventHandler from '@event-handler';
import SplashUtils from '@splash-utils';
import WindowUtils from '@window-utils';
import { info } from 'electron-log';
import { join } from 'path';

// eslint-disable-next-line no-console
console.log(`${ CLIENT_NAME }  Copyright (C) 2022  ${ CLIENT_AUTHOR }
This program comes with ABSOLUTELY NO WARRANTY.
This is free software, and you are welcome to redistribute it under certain
conditions; read ${ CLIENT_LICENSE_PERMALINK } for more details.\n`);

class Application {

	private splashWindow: Electron.BrowserWindow;

	private gameWindow: Electron.BrowserWindow;

	private eventHandler = new EventHandler();

	/** Set flags, event listeners before the app is ready. */
	public constructor() {
		info('Constructing initializer class');

		SplashUtils.setFlags(app);
		this.eventHandler.registerEventListeners();
	}

	/**
	 * Initialize the app, register protocols.  
	 * Create the splash window, followed by the game window.
	 */
	public async init(): Promise<void> {
		app.setName(CLIENT_NAME);

		// Register resource swapper file protocols. TODO: Dynamic protocol source.
		const protocolRegex = new RegExp(`^${ CLIENT_NAME }:`, 'u');
		const protocolSource = global.resourceswapProtocolSource;
		protocol.registerFileProtocol(CLIENT_NAME, (request, callback) => callback(decodeURI(`${ protocolSource }${ request.url.replace(protocolRegex, '') }`)));

		info('Initializing splash window');
		const splashLoadTime = Date.now();

		this.splashWindow = await WindowUtils.createWindow(SPLASH_CONSTRUCTOR_OPTIONS);
		await SplashUtils.load(this.splashWindow);

		info(`Splash window done after ${ Date.now() - splashLoadTime } ms`);
		info('Initializing game window');

		this.gameWindow = await WindowUtils.createWindow(GAME_CONSTRUCTOR_OPTIONS, TARGET_GAME_URL);
	}

}

// Register the protocol source for the resource swapper. TODO: User-specified protocol source in settings.
global.resourceswapProtocolSource = join(app.getPath('documents'), `/${ CLIENT_NAME }`);
protocol.registerSchemesAsPrivileged([
	{
		scheme: CLIENT_NAME,
		privileges: { secure: true, corsEnabled: true }
	}
]);

app.on('quit', () => app.quit());
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') return app.quit();
	return null;
});
app.on('web-contents-created', (_event, webContents) => {
	webContents.on('select-bluetooth-device', (evt, _devices, callback) => {
		evt.preventDefault();

		// Cancel the request
		callback('');
	});
});

if (!app.requestSingleInstanceLock()) { app.quit(); } else {
	const client = new Application();

	app.whenReady().then(async(): Promise<void> => {
		await client.init();

		info('Client initialized');
	});
}
