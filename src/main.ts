import {
	CLIENT_AUTHOR,
	CLIENT_LICENSE_PERMALINK,
	CLIENT_NAME,
	GAME_CONSTRUCTOR_OPTIONS,
	IS_DEVELOPMENT,
	MESSAGES,
	TARGET_GAME_URL
} from '@constants';
import { app, ipcMain, protocol, session } from 'electron';
import { ElectronBlocker } from '@cliqz/adblocker-electron';
import TwitchUtils from '@twitch-utils';
import WindowUtils from '@window-utils';
import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import getFlags from '@flags';
import { info } from '@logger';
import { join } from 'path';

// eslint-disable-next-line no-console
console.log(`${ CLIENT_NAME }  Copyright (C) 2022  ${ CLIENT_AUTHOR }
This program comes with ABSOLUTELY NO WARRANTY.
This is free software, and you are welcome to redistribute it under certain
conditions; read ${ CLIENT_LICENSE_PERMALINK } for more details.\n`);

class Application {

	/** Run the things possible before the app reaches the ready state. */
	public static async preAppReady(): Promise<void> {
		Application.registerAppEventListeners();
		Application.registerIpcEventListeners();
		Application.setAppFlags();
	}

	/**
	 * Initialize the app, register protocols.  
	 * Create the game window.
	 */
	public static async init(): Promise<void> {
		Application.setAppName();
		Application.registerFileProtocols();

		const [client] = await Promise.all([
			TwitchUtils.createClient(),
			Application.enableTrackerBlocking()
		]);

		if (client === null) return;

		const gameWindow = await WindowUtils.createWindow(GAME_CONSTRUCTOR_OPTIONS, TARGET_GAME_URL);
		gameWindow.webContents.once('dom-ready', () => {
			client.connect();
			client.on('message', (_listener, chatUserstate, message) => {
				if (chatUserstate['message-type'] !== 'chat' || !message) return;

				gameWindow.webContents.send(MESSAGES.TWITCH_MESSAGE_RECEIVE, {
					chatUserstate,
					message
				});
			});

			// Setup event listener
			ipcMain.on(MESSAGES.TWITCH_MESSAGE_SEND, (_evt, message: string) => {
				const [channel] = client.getChannels();
				client.say(channel, message);
			});

			ipcMain.handle(MESSAGES.TWITCH_GET_INFO, async() => {
				const [channel] = client.getChannels();

				return {
					isLive: await TwitchUtils.isLive(),
					username: client.getUsername(),
					channel
				};
			});
		});
	}

	/** Register the listeners for the app process (e.g. 'window-all-closed') */
	private static registerAppEventListeners(): void {
		info('Registering app event listeners');

		app.on('quit', () => app.quit());
		app.on('window-all-closed', () => {
			if (process.platform !== 'darwin') app.quit();

			return null;
		});
		app.on('web-contents-created', (_evt, webContents) => {
			webContents.on('select-bluetooth-device', (evt, _devices, callback) => {
				evt.preventDefault();

				// Cancel the request
				callback('');
			});
		});
	}

	/** Register the listeners between ipcMain and ipcRenderer */
	private static registerIpcEventListeners(): void {
		info('Registering ipc event listeners');

		ipcMain.on(MESSAGES.EXIT_CLIENT, app.quit);
	}

	/** Set the app name and the userdata path properly under development. */
	private static setAppName(): void {
		if (IS_DEVELOPMENT) {
			app.setName(CLIENT_NAME);
			app.setPath('userData', join(app.getPath('appData'), CLIENT_NAME));
		}
	}

	/** Get Electron flags and append them. */
	private static async setAppFlags(): Promise<void> {
		info('Setting Electron flags');

		const { appendSwitch } = app.commandLine;
		for (const [flag, value] of await getFlags()) appendSwitch(flag, value);
	}

	/** Register resource swapper file protocols */
	private static registerFileProtocols(): void {
		// Register resource swapper file protocols.
		// TODO: User-defined protocol source / swapper location
		const protocolSource = global.resourceswapProtocolSource;

		protocol.registerFileProtocol(CLIENT_NAME, ({ url }, callback) => {
			callback(decodeURI(`${ protocolSource }${
				url.replace(`${ CLIENT_NAME }:`, '')
			}`));
		});
	}

	/** Enable ad and tracker blocking */
	private static async enableTrackerBlocking(): Promise<unknown> {
		info('Initializing tracker blocking');

		return ElectronBlocker.fromPrebuiltFull(fetch, {
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

if (!app.requestSingleInstanceLock()) { app.quit(); } else {
	Application.preAppReady();

	app.whenReady().then(async() => {
		await Application.init();

		info('Client initialized');
	});
}
