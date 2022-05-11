import {
	author as CLIENT_AUTHOR,
	productName as CLIENT_NAME,
	repository as CLIENT_REPO,
	version as CLIENT_VERSION
} from '../../package.json';
import Store from 'electron-store';
import { WindowData } from '@client';
import { app } from 'electron';
import { join } from 'path';

export const preferences = new Store();

export { CLIENT_NAME, CLIENT_AUTHOR, CLIENT_VERSION, CLIENT_REPO };

// Permalink to the license
export const CLIENT_LICENSE_PERMALINK = 'https://yerl.org/ZKZ8V';

export const TARGET_GAME_DOMAIN = 'krunker.io';
export const TARGET_GAME_URL = `https://${ TARGET_GAME_DOMAIN }/`;
export const [TARGET_GAME_SHORTNAME] = TARGET_GAME_DOMAIN.split('.');
export const QUICKJOIN_URL_QUERY_PARAM = 'quickjoin';

// If not contained, it will throw an error whenever Constants is referenced outside the main process.
export const IS_DEVELOPMENT = process.type === 'browser' ? !app.isPackaged : null;

export const ELECTRON_FLAGS = [

	// Unlock the frame rate
	['disable-frame-rate-limit'],
	['disable-gpu-vsync'],
	['max-gum-fps', '9999'],

	// Don't require user gesture for autoplay
	['autoplay-policy', 'no-user-gesture-required'],

	// Performance optimization flags. TODO: client setting for these
	['enable-highres-timer'],
	['enable-webgl'],
	['enable-gpu-rasterization'],
	['enable-zero-copy'],
	['enable-javascript-harmony'],
	['enable-future-v8-vm-features'],
	['enable-quic'],
	['enable-webgl2-compute-context'],
	['enable-accelerated-video-decode'],
	['enable-native-gpu-memory-buffers'],
	['enable-oop-rasterization'],
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
	['max-active-webgl-contexts', '100'],
	['renderer-process-limit', '100'],
	['webrtc-max-cpu-consumption-percentage', '100']
];

// How long the splash window should be visible before entering the game
export const SPLASH_ALIVE_TIME = 1500;

// 1 month
export const USERAGENT_LIFETIME = 1000 * 60 * 60 * 24 * 30;

export const TABS = {
	GAME: 'game',
	SOCIAL: 'social',
	DOCS: 'docs',
	COMP: 'comp',
	VIEWER: 'viewer',
	EDITOR: 'editor'
};

// ipc messages
export const MESSAGE_SPLASH_DONE = 'splash-done';
export const MESSAGE_GAME_DONE = 'game-done';
export const MESSAGE_EXIT_CLIENT = 'exit-client';
export const MESSAGE_OPEN_SETTINGS = 'open-settings';
export const MESSAGE_RELEASES_DATA = 'releases-data';

/**
 * Returns the default window options, with sizing for the given tab.
 * @param name - The name of the tab to get sizing data for.
 */
export const getDefaultConstructorOptions = (windowName: string | null): Electron.BrowserWindowConstructorOptions => {
	const existsInTabs = Object.values(TABS).includes(windowName ?? '');

	return <Electron.BrowserWindowConstructorOptions>{
		width: existsInTabs ? preferences.get(`window.${ windowName }.width`, 1280) : 1280,
		height: existsInTabs ? preferences.get(`window.${ windowName }.height`, 720) : 720,
		fullscreen: existsInTabs ? preferences.get(`window.${ windowName }.fullscreen`, false) : false,
		movable: true,
		resizable: true,
		fullscreenable: true,
		backgroundColor: '#1c1c1c',
		icon: join(__dirname, '../renderer/assets/icon.ico'),
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			worldSafeExecuteJavaScript: true,
			enableRemoteModule: false
		}
	};
};

// Returns the options for the primary game window.
export const GAME_CONSTRUCTOR_OPTIONS: Electron.BrowserWindowConstructorOptions = {
	...getDefaultConstructorOptions(TABS.GAME),
	show: false,
	webPreferences: {
		...getDefaultConstructorOptions(TABS.GAME).webPreferences,
		preload: join(__dirname, '../window/game-pre'),
		contextIsolation: false
	}
};

/**
 * Get the window constructor options for the splash screen.
 * @returns Splash window constructor options
 */
export const SPLASH_CONSTRUCTOR_OPTIONS: Electron.BrowserWindowConstructorOptions = {
	width: 640,
	height: 320,
	show: false,
	frame: false,
	movable: false,
	center: true,
	resizable: false,
	fullscreenable: false,
	darkTheme: true,
	icon: join(__dirname, '../renderer/assets/icon.ico'),
	webPreferences: {
		contextIsolation: true,
		worldSafeExecuteJavaScript: true,
		enableRemoteModule: false,
		preload: join(__dirname, '../window/splash-pre')
	}
};

/**
 * Returns the current Krunker tab (if any), whether we're on Krunker, what Krunker tab we're on, and whether quickJoin is enabled
 * @param baseURL - The URL to analyze
 * @returns Analyzed URL
 */
export const getURLData = (baseURL?: string): WindowData => {
	try {
		if (typeof baseURL !== 'string') throw new TypeError('Provided URL is not typeof string');

		const url = new URL(baseURL);

		const isKrunker = url.hostname.endsWith(TARGET_GAME_DOMAIN);
		const tab = isKrunker ? (String(url.pathname.split('/')[1]).replace('.html', '') || TABS.GAME) : '';
		const isInTabs = Object.values(TABS).includes(tab);
		const quickJoin = url.searchParams.get(QUICKJOIN_URL_QUERY_PARAM) === 'true';

		return {
			url: baseURL,
			invalid: false,
			tab,
			isInTabs,
			isKrunker,
			quickJoin
		};
	} catch (err) {
		// Fallback to default
		return {
			url: baseURL,
			invalid: true,
			tab: null,
			isInTabs: false,
			isKrunker: false,
			quickJoin: false
		};
	}
};
