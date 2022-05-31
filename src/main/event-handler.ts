import { app, ipcMain } from 'electron';
import { Callback } from '@client';
import { MESSAGE_EXIT_CLIENT } from '@constants';

export default class {

	private eventListeners: Map<string, Callback> = new Map();

	/** Set up event listeners between main and renderer processes. */
	public registerAppEventListeners(): void {
		// Close the client when MESSAGE_EXIT_CLIENT is called from the renderer process
		this.registerEventListener(MESSAGE_EXIT_CLIENT, () => app.quit());
	}

	/**
	 * Register an event listener for a message and set an id and callback for it.
	 * @param message - The message to listen for
	 * @param callback - The callback to run when the message is received
	 */
	private registerEventListener(message: string, callback: () => unknown): void {
		ipcMain.on(message, callback);

		this.eventListeners.set(message, callback);
	}

	/**
	 * Remove all event listeners for a message.
	 * @param message - The message to remove the eventlisteners for
	 */
	public destroyAllEventListenersForMessage(message: string): void {
		ipcMain.removeAllListeners(message);

		for (const key in Object.keys(this.eventListeners)) if (key === message) this.eventListeners.delete(key);
	}

}
