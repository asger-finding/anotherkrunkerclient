/* eslint-disable global-require */
import { KrunkerMap } from '../akc';

(function() {
	require('../aliases');
	require('@game-settings');
	require('@game-api');

	const { ipcRenderer } = require('electron');
	const { MESSAGE_EXIT_CLIENT } = require('@constants');

	// Remove the client deprecated popup.
	window.OffCliV = true;

	Object.defineProperty(window, 'closeClient', {
		enumerable: false,
		value(): void { return ipcRenderer.send(MESSAGE_EXIT_CLIENT); }
	});

	// TODO: Map settings in Client Settings
	const mapSettings: Partial<KrunkerMap> = {
		skyDome: false,
		toneMapping: 4,
		sky: 0x040a14,
		fog: 0x080c12,
		lightI: 1.6
	};

	const proxy = JSON.parse;
	JSON.parse = function(...args) {
		const parsed: KrunkerMap = proxy.apply(this, args);

		// Check if the parsed object is a map.
		if (parsed.name && parsed.spawns) {
			// Merge the parsed map with the client map settings. Proxy the map settings so whenever they're accessed, we can pass values by reference to mapSettings.
			return new Proxy({ ...parsed, ...mapSettings }, {
				get(target, key: keyof KrunkerMap) {
					return mapSettings[key] ?? target[key];
				}
			});
		}
		return parsed;
	};

	document.addEventListener('DOMContentLoaded', () => {
		const showClientExit = document.createElement('style');
		showClientExit.innerHTML = '#clientExit { display: flex; }';
		document.head.appendChild(showClientExit);
	});
}());
