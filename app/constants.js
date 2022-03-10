const clientPackage = require('../package.json');

module.exports = {
	CLIENT_AUTHOR: clientPackage.author,
	CLIENT_REPO: 'asger-finding/anotherkrunkerclient',
	CLIENT_VERSION: clientPackage.version,
	ELECTRON_FLAGS: [

		/* Unlock the frame rate */
		[ 'disable-frame-rate-limit', null ],
		[ 'disable-gpu-vsync', null ],
		[ 'max-gum-fps', '9999' ],

		/* Set the WebGL angle type */
		[ 'use-angle', 'default' ],

		/* Enable WebGL */
		[ 'enable-webgl2-compute-context', null ],

		/* Ensure that GPU-accelerated 2D canvas is used */
		[ 'disable-accelerated-2d-canvas', 'false' ],

		/* Require user interaction for audio autoplay */
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
	}
};
