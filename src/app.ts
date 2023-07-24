import { CLIENT_AUTHOR, CLIENT_LICENSE_PERMALINK, CLIENT_NAME, DISCORD, MESSAGES, TABS, TARGET_GAME_URL } from '@constants';
import { Client as DiscordClient, type SetActivity } from '@xhayper/discord-rpc';
import { ElectronBlocker, fullLists as cliqzFullList } from '@cliqz/adblocker-electron';
import { Savable, StoreConstants } from '@settings-backend';
import WindowUtils, { getConstructorOptions } from '@window-utils';
import { app, ipcMain, protocol, session } from 'electron';
import { join, resolve } from 'path';
import Store from 'electron-store';
import TwitchUtils from '@twitch-utils';
import fetch from 'electron-fetch';
import { promises as fs } from 'fs';
import getFlags from '@flags';
import { info } from '@logger';

// eslint-disable-next-line no-console
console.log(`${ CLIENT_NAME }  Copyright (C) 2023  ${ CLIENT_AUTHOR }
This program comes with ABSOLUTELY NO WARRANTY.
This is free software, and you are welcome to redistribute it under certain
conditions; read ${ CLIENT_LICENSE_PERMALINK } for more details.\n`);

export default class Application {

	/** Preload app configurations that can be set before app.ready */
	constructor() {
		Application.connectDiscordRPC();
		Application.registerAppEventListeners();
		Application.registerIpcEventListeners();
		Application.setAppFlags();
	}

	private store = new Store();

	private blockerEngine: ElectronBlocker;

	/**
	 * Initialize the app after app.ready.
	 * 
	 * Initalize the store  
	 * Register the resource swapper  
	 * Initialize Twitch in the main process,
	 * register Twitch event handlers  
	 * Spawn the primary BrowserWindow
	 */
	public async launch(): Promise<void> {
		if (!app.isReady()) throw new Error('App must be ready before Application.launch()');
		this.registerSwapperProtocols();

		const [twitchClient] = await Promise.all([
			TwitchUtils.createClient(),
			this.enableTrackerBlocking()
		]);

		const tab = Application.getTabToLaunch();
		Application.spawnWindowFromTab(tab);

		if (twitchClient === null) return;
		twitchClient.connect()
			.then(() => Application.sendToAllGameWindows(MESSAGES.TWITCH_READY));

		// When the channel receives a message
		twitchClient.on('message', (_listener, chatUserstate, message) => {
			if (chatUserstate['message-type'] !== 'chat' || !message) return;

			Application.sendToAllGameWindows(MESSAGES.TWITCH_MESSAGE_RECEIVE, { chatUserstate, message });
		});

		// When a message is deleted on the channel
		twitchClient.on('messagedeleted', (_channel, _username, _deletedMessage, deletedChatUserstate) => {
			const uuid = deletedChatUserstate['target-msg-id'];
			Application.sendToAllGameWindows(MESSAGES.TWITCH_MESSAGE_DELETE, uuid);
		});

		// When the renderer requests the channel state
		ipcMain.handle(MESSAGES.TWITCH_GET_INFO, async() => {
			const channels = twitchClient.getChannels();
			return {
				isLive: await TwitchUtils.isLive(),
				username: twitchClient.getUsername(),
				channel: channels[0]
			};
		});

		// When the client user sends an in-game message to from Krunker to Twitch
		ipcMain.on(MESSAGES.TWITCH_MESSAGE_SEND, (_evt, message: string) => {
			const [channel] = twitchClient.getChannels();
			twitchClient.say(channel, message);
		});
	}

	/**
	 * Emit an event to the ipcRenderer of all game windows.
	 * 
	 * @param channel ipcRenderer channel
	 * @param args Arguments to pass
	 */
	private static sendToAllGameWindows(channel: string, ...args: unknown[]): void {
		for (const browserWindow of WindowUtils.getAllWindowsOfType(TABS.GAME)) browserWindow.webContents.send(channel, ...args);
	}

	/**
	 * Initialize Discord RPC client and setup Discord ipc bridge
	 */
	private static connectDiscordRPC(): void {
		const discordClient = new DiscordClient({
			clientId: DISCORD.CLIENT_ID,
			transport: { type: 'ipc' }
		});
		const discordRPCReady = new Promise<void>(res => discordClient.on('ready', res));
		discordClient.login();

		ipcMain.on(MESSAGES.UPDATE_GAME_ACTIVITY, async(_evt, data: SetActivity) => {
			await discordRPCReady;
			discordClient.user?.setActivity(data);
		});
	}

	/**
	 * **Linux-only feature**  
	 * Get the tab to point the client to, as provided by process arguments.
	 * 
	 * @param argv Process args or arguments passed to function
	 * @returns Extracted tab, defaulting to game tab
	 */
	private static getTabToLaunch(argv = process.argv): TABS | string {
		let tab: string = TABS.GAME;
		for (const arg of argv.slice(2)) {
			if (arg.startsWith('--tab')) tab = arg.slice(arg.indexOf('=') + 1);
			break;
		}

		return tab;
	}

	/**
	 * Conditionally spawn a BrowserWindow instance based on the tab argument
	 * 
	 * For example, a "game" tab will create a BrowserWindow
	 * with options designed for a game instance.
	 * 
	 * @param tab Tab to depend upon
	 */
	private static spawnWindowFromTab(tab: TABS | string): void {
		switch (tab) {
			case TABS.SOCIAL:
				WindowUtils.createWindow(getConstructorOptions(TABS.SOCIAL), `${ TARGET_GAME_URL }social.html`);
				break;
			case TABS.EDITOR:
				WindowUtils.createWindow(getConstructorOptions(TABS.SOCIAL), `${ TARGET_GAME_URL }editor.html`);
				break;
			case TABS.GAME:
			default:
				WindowUtils.createWindow({
					...getConstructorOptions(TABS.GAME),
					show: false,
					webPreferences: {
						...getConstructorOptions(TABS.GAME).webPreferences,
						preload: resolve(__dirname, './preload/game'),
						contextIsolation: false,
						nodeIntegrationInSubFrames: true,
						backgroundThrottling: false,
						nativeWindowOpen: true
					}
				}, TARGET_GAME_URL);
		}
	}

	/** 
	 * Register event listeners for the app process (e.g. 'window-all-closed')
	 * This can be done before app.ready
	 */
	private static registerAppEventListeners(): void {
		info('Registering app event listeners');

		app.on('second-instance', (_event, argv) => {
			const newInstanceTab = Application.getTabToLaunch(argv);
			Application.spawnWindowFromTab(newInstanceTab);
		});
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
			const success = await fs.access(cachePath)
				.then(() => ({
					result: false,
					message: 'For reason unknown, the cache still exists — please report!'
				}))
				.catch(() => ({ result: true }));

			return success;
		});
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
	private registerSwapperProtocols(): void {
		// Register the protocol source for the resource swapper.
		global.resourceswapProtocolSource = this.store.get(`${ StoreConstants.PREFIX }.${ Savable.RESOURCE_SWAPPER_PATH }`) as string
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
		const urlFilterLists = (this.store.get(`${StoreConstants.PREFIX}.${Savable.USER_FILTER_LISTS}`, '') as string)
			.split(',')
			.filter(filterListURL => {
				// Iterate over. If an item is prefixed with `swapper://`,
				// filter it out and push it to the other array
				if (filterListURL.startsWith('swapper://')) {
					swapperFilterLists.push(filterListURL);
					return false;
				}

				// Validate the URL or don't fetch
				try {
					// eslint-disable-next-line no-new
					new URL(filterListURL);
					return true;
				} catch {
					return false;
				}
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

export type ApplicationType = typeof Application;
