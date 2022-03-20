const pkg = require('../../package.json');
const path = require('path');
const Store = require('electron-store');

module.exports = {
	preferences: new Store(),

	CLIENT_NAME: pkg.productName,
	CLIENT_AUTHOR: pkg.author,
	CLIENT_VERSION: pkg.version,
	CLIENT_REPO: 'asger-finding/anotherkrunkerclient',
	CLIENT_LICENSE_PERMALINK: 'https://yerl.org/JwGdZ',

	TARGET_GAME_DOMAIN: 'krunker.io',
	TARGET_GAME_URL: 'https://krunker.io/',
	QUICKJOIN_URL_QUERY_PARAM: 'quickjoin',

	// (doesn't work as global require)
	// eslint-disable-next-line global-require
	IS_DEVELOPMENT: process.type === 'browser' ? require('electron-is-dev') : false,

	ELECTRON_FLAGS: [
		// Unlock the frame rate
		['disable-frame-rate-limit'],
		['disable-gpu-vsync'],
		[ 'max-gum-fps', '9999' ],

		// Enable WebGL
		['enable-webgl2-compute-context'],

		// Don't require user gesture for autoplay
		[ 'autoplay-policy', 'no-user-gesture-required' ],

		// Performance optimization flags TODO: client setting for these
		['enable-highres-timer'],
		['enable-gpu-rasterization'],
		['enable-zero-copy'],
		['enable-webgl'],
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
		[ 'max-active-webgl-contexts', 100 ],
		[ 'high-dpi-support', 1 ],
		[ 'renderer-process-limit', 100 ],
		['webrtc-max-cpu-consumption-percentage=100'],
		['no-zygote']
	],

	// How long the splash window should be visible before entering the game
	SPLASH_ALIVE_TIME: 1500,

	getDefaultConstructorOptions(name: string): Electron.BrowserWindowConstructorOptions {
		const existsInTabs = Object.values(module.exports.TABS).includes(name);

		return {
			width: existsInTabs ? module.exports.preferences.get(`window.${ name }.width`, 1280) : 1280,
			height: existsInTabs ? module.exports.preferences.get(`window.${ name }.height`, 720) : 720,
			fullscreen: existsInTabs ? module.exports.preferences.get(`window.${ name }.fullscreen`, false) : false,
			movable: true,
			resizable: true,
			fullscreenable: true,
			backgroundColor: '#1c1c1c',
			icon: path.join(__dirname, '../renderer/assets/icon.ico'),
			webPreferences: {
				contextIsolation: true,
				worldSafeExecuteJavaScript: true,
				enableRemoteModule: true
			}
		};
	},

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
			icon: path.join(__dirname, '../renderer/assets/icon.ico'),
			webPreferences: {
				contextIsolation: true,
				worldSafeExecuteJavaScript: true,
				enableRemoteModule: true,
				preload: path.join(__dirname, '../preload/splash-pre')
			}
		};
	},

	get GAME_CONSTRUCTOR_OPTIONS(): Electron.BrowserWindowConstructorOptions {
		const defaultOptions = this.getDefaultConstructorOptions(this.TABS.GAME);
		defaultOptions.webPreferences.preload = path.join(__dirname, '../preload/game-pre');

		return defaultOptions;
	},

	TABS: {
		GAME: 'game',
		SOCIAL: 'social',
		DOCS: 'docs',
		COMP: 'comp',
		VIEWER: 'viewer',
		EDITOR: 'editor'
	},

	// ipcRenderer messages
	MESSAGE_SPLASH_DONE: 'splash-done',
	MESSAGE_GAME_DONE: 'game-done',
	MESSAGE_EXIT_CLIENT: 'exit-client',
	MESSAGE_OPEN_SETTINGS: 'open-settings',
	MESSAGE_RELEASES_DATA: 'releases-data',

	/**
	 * @param  {Electron.BrowserWindow} window
	 * @returns {Object.<string, boolean>}
	 * @description
	 * Returns the current Krunker tab (if any), whether we're on Krunker, and whether quickJoin is enabled
	 */
	getURL(baseURL: string): { url: string, tab: string | null, isInTabs: boolean, isKrunker: boolean, quickJoin: boolean } {
		try {
			const url = new URL(baseURL);

			const isKrunker = url.hostname.endsWith(module.exports.TARGET_GAME_DOMAIN);
			const tab = isKrunker ? (String(url.pathname.split('/')[1]).replace('.html', '') || module.exports.TABS.GAME) : null;
			const isInTabs = Object.values(module.exports.TABS).includes(tab);
			const quickJoin = url.searchParams.get(module.exports.QUICKJOIN_URL_QUERY_PARAM) === 'true';

			return {
				url: baseURL,
				tab,
				isInTabs,
				isKrunker,
				quickJoin
			};
		} catch (err) {
			// fallback to default
			return {
				url: baseURL,
				tab: null,
				isInTabs: false,
				isKrunker: false,
				quickJoin: false
			};
		}
	}
};
