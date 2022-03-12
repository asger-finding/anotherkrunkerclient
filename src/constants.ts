const pkg = require('../package.json');

module.exports = {
	CLIENT_NAME: pkg.productName,
	CLIENT_AUTHOR: pkg.author,
	CLIENT_VERSION: pkg.version,
	CLIENT_REPO: 'asger-finding/anotherkrunkerclient',
	CLIENT_LICENSE_PERMALINK: 'https://yerl.org/YIDx5',
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
		[ 'autoplay-policy', 'user-required' ]
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
		vibrancy: 'dark',
		visualEffectState: 'active'
	},
	SPLASH_WEBPREFERENCES: {
		// Allow the preload script to add window features
		contextIsolation: false
	},
	SPLASH_DONE_WAIT: 2000,
	MESSAGE_SPLASH_DONE: 'splash-done',
	MESSAGE_EXIT_CLIENT: 'exit-client',
	MESSAGE_OPEN_SETTINGS: 'open-settings'
};
