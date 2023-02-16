import { app, ipcRenderer } from 'electron';
import Store from 'electron-store';

/**
 * Patch the store to always match the match the correct cwd
 */
class PatchedStore extends Store {

	/**
	 * @param args Store constructor arguments
	 */
	constructor(...args: ConstructorParameters<typeof Store>) {
		const config = args[0] ?? {};
		const [, ...rest] = args;

		if (ipcRenderer) config.cwd = ipcRenderer.sendSync('electron-store-get-data').defaultCwd;
		else if (app) config.cwd = app.getPath('userData');

		super(config, ...rest);
	}

}

// https://github.com/sindresorhus/electron-store/blob/e53ceefee7138b2166a222e0f339f5d5fd0035c6/index.js
export default PatchedStore;
