import {
	productName as CLIENT_NAME,
	repository as CLIENT_REPO,
	version as CLIENT_VERSION,
	author as _CLIENT_AUTHOR
} from '../../package.json';
import { DefaultConstructorOptions, WindowData, WindowSaveData } from '@client';
import Store from 'electron-store';
import { app } from 'electron';
import { resolve } from 'path';

export const preferences = new Store();

// The author field in package.json may appear as either a string or an object.
// Transform it to a string.
let CLIENT_AUTHOR: string | {
	name: string;
	email?: string;
} = _CLIENT_AUTHOR;
if (CLIENT_AUTHOR instanceof Object) CLIENT_AUTHOR = `${ CLIENT_AUTHOR.name } <${ CLIENT_AUTHOR.email ?? '---' }>`;

export { CLIENT_NAME, CLIENT_AUTHOR, CLIENT_VERSION, CLIENT_REPO };

// Permalink to the license
export const CLIENT_LICENSE_PERMALINK = 'https://yerl.org/ZKZ8V';

export const TARGET_GAME_DOMAIN: 'krunker.io' | 'browserfps.com' = 'krunker.io';
export const TARGET_GAME_URL = `https://${ TARGET_GAME_DOMAIN }/`;
export const [TARGET_GAME_SHORTNAME] = TARGET_GAME_DOMAIN.split('.');
export const QUICKJOIN_URL_QUERY_PARAM = 'quickjoin';

// Client ID can be obtained by creating a new app on the Twitch developer portal (https://dev.twitch.tv/console/apps)
export const TWITCH_CLIENT_ID = 'b8ee5yb7azo5fochp2ajvt9e5f4sfs';
export const TWITCH_PORT = 33333;
export const TWITCH_MATERIAL_ICON = 'live_tv';

// If not contained, it will throw an error whenever Constants is referenced outside the main process.
export const IS_DEVELOPMENT = process.type === 'browser' ? !app.isPackaged : null;

// https://gist.github.com/dodying/34ea4760a699b47825a766051f47d43b
const ELECTRON_FLAGS: Array<[string] | [string, string]> = [

	// Unlock the frame rate
	['disable-frame-rate-limit'],
	['disable-gpu-vsync'],

	// Don't require user gesture for autoplay
	['autoplay-policy', 'no-user-gesture-required'],

	// Performance optimization flags.
	// TODO: client setting for these
	['enable-highres-timer'],
	['enable-quic'],
	['enable-webgl'],
	['enable-gpu-rasterization'],
	['enable-zero-copy'],
	['enable-javascript-harmony'],
	['enable-future-v8-vm-features'],
	['enable-webgl2-compute-context'],
	['enable-accelerated-video-decode'],
	['enable-native-gpu-memory-buffers'],
	['enable-oop-rasterization'],
	['disable-low-end-device-mode'],
	['disable-dev-shm-usage'],
	['disable-hang-monitor'],
	['disable-bundled-ppapi-flash'],
	['ignore-gpu-blocklist'],
	['canvas-oop-rasterization'],
	['no-zygote'],
	['disable-background-timer-throttling'],
	['disable-renderer-backgrounding'],
	['disable-ipc-flooding-protection'],
	['no-first-run'],
	['disable-setuid-sandbox'],
	['disable-background-networking'],
	['disable-sync'],
	['metrics-recording-only'],
	['disable-default-apps'],
	['canvas-msaa-sample-count', '0'],
	['gpu-rasterization-msaa-sample-count', '0'],
	['ppapi-antialiased-text-enabled', 'false'],
	['disable-canvas-aa'],
	['disable-2d-canvas-clip-aa'],
	['enable-gpu-async-worker-context'],
	['enable-gpu-memory-buffer-video-frames']
];

// How long before the client ends the electron process after all windows are closed
export const WINDOW_ALL_CLOSED_BUFFER_TIME = 200;

// 14 days in milliseconds
export const USERAGENT_LIFETIME = 14 * 24 * 60 * 60 * 1000;

export const TABS = {
	GAME: 'game',
	SOCIAL: 'social',
	DOCS: 'docs',
	COMP: 'comp',
	VIEWER: 'viewer',
	EDITOR: 'editor'
};

// ipc messages must be typeof string
export enum MESSAGES {
	GAME_DONE = 'game-done',
	EXIT_CLIENT = 'exit-client',
	TWITCH_GET_INFO = 'twitch-get-info',
	TWITCH_MESSAGE_SEND = 'twitch-message-send',
	TWITCH_MESSAGE_RECEIVE = 'twitch-message-receive'
}

/**
 * Returns the default window options, with sizing for the given tab.
 *
 * @param tabName The name of the tab to get sizing data for.
 * @returns The default window constructor options.
 */
export const getDefaultConstructorOptions = (tabName?: string): DefaultConstructorOptions => <DefaultConstructorOptions>{
	movable: true,
	resizable: true,
	fullscreenable: true,
	darkTheme: true,
	backgroundColor: '#1c1c1c',
	icon: resolve(__dirname, '../static/icon96x96.png'),
	webPreferences: {
		nodeIntegration: false,
		contextIsolation: true,
		worldSafeExecuteJavaScript: true,
		enableRemoteModule: false
	},
	...preferences.get(`window.${ tabName }`, {
		width: 1280,
		height: 720,
		fullscreen: false,
		maximized: false
	}) as WindowSaveData
};

/** The BrowserWindowConstructorOptions for the game window */
export const GAME_CONSTRUCTOR_OPTIONS: Electron.BrowserWindowConstructorOptions = {
	...getDefaultConstructorOptions(TABS.GAME),
	show: false,
	webPreferences: {
		...getDefaultConstructorOptions(TABS.GAME).webPreferences,
		preload: resolve(__dirname, '../window/game-preload'),
		contextIsolation: false,
		nodeIntegrationInSubFrames: true
	}
};

/**
 * Returns the current Krunker tab (if any), whether we're on Krunker, what Krunker tab we're on, and whether quickJoin is enabled
 *
 * @param baseURL The URL to analyze
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
			isInTabs: false,
			isKrunker: false,
			quickJoin: false
		};
	}
};

enum GPUVendors {
	nvidia = 0x10DE,
	amd = 0x1002,
	intel = 0x8086
}

interface PartialGPU {
	gpuDevice: Array<{
		active: boolean;
		vendorId: number;
		deviceId: number;
	}>;
}

const isUnix = process.platform !== 'win32' && process.platform !== 'darwin';

const isWayland = process.env.XDG_SESSION_TYPE === 'wayland' || typeof process.env.WAYLAND_DISPLAY !== 'undefined';

const isWaylandNative = isWayland && (
	process.argv.includes('--ozone-platform=wayland')
	|| process.argv.includes('--ozone-hint=auto')
	|| process.argv.includes('--ozone-hint=wayland')
);

/**
 *Check if the device has an active GPU
 * 
 * @param object
 * @returns Boolean for whether or not the device has active GPU devices
 */
// eslint-disable-next-line complexity
async function getGPU(): Promise<PartialGPU | null> {
	const gpuInfo = await app.getGPUInfo('basic');

	if (!(gpuInfo instanceof Object)) return null;
	if (!('gpuDevice' in gpuInfo) || !Array.isArray((gpuInfo as PartialGPU).gpuDevice)) return null;

	for (const device of (gpuInfo as PartialGPU).gpuDevice) {
		if (!('active' in device) || typeof device.active !== 'boolean') return null;
		if (!('vendorId' in device) || typeof device.vendorId !== 'number') return null;
		if (!('deviceId' in device) || typeof device.deviceId !== 'number') return null;
	}

	return gpuInfo;
}

/**
 * An experimental function to return information about recommended flags to
 * improve the app's integration within the OS.
 * 
 * This is currently used only for Wayland to enable screen recording and use
 * recommended flags for native Wayland if `--ozone-platform=wayland` is used
 * (see {@link getRecommendedGPUFlags} for GPU optimizations for Wayland).
 * 
 * @returns OS flags for Wayland
 */
export function getRecommendedOSFlags() {
	const flags: ([string] | [string, string])[] = [];
	if (isUnix) {
		if (isWaylandNative) flags.push(['enable-features', 'UseOzonePlatform,WebRTCPipeWireCapturer,WaylandWindowDecorations']);
		else if (isWayland) flags.push(['enable-features', 'WebRTCPipeWireCapturer']);
	}
	return flags;
}


/**
 * Guess the best GL backend for the enviroment.
 */
// eslint-disable-next-line complexity
export async function getRecommendedFlags() {
	/**
	 * Tries to guess the best GL backend for the current desktop enviroment
	 * to use as native instead of ANGLE.
	 * It is `desktop` by default (all platforms) and `egl` on WayLand (*nix).
	 */
	const desktopGl: 'desktop' | 'egl' = (isUnix && isWayland) ? 'egl' : 'desktop';

	let activeGPU = false;
	const flags: Array<[string] | [string, string]> = [];
	const gpuInfo = await getGPU();
	if (gpuInfo) {
		loop: for (const device of gpuInfo.gpuDevice) {
			if (device.active) {
				switch (device.vendorId) {
					case GPUVendors.intel:
					case GPUVendors.amd:
					case GPUVendors.nvidia:
						flags.push(['use-gl', desktopGl],
							['enable-features', 'VaapiVideoDecoder,VaapiVideoEncoder'],
							['disable-features', 'UseChromeOSDirectVideoDecoder']);

						activeGPU = true;
						break loop;
					default:
						break;
				}
			}
		}
	}

	// Use OpenGL ES driver for Linux ARM devices.
	if (!activeGPU && isUnix && process.arch === 'arm64') flags.push(['use-gl', 'egl']);

	return Array.from(new Set([
		...ELECTRON_FLAGS,
		...flags,
		...getRecommendedOSFlags()
	]));
}
