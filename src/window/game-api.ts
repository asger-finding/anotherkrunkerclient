/* eslint-disable global-require */
(function() {
	const { ipcRenderer } = require('electron');
	const { preferences, CLIENT_NAME } = require('@constants');

	const whitelistedSend = /a^/u;
	const whiteListedReceive = /a^/u;
	const whiteListedStoreRequest = /window.(.*?).width|window.(.*?).height|window.(.*?).fullscreen|window.(.*?).maximized/u;
	const whiteListedStoreSet = /a^/u;

	/** @description Throw an error if the attempted action is not whitelisted. */
	function onNotWhiteListed(attempt: string) {
		throw new Error(`${ attempt } is not whitelisted.`);
	}

	/** @namespace clientAPI */
	Object.freeze(window.clientAPI = {

		clientName: CLIENT_NAME,

		/**
		 * @memberof clientAPI
		 * @description Send a message to event listeners with optional data.
		 */
		send(channel, ...data) {
			if (whitelistedSend.test(channel)) ipcRenderer.send(channel, data);
			return onNotWhiteListed(`send(${ channel })`);
		},

		/**
		 * @memberof clientAPI
		 * @description Set up callbacks to listen for messages.
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
		 * @memberof clientAPI
		 * @description Request a value from the store.
		 */
		requestFromStore(key, fallback) {
			if (whiteListedStoreRequest.test(key)) return preferences.get(key, fallback);
			return onNotWhiteListed(`request(${ key })`);
		},

		/**
		 * @memberof clientAPI
		 * @description Set a value in the store.
		 */
		setToStore(key, value) {
			if (whiteListedStoreSet.test(key)) return preferences.set(key, value);
			return onNotWhiteListed(`set(${ key })`);
		},

		/**
		 * @memberof clientAPI
		 * @description Check if a key exists in the store.
		 */
		storeHas(key) {
			if (whiteListedStoreRequest.test(key)) return preferences.has(key);
			onNotWhiteListed(`has(${ key })`);
			return null;
		}
	});
}());
