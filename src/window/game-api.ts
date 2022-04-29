import { CLIENT_NAME, preferences } from '@constants';
import { ipcRenderer } from 'electron';

const whitelistedSend = /a^/u;
const whiteListedReceive = /a^/u;
const whiteListedStoreRequest = /window.(.*?).width|window.(.*?).height|window.(.*?).fullscreen|window.(.*?).maximized/u;
const whiteListedStoreSet = /a^/u;

/** Throw an error if the attempted action is not whitelisted. */
function onNotWhiteListed(attempt: string) {
	throw new Error(`${ attempt } is not whitelisted.`);
}

/** @namespace clientAPI */
Object.freeze(window.clientAPI = {

	clientName: CLIENT_NAME,

	/**
	 * Send a message to event listeners with optional data.
	 * @memberof clientAPI
	 */
	send(channel, ...data) {
		if (whitelistedSend.test(channel)) ipcRenderer.send(channel, data);
		return onNotWhiteListed(`send(${ channel })`);
	},

	/**
	 * Set up callbacks to listen for messages.
	 * @memberof clientAPI
	 */
	receive(channel, ...callbacks) {
		if (whiteListedReceive.test(channel)) {
			ipcRenderer.on(channel, (_evt, ...args) => {
				for (const cb of callbacks) return cb(args);
				return null;
			});
			return true;
		}
		return onNotWhiteListed(`receive(${ channel })`);
	},

	/**
	 * Request a value from the store.
	 * @memberof clientAPI
	 */
	requestFromStore(key, fallback) {
		if (whiteListedStoreRequest.test(key)) return preferences.get(key, fallback);
		return onNotWhiteListed(`request(${ key })`);
	},

	/**
	 * Set a value in the store.
	 * @memberof clientAPI
	 */
	setToStore(key, value) {
		if (whiteListedStoreSet.test(key)) return preferences.set(key, value);
		return onNotWhiteListed(`set(${ key })`);
	},

	/**
	 * Check if a key exists in the store.
	 * @memberof clientAPI
	 */
	storeHas(key) {
		if (whiteListedStoreRequest.test(key)) return preferences.has(key);
		onNotWhiteListed(`has(${ key })`);
		return null;
	}
});
