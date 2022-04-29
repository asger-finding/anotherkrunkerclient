import { app, ipcMain } from 'electron';
import { EventListener } from '@client';
import { MESSAGE_EXIT_CLIENT } from '@constants';

export default class {

	private eventListeners: EventListener[] = [];

	/** Set up event listeners between main and renderer processes. */
	public registerEventListeners(): void {
		// Close the client when MESSAGE_EXIT_CLIENT is called from the renderer process
		this.registerEventListener(MESSAGE_EXIT_CLIENT, () => app.quit());
	}

	/**
	 * Register an event listener for a message and set an id and callback for it.
	 * @param message - The message to listen for
	 * @param callback - The callback to run when the message is received
	 * @returns The ID of the event listener
	 */
	private registerEventListener(message: string, callback: () => unknown): number {
		ipcMain.on(message, callback);

		const id = this.eventListeners.length;
		this.eventListeners.push({ id, message, callback });

		return id;
	}

	/**
	 * Remove all event listeners for a message.
	 * @param message - The message to remove the eventlisteners for
	 */
	public destroyAllEventListenersForMessage(message: string): boolean {
		ipcMain.removeAllListeners(message);
		this.eventListeners.filter(eventListener => eventListener.message !== message);
		return true;
	}

}
