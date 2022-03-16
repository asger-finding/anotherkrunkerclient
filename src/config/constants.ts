const pkg = require('../../package.json');
const path = require('path');

module.exports = {
	CLIENT_NAME: pkg.productName,
	CLIENT_AUTHOR: pkg.author,
	CLIENT_VERSION: pkg.version,
	CLIENT_REPO: 'asger-finding/anotherkrunkerclient',
	CLIENT_LICENSE_PERMALINK: 'https://yerl.org/JwGdZ',
	ELECTRON_FLAGS: [
		// Unlock the frame rate
		[ 'disable-frame-rate-limit', null ],
		[ 'disable-gpu-vsync', null ],
		[ 'max-gum-fps', '9999' ],

		// Set the WebGL angle type
		[ 'use-angle', 'default' ],

		// Enable WebGL
		[ 'enable-webgl2-compute-context', null ],

		// Ensure that GPU-accelerated 2D canvas is used
		[ 'disable-accelerated-2d-canvas', 'false' ],

		// Require user interaction for audio autoplay
		[ 'autoplay-policy', 'user-required' ],

		// Performance optimization flags TODO: client setting for these
		[ 'enable-highres-timer', null ],
		[ 'enable-gpu-rasterization', null ],
		[ 'enable-zero-copy', null ],
		[ 'enable-webgl', null ],
		[ 'enable-javascript-harmony', null ],
		[ 'enable-future-v8-vm-features', null ],
		[ 'enable-quic', null ],
		[ 'enable-webgl2-compute-context', null ],
		[ 'disable-metrics', null ],
		[ 'disable-metrics-repo', null ],
		[ 'disable-logging', null ],
		[ 'disable-component-update', null ],
		[ 'disable-low-end-device-mode', null ],
		[ 'disable-dev-shm-usage', null ],
		[ 'disable-canvas-aa', null ],
		[ 'disable-2d-canvas-clip-aa', null ],
		[ 'disable-hang-monitor', null ],
		[ 'disable-breakpad', null ],
		[ 'disable-bundled-ppapi-flash', null ],
		[ 'ignore-gpu-blocklist', null ],
		[ 'canvas-oop-rasterization', null ],
		[ 'max-active-webgl-contexts', 100 ],
		[ 'high-dpi-support', 1 ],
		[ 'renderer-process-limit', 100 ],
		[ 'webrtc-max-cpu-consumption-percentage=100', null ],
		[ 'no-zygote', null ]
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
	SPLASH_ALIVE_TIME: 4000,

	// ipcRenderer messages
	MESSAGE_SPLASH_DONE: 'splash-done',
	MESSAGE_EXIT_CLIENT: 'exit-client',
	MESSAGE_OPEN_SETTINGS: 'open-settings',
	MESSAGE_RELEASES_DATA: 'releases-data'
};
