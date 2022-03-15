const {
	MESSAGE_EXIT_CLIENT
	// MESSAGE_OPEN_SETTINGS
} = require('@constants');
const { app, ipcMain } = require('electron');

module.exports = class {

	private static eventListeners: { [key: string]: () => unknown } = {};

	/**
	 * @description
	 * Set up event listeners between main and renderer processes.
	 */
	public static registerEventListeners(): void {
		// Close the client when anotherkrunkerclient.exitClient() is called from the renderer process
		this.registerEventListener(MESSAGE_EXIT_CLIENT, () => {
			app.quit();
		});

		/**
		 * TODO: Do something with this event?
		 * ipcMain.on(MESSAGE_OPEN_SETTINGS, () => null);
		 */
	}

	public static registerEventListener(MESSAGE: string, callback: () => unknown): void {
		this.eventListeners[MESSAGE] = callback;
		ipcMain.on(MESSAGE, callback);
	}

	public static destroyAllEventListenersForMessage(MESSAGE: string): void {
		if (this.eventListeners[MESSAGE]) {
			ipcMain.removeAllListeners(MESSAGE);

			delete this.eventListeners[MESSAGE];
		}
	}

};
