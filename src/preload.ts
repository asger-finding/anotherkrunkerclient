/**
 * We must preload env variables to ensure that the app will run correctly
 */

import { app } from 'electron';
import { initRenderer } from 'electron-store';
import { join } from 'path';
import { productName } from '../package.json';

if (!app.isPackaged) {
	app.setName(productName);
	app.setPath('userData', join(app.getPath('appData'), productName));
}
initRenderer();

import('./app');

if (!app.requestSingleInstanceLock()) app.quit();
else import('./app');
