import '../aliases';
import '@game-settings';
import '@game-api';

import FunctionHooker from '@function-hooker';
import { MESSAGE_EXIT_CLIENT } from '@constants';
import { MapExport } from '../krunker';
import { ipcRenderer } from 'electron';

// When closeClient is called from the onclick, close the client. The game will attempt to override this.
Object.defineProperty(window, 'closeClient', {
	enumerable: false,
	value(): void { return ipcRenderer.send(MESSAGE_EXIT_CLIENT); }
});

// Show the client exit button
document.addEventListener('DOMContentLoaded', (): void => {
	const showClientExit = document.createElement('style');
	showClientExit.innerHTML = '#clientExit { display: flex; }';

	document.head.appendChild(showClientExit);
});

const mapSettings: Partial<MapExport> = {
	skyDome: false,
	toneMapping: 4,
	sky: 0x040a14,
	fog: 0x080c12,
	lightI: 1.6
};

const functionHook = new FunctionHooker();
functionHook.hook('JSON.parse', (object: MapExport) => {
	// Check if the parsed object is a map export.
	if (object.name && object.spawns) {
		/**
		 * Merge the parsed map with the client map settings.
		 * Proxy the map settings so whenever they're accessed,
		 * we can pass values and reference mapSettings.
		 */
		return new Proxy({ ...object, ...mapSettings }, {
			get(target: MapExport, key: keyof MapExport) {
				return mapSettings[key] ?? target[key];
			}
		});
	}
	return object;
});
