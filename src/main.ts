import './aliases';

import { BrowserWindow, app, protocol, session } from 'electron';
import {
	CLIENT_AUTHOR,
	CLIENT_LICENSE_PERMALINK,
	CLIENT_NAME,
	GAME_CONSTRUCTOR_OPTIONS,
	IS_DEVELOPMENT,
	SPLASH_CONSTRUCTOR_OPTIONS,
	TARGET_GAME_URL,
	WINDOW_ALL_CLOSED_BUFFER_TIME
} from '@constants';
import { ElectronBlocker } from '@cliqz/adblocker-electron';
import EventHandler from '@event-handler';
import SplashUtils from '@splash-utils';
import WindowUtils from '@window-utils';
import { promises as fs } from 'fs';
import { info } from '@logger';
import { join } from 'path';

// eslint-disable-next-line no-console
console.log(`${ CLIENT_NAME }  Copyright (C) 2022  ${ CLIENT_AUTHOR }
This program comes with ABSOLUTELY NO WARRANTY.
This is free software, and you are welcome to redistribute it under certain
conditions; read ${ CLIENT_LICENSE_PERMALINK } for more details.\n`);

class Application {

	private eventHandler = new EventHandler();

	/** Set flags, event listeners before the app is ready. */
	public constructor() {
		info('Constructing Application class');

		SplashUtils.setFlags(app);
		this.eventHandler.registerAppEventListeners();
	}

	/**
	 * Initialize the app, register protocols.  
	 * Create the splash window, followed by the game window.
	 */
	public async init(): Promise<void> {
		Application.setAppName();
		Application.registerFileProtocols();

		await Promise.all([
			WindowUtils.createWindow(SPLASH_CONSTRUCTOR_OPTIONS).then(window => SplashUtils.load(window)),
			Application.enableTrackerBlocking()
		]);
		WindowUtils.createWindow(GAME_CONSTRUCTOR_OPTIONS, TARGET_GAME_URL);
	}

	/** Set the app name and the userdata path properly under development. */
	private static setAppName(): void {
		if (IS_DEVELOPMENT) {
			app.setName(CLIENT_NAME);
			app.setPath('userData', join(app.getPath('appData'), CLIENT_NAME));
		}
	}

	/** Register resource swapper file protocols */
	private static registerFileProtocols(): void {
		// Register resource swapper file protocols.
		// TODO: Dynamic protocol source.
		const protocolSource = global.resourceswapProtocolSource;

		protocol.registerFileProtocol(CLIENT_NAME, ({ url }, callback) => {
			callback(decodeURI(`${ protocolSource }${
				url.replace(`${ CLIENT_NAME }:`, '')
			}`));
		});
	}

	/** Enable ad and tracker blocking */
	private static async enableTrackerBlocking(): Promise<unknown> {
		return ElectronBlocker.fromPrebuiltFull((await import('cross-fetch')).fetch, {
			path: `${ app.getPath('userData') }/electronblocker-cache.bin`,
			read: fs.readFile,
			write: fs.writeFile
		}).then(blocker => blocker.enableBlockingInSession(session.defaultSession));
	}

}

// Register the protocol source for the resource swapper.
// TODO: User-specified protocol source in settings.
global.resourceswapProtocolSource = join(app.getPath('documents'), `/${ CLIENT_NAME }`);
protocol.registerSchemesAsPrivileged([
	{
		scheme: CLIENT_NAME,
		privileges: { secure: true, corsEnabled: true }
	}
]);

app.on('quit', () => app.quit());
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		// Allow some buffer time where one window may close so another one can open.
		return setTimeout(() => {
			const windowCount = BrowserWindow.getAllWindows().length;
			if (windowCount === 0) app.quit();
		}, WINDOW_ALL_CLOSED_BUFFER_TIME);
	}

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

	app.whenReady().then(async() => {
		await client.init();

		info('Client initialized');
	});
}
