import { addAliases } from 'module-alias';
import { resolve } from 'path';

addAliases({
	// config
	'@constants': resolve(__dirname, './config/constants'),
	'@client': resolve(__dirname, './config/client'),

	// window
	'@splash-pre-utils': resolve(__dirname, './window/splash-pre-utils'),
	'@game-api': resolve(__dirname, './window/game-api'),
	'@game-settings': resolve(__dirname, './window/game-settings'),
	'@proxy-patcher': resolve(__dirname, './window/proxy-patcher'),

	// main
	'@splash-utils': resolve(__dirname, './main/splash-utils'),
	'@game-utils': resolve(__dirname, './main/game-utils'),
	'@window-utils': resolve(__dirname, './main/window-utils'),
	'@event-handler': resolve(__dirname, './main/event-handler'),
	'@resource-swapper': resolve(__dirname, './main/resource-swapper')
});
