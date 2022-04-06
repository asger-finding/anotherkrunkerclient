import { WindowData } from '../client';

const pkg = require('../../package.json');
const { join } = require('path');
const Store = require('electron-store');

module.exports = {
	preferences: new Store(),

	CLIENT_NAME: pkg.productName,
	CLIENT_AUTHOR: pkg.author,
	CLIENT_VERSION: pkg.version,
	CLIENT_REPO: pkg.repository,
	CLIENT_LICENSE_PERMALINK: 'https://yerl.org/ZKZ8V',

	TARGET_GAME_DOMAIN: 'krunker.io',
	get TARGET_GAME_URL(): string { return `https://${ this.TARGET_GAME_DOMAIN }/`; },
	get TARGET_GAME_SHORTNAME(): string { return this.TARGET_GAME_DOMAIN.split('.')[0]; },
	QUICKJOIN_URL_QUERY_PARAM: 'quickjoin',

	// If not contained, it will throw an error whenever Constants is referenced outside the main process.
	// eslint-disable-next-line global-require
	IS_DEVELOPMENT: process.type === 'browser' ? require('electron-is-dev') : null,

	ELECTRON_FLAGS: [
		// Unlock the frame rate
		['disable-frame-rate-limit'],
		['disable-gpu-vsync'],
		[ 'max-gum-fps', '9999' ],

		// Enable WebGL
		['enable-webgl'],

		// Don't require user gesture for autoplay
		[ 'autoplay-policy', 'no-user-gesture-required' ],

		// Performance optimization flags. TODO: client setting for these
		['enable-highres-timer'],
		['enable-gpu-rasterization'],
		['enable-zero-copy'],
		['enable-javascript-harmony'],
		['enable-future-v8-vm-features'],
		['enable-quic'],
		['enable-webgl2-compute-context'],
		['disable-metrics'],
		['disable-metrics-repo'],
		['disable-logging'],
		['disable-component-update'],
		['disable-low-end-device-mode'],
		['disable-dev-shm-usage'],
		['disable-canvas-aa'],
		['disable-2d-canvas-clip-aa'],
		['disable-hang-monitor'],
		['disable-breakpad'],
		['disable-bundled-ppapi-flash'],
		['ignore-gpu-blocklist'],
		['canvas-oop-rasterization'],
		['no-zygote'],
		['disable-background-timer-throttling'],
		['disable-renderer-backgrounding'],
		['disable-ipc-flooding-protection'],
		[ 'max-active-webgl-contexts', 100 ],
		[ 'renderer-process-limit', 100 ],
		[ 'webrtc-max-cpu-consumption-percentage', 100 ]
	],

	// How long the splash window should be visible before entering the game
	SPLASH_ALIVE_TIME: 1500,


	/**
	 * @param {string} name The name of the tab to get sizing data for.
	 * @returns {Electron.BrowserWindowConstructorOptions}
	 * @description Returns the default window options, with sizing for the given tab.
	 */
	getDefaultConstructorOptions(name = ''): Electron.BrowserWindowConstructorOptions {
		const existsInTabs = Object.values(module.exports.TABS).includes(name);

		return {
			width: existsInTabs ? module.exports.preferences.get(`window.${ name }.width`, 1280) : 1280,
			height: existsInTabs ? module.exports.preferences.get(`window.${ name }.height`, 720) : 720,
			fullscreen: existsInTabs ? module.exports.preferences.get(`window.${ name }.fullscreen`, false) : false,
			movable: true,
			resizable: true,
			fullscreenable: true,
			backgroundColor: '#1c1c1c',
			icon: join(__dirname, '../renderer/assets/icon.ico'),
			webPreferences: {
				contextIsolation: true,
				worldSafeExecuteJavaScript: true,
				enableRemoteModule: false
			}
		};
	},

	/**
	 * @returns {Electron.BrowserWindowConstructorOptions}
	 * @description Get the window constructor options for the splash screen.
	 */
	get SPLASH_CONSTRUCTOR_OPTIONS(): Electron.BrowserWindowConstructorOptions {
		return {
			width: 640,
			height: 320,
			show: false,
			frame: false,
			movable: false,
			center: true,
			resizable: false,
			fullscreenable: false,
			icon: join(__dirname, '../renderer/assets/icon.ico'),
			webPreferences: {
				contextIsolation: true,
				worldSafeExecuteJavaScript: true,
				enableRemoteModule: false,
				preload: join(__dirname, '../window/splash-pre')
			}
		};
	},

	/**
	 * @returns {Electron.BrowserWindowConstructorOptions}
	 * @description
	 * Returns the options for the primary game window.  
	 * 
	 * I can't find an alternative to setting contextIsolation to off and risking it.
	 * Krunker hangs when enabling nodeIntegration, so using executeJavascript is not an option.  
	 * You cannot preload multiple scripts with different webPreferences.
	 * contextBridge.exposeInMainWorld only allows for exposing objects.
	 */
	get GAME_CONSTRUCTOR_OPTIONS(): Electron.BrowserWindowConstructorOptions {
		const options = this.getDefaultConstructorOptions(this.TABS.GAME);
		options.webPreferences.preload = join(__dirname, '../window/game-pre');
		options.webPreferences.contextIsolation = false;
		options.show = false;

		return options;
	},

	TABS: {
		GAME: 'game',
		SOCIAL: 'social',
		DOCS: 'docs',
		COMP: 'comp',
		VIEWER: 'viewer',
		EDITOR: 'editor'
	},

	// ipc messages
	MESSAGE_SPLASH_DONE: 'splash-done',
	MESSAGE_GAME_DONE: 'game-done',
	MESSAGE_EXIT_CLIENT: 'exit-client',
	MESSAGE_OPEN_SETTINGS: 'open-settings',
	MESSAGE_RELEASES_DATA: 'releases-data',

	/**
	 * @param  {string} baseURL The URL to analyze
	 * @returns {Object.<string, boolean>}
	 * @description
	 * Returns the current Krunker tab (if any), whether we're on Krunker, what Krunker tab we're on, and whether quickJoin is enabled
	 */
	getURLData(baseURL: string): WindowData {
		try {
			const url = new URL(baseURL);

			const isKrunker = url.hostname.endsWith(module.exports.TARGET_GAME_DOMAIN);
			const tab = isKrunker ? (String(url.pathname.split('/')[1]).replace('.html', '') || module.exports.TABS.GAME) : null;
			const isInTabs = Object.values(module.exports.TABS).includes(tab);
			const quickJoin = url.searchParams.get(module.exports.QUICKJOIN_URL_QUERY_PARAM) === 'true';

			return {
				url: baseURL,
				invalid: false,
				tab,
				isInTabs,
				isKrunker,
				quickJoin
			};
		} catch (err) {
			// fallback to default
			return {
				url: baseURL,
				invalid: true,
				tab: null,
				isInTabs: false,
				isKrunker: false,
				quickJoin: false
			};
		}
	}
};
