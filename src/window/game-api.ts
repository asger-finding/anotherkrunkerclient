/* eslint-disable global-require */
(function() {
	const { ipcRenderer } = require('electron');
	const { preferences, CLIENT_NAME } = require('@constants');

	const whitelistedSend = /a^/u;
	const whiteListedReceive = /a^/u;
	const whiteListedStoreRequest = /window.(.*?).width|window.(.*?).height|window.(.*?).fullscreen|window.(.*?).maximized/u;
	const whiteListedStoreSet = /a^/u;

	Object.freeze(window.clientAPI = {

		clientName: CLIENT_NAME,

		send(channel, data) {
			if (whitelistedSend.test(channel)) ipcRenderer.send(channel, data);
			return this.onNotWhiteListed(`send(${ channel })`);
		},

		recieve(channel, callback) {
			if (whiteListedReceive.test(channel)) ipcRenderer.on(channel, (_evt, ...args) => callback(args));
			return this.onNotWhiteListed(`recieve(${ channel })`);
		},

		requestFromStore(key, fallback) {
			if (whiteListedStoreRequest.test(key)) return preferences.get(key, fallback);
			return this.onNotWhiteListed(`request(${ key })`);
		},

		setToStore(key, value) {
			if (whiteListedStoreSet.test(key)) return preferences.set(key, value);
			return this.onNotWhiteListed(`set(${ key })`);
		},

		storeHas(key) {
			if (whiteListedStoreRequest.test(key)) return preferences.has(key);
			return this.onNotWhiteListed(`has(${ key })`);
		},

		onNotWhiteListed(attempt) {
			throw new Error(`${ attempt } is not whitelisted.`);
		}

	});
}());
