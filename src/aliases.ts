const { addAliases } = require('module-alias');
const { resolve } = require('path');

addAliases({
	// config
	'@constants': resolve(__dirname, './config/constants'),

	// preload
	'@splash-pre': resolve(__dirname, './preload/splash-pre'),
	'@splash-pre-utils': resolve(__dirname, './preload/splash-pre-utils'),

	// the deep vast emptiness of the renderer

	// main
	'@splash-utils': resolve(__dirname, './main/splash-utils'),
	'@game-utils': resolve(__dirname, './main/game-utils'),
	'@window-utils': resolve(__dirname, './main/window-utils'),
	'@event-handler': resolve(__dirname, './main/event-handler')
});
