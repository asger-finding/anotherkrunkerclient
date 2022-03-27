const { addAliases } = require('module-alias');
const { resolve } = require('path');

addAliases({
	// config
	'@constants': resolve(__dirname, './config/constants'),

	// window
	'@splash-pre-utils': resolve(__dirname, './window/splash-pre-utils'),
	'@game-api': resolve(__dirname, './window/game-api'),
	'@game-settings': resolve(__dirname, './window/game-settings'),

	// the deep vast emptiness of the renderer

	// main
	'@splash-utils': resolve(__dirname, './main/splash-utils'),
	'@game-utils': resolve(__dirname, './main/game-utils'),
	'@window-utils': resolve(__dirname, './main/window-utils'),
	'@event-handler': resolve(__dirname, './main/event-handler')
});
