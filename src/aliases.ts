import { addAliases } from 'module-alias';
import { resolve } from 'path';

// !!! IMPORTANT: Ensure that the following aliases are added to the tsconfig.json file !!!
addAliases({
	// src top-level
	'@color-utils': resolve(__dirname, './color-utils'),

	// config
	'@constants': resolve(__dirname, './config/constants'),
	'@client': resolve(__dirname, './config/client'),

	// window
	'@splash-pre-utils': resolve(__dirname, './window/splash-pre-utils'),
	'@game-api': resolve(__dirname, './window/game-api'),
	'@game-settings': resolve(__dirname, './window/game-settings'),
	'@function-hooker': resolve(__dirname, './window/function-hooker'),

	// main
	'@splash-utils': resolve(__dirname, './main/splash-utils'),
	'@game-utils': resolve(__dirname, './main/game-utils'),
	'@window-utils': resolve(__dirname, './main/window-utils'),
	'@event-handler': resolve(__dirname, './main/event-handler'),
	'@resource-swapper': resolve(__dirname, './main/resource-swapper'),
	'@useragent-spoof': resolve(__dirname, './main/useragent-spoof')
});
