import {
	CLIENT_AUTHOR,
	CLIENT_LICENSE_PERMALINK,
	CLIENT_NAME,
	IS_DEVELOPMENT,
	MESSAGES,
	TABS,
	TARGET_GAME_URL
} from '@constants';
import { ElectronBlocker, fullLists as cliqzFullList } from '@cliqz/adblocker-electron';
import { Saveables, StoreConstants } from '@settings-backend';
import Store, { initRenderer } from 'electron-store';
import WindowUtils, { getDefaultConstructorOptions } from '@window-utils';
import { app, ipcMain, protocol, session } from 'electron';
import { join, resolve } from 'path';
import PatchedStore from '@store';
import TwitchUtils from '@twitch-utils';
import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import getFlags from '@flags';
import { info } from '@logger';

// eslint-disable-next-line no-console
console.log(`${ CLIENT_NAME }  Copyright (C) 2023  ${ CLIENT_AUTHOR }
This program comes with ABSOLUTELY NO WARRANTY.
This is free software, and you are welcome to redistribute it under certain
conditions; read ${ CLIENT_LICENSE_PERMALINK } for more details.\n`);

class Application {

	private store: Store;

	private blockerEngine: ElectronBlocker;

	/**
	 * 
	 */
	constructor() {
		Application.setAppName();
		Application.registerAppEventListeners();
		Application.registerIpcEventListeners();
		Application.setAppFlags();
	}

	/**
	 * Initialize the app, register protocols.  
	 * Create the game window.
	 */
	public async init(): Promise<void> {
		const store = new PatchedStore();
		this.store = store;

		this.registerFileProtocols();

		const [client] = await Promise.all([
			TwitchUtils.createClient(),
			this.enableTrackerBlocking()
		]);

		if (client === null) return;

		const gameWindow = await WindowUtils.createWindow({
			...getDefaultConstructorOptions(TABS.GAME),
			show: false,
			webPreferences: {
				...getDefaultConstructorOptions(TABS.GAME).webPreferences,
				preload: resolve(__dirname, './preload/game'),
				contextIsolation: false,
				nodeIntegrationInSubFrames: true
			}
		}, TARGET_GAME_URL);
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

		// Kill the application when it's broadcast that user attempts to exit the client
		ipcMain.on(MESSAGES.EXIT_CLIENT, app.quit);

		// Handle the user attempting to clear the electron blocker cache
		ipcMain.handle(MESSAGES.CLEAR_ELECTRON_BLOCKER_CACHE, async() => {
			const cachePath = `${ app.getPath('userData') }/electronblocker-cache.bin`;

			// Attempt to delete the file and catch an error (presumably that it doesn't exist)
			const initialResult = await fs.unlink(cachePath).catch(() => ({
				result: false,
				message: 'Cache does already not exist'
			}));

			if (initialResult) return initialResult;

			// Check that it worked
			const worked = await fs.access(cachePath)
				.then(() => ({
					result: false,
					message: 'For reason unknown, the cache still exists — please report!'
				}))
				.catch(() => ({ result: true }));

			return worked;
		});
	}

	/** Set the app name and the userdata path properly under development. */
	private static setAppName(): void {
		if (IS_DEVELOPMENT) {
			app.setName(CLIENT_NAME);
			app.setPath('userData', join(app.getPath('appData'), CLIENT_NAME));
		}
		initRenderer();
	}

	/** Get Electron flags and append them. */
	private static async setAppFlags(): Promise<void> {
		info('Setting Electron flags');

		const { appendSwitch } = app.commandLine;
		for (const [flag, value] of await getFlags()) appendSwitch(flag, value);
	}

	/**
	 * Register resource swapper file protocols
	 */
	private registerFileProtocols(): void {
		// Register the protocol source for the resource swapper.
		global.resourceswapProtocolSource = this.store.get(`${ StoreConstants.PREFIX }.${ Saveables.RESOURCE_SWAPPER_PATH }`) as string
		|| join(app.getPath('documents'), `/${ CLIENT_NAME }`);

		// Register resource swapper file protocols.
		const protocolSource = global.resourceswapProtocolSource;

		protocol.registerFileProtocol(CLIENT_NAME, ({ url }, callback) => {
			callback(decodeURI(`${ protocolSource }${
				url.replace(`${ CLIENT_NAME }:`, '')
			}`));
		});
	}

	/**
	 * Enable full Cliqz ad and tracker blocking
	 * and apply user-defined filters from URLs
	 * and the swapper as well.
	 */
	private async enableTrackerBlocking(): Promise<void> {
		info('Initializing tracker blocking');

		// Local files
		const swapperFilterLists: string[] = [];

		// Read the user-defined filter lists. The JSON should already be validated.
		const urlFilterLists = (JSON.parse(this.store.get(`${StoreConstants.PREFIX}.${Saveables.USER_FILTER_LISTS}`, '[]') as string) as string[])
			.filter(filterList => {
				// Iterate over. If an item is prefixed with `swapper://`,
				// filter it out and push it to the other array
				if (filterList.startsWith('swapper://')) {
					swapperFilterLists.push(filterList);
					return false;
				}
				return true;
			});

		this.blockerEngine = await ElectronBlocker.fromLists(fetch, [
			...cliqzFullList,
			...urlFilterLists
		], { enableCompression: true }, {
			path: `${ app.getPath('userData') }/electronblocker-cache.bin`,
			read: fs.readFile,
			write: fs.writeFile
		});

		// Iterate over and read the local files
		// Update the engine to include these additions
		if (swapperFilterLists.length) {
			const promises = swapperFilterLists.map(filterList => fs.readFile(join(global.resourceswapProtocolSource, filterList.replace('swapper://', '')), 'utf-8'));
			const filters: string[] = await Promise.all(promises);

			// Updating the engine is significantly slower than writing to the cache once
			// For this reason, URL lists are preferred
			this.blockerEngine.updateFromDiff({ added: filters });
		}

		// Start blocking
		this.blockerEngine.enableBlockingInSession(session.defaultSession);

		info('Tracker blocking initialized');
	}

}

protocol.registerSchemesAsPrivileged([
	{
		scheme: CLIENT_NAME,
		privileges: { secure: true, corsEnabled: true }
	}
]);

if (!app.requestSingleInstanceLock()) { app.quit(); } else {
	const application = new Application();

	app.whenReady().then(() => application.init());
}
