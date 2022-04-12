/* eslint-disable global-require */
import { MapExport } from '../krunker';

(function() {
	require('../aliases');
	require('@game-settings');
	require('@game-api');

	const { ipcRenderer } = require('electron');
	const { MESSAGE_EXIT_CLIENT } = require('@constants');
	const { addProxies } = require('@proxy-patcher');

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

	addProxies([
		'Function.prototype.toString.call',
		'JSON.parse'
	]);

	// Show the client exit button
	document.addEventListener('DOMContentLoaded', () => {
		const showClientExit = document.createElement('style');
		showClientExit.innerHTML = '#clientExit { display: flex; }';

		document.head.appendChild(showClientExit);
	});
}());
