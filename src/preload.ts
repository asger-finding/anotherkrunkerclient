/**
 * We must preload env variables to ensure that the app will run correctly
 */

// only initialize native libraries that
// can't interfere or load anything unexpected
import { ApplicationType } from './app';
import Store from 'electron-store';
import { app } from 'electron';
import { join } from 'path';
import { productName } from '../package.json';

if (!app.isPackaged) {
	app.setName(productName);
	app.setPath('userData', join(app.getPath('appData'), productName));
}
Store.initRenderer();

if (!app.requestSingleInstanceLock()) {
	app.quit();
} else {
	(async() => {
		// Spawn the appropriate window if the client
		// was launched through a desktop action on Linux
		const Module = await ((await import('./app')).default as ApplicationType);
		const application = new Module();

		app.whenReady().then(() => application.launch());
	})();
}
