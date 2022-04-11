/* eslint-disable global-require */
import { MapExport } from '../krunker';

(function() {
	require('../aliases');
	require('@game-settings');
	require('@game-api');

	const { ipcRenderer } = require('electron');
	const { MESSAGE_EXIT_CLIENT } = require('@constants');

	// Remove the 'client deprecated' popup.
	window.OffCliV = true;

	// When closeClient is called from the onclick, close the client.
	Object.defineProperty(window, 'closeClient', {
		enumerable: false,
		value(): void { return ipcRenderer.send(MESSAGE_EXIT_CLIENT); }
	});

	// TODO: Map settings in Client Settings
	const mapSettings: Partial<MapExport> = {
		skyDome: false,
		toneMapping: 4,
		sky: 0x040a14,
		fog: 0x080c12,
		lightI: 1.6
	};

	// Proxy JSON.parse
	const proxy = JSON.parse;
	JSON.parse = function(...args) {
		/**
		 * See issue: https://stackoverflow.com/a/6599105/11452298
		 * This is a hack and will not work if it is not tested with the /\{\s+\[native code\]/ expression
		 */
		// { [native code] }
		const parsed: MapExport = proxy.apply(this, args);

		// Check if the parsed object is a map.
		if (parsed.name && parsed.spawns) {
			// Merge the parsed map with the client map settings. Proxy the map settings so whenever they're accessed, we can pass values and reference mapSettings.
			return new Proxy({ ...parsed, ...mapSettings }, {
				get(target: MapExport, key: keyof MapExport) {
					return mapSettings[key] ?? target[key];
				}
			});
		}
		return parsed;
	};

	/** See issue: https://stackoverflow.com/a/44854201/11452298 */
	JSON.parse.toString = String.bind(0, 'function parse() { [native code] }');

	/** See issue: https://stackoverflow.com/a/28121768/11452298 */
	delete JSON.parse.prototype.constructor;

	// Show the client exit button
	document.addEventListener('DOMContentLoaded', () => {
		const showClientExit = document.createElement('style');
		showClientExit.innerHTML = '#clientExit { display: flex; }';

		document.head.appendChild(showClientExit);
	});
}());
