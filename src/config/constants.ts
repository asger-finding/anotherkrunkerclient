const pkg = require('../../package.json');
const path = require('path');

module.exports = {
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
	SPLASH_PHYSICAL_PARAMETERS: {
		width: 640,
		height: 320,
		show: false,
		resizable: false,
		fullscreenable: false,
		movable: false,
		center: true,
		frame: false,
		icon: path.join(__dirname, '../renderer/assets/icon.ico')
	},
	SPLASH_WEBPREFERENCES: {
		contextIsolation: true,
		worldSafeExecuteJavaScript: true,
		enableRemoteModule: true
	},
	// How long the splash window should be visible before entering the game
	SPLASH_ALIVE_TIME: 1500,

	GAME_PHYSICAL_PARAMETERS: {
		width: 1280,
		height: 720,
		show: false,
		resizable: true,
		fullscreenable: true,
		movable: true,
		icon: path.join(__dirname, '../renderer/assets/icon.ico')
	},
	GAME_WEBPREFERENCES: {
		nodeIntegration: false,
		contextIsolation: true,
		worldSafeExecuteJavaScript: true,
		enableRemoteModule: false
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

	getURL(window: Electron.BrowserWindow) {
		const url = new URL(window.webContents.getURL());

		const { 1: tab } = String(url.pathname.split('/'));
		const isKrunker = url.hostname.endsWith(module.exports.TARGET_GAME_DOMAIN);
		const quickJoin = url.searchParams.get(module.exports.QUICKJOIN_URL_QUERY_PARAM) === 'true';

		return {
			tab: isKrunker ? (tab || module.exports.TABS.GAME) : null,
			isKrunker,
			quickJoin
		};
	}
};