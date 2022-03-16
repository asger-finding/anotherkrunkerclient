import { EventListener } from '../akc';

const { app, ipcMain } = require('electron');
const {
	MESSAGE_EXIT_CLIENT
	// MESSAGE_OPEN_SETTINGS
} = require('@constants');

module.exports = class {

	private eventListeners: EventListener[] = [];

	/**
	 * @description
	 * Set up event listeners between main and renderer processes.
	 */
	public registerEventListeners(): void {
		// Close the client when anotherkrunkerclient.exitClient() is called from the renderer process
		this.registerEventListener(MESSAGE_EXIT_CLIENT, () => {
			app.quit();
		});
	}

	/**
	 * 
	 * @param message The message to listen for
	 * @param callback The callback to run when the message is received
	 * @returns The id of the event listener
	 * @description
	 * Register an event listener for a message and set an id and callback for it.
	 */
	private registerEventListener(message: string, callback: () => unknown): number {
		ipcMain.on(message, callback);

		const id = this.eventListeners.length;
		this.eventListeners.push({ id, message, callback });
		return id;
	}

	/**
	 * @param message The message to remove listeners for
	 * @description
	 * Remove all event listeners for a message.
	 */
	public destroyAllEventListenersForMessage(message: string): void {
		ipcMain.removeAllListeners(message);
		this.eventListeners.filter(eventListener => eventListener.message !== message);
	}

};
