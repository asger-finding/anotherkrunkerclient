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
	lightI: 1.6,
	light: 0xffffff,
	ambient: 0x2d4c80
};

// Take in hex and return a grayscale hex
function toGrayscale(hex: number | string) {
	if (typeof hex === 'string') {
		hex = hex.replace('#', '');
		hex = parseInt(hex, 16);
	}
	const red = (hex & 0xff0000) >> 16;
	const green = (hex & 0x00ff00) >> 8;
	const blue = hex & 0x0000ff;

	const average = (red + green + blue) / 3;

	return (average << 16) + (average << 8) + (average << 0);
}

const functionHook = new FunctionHooker();
functionHook.hook('JSON.parse', (object: MapExport) => {
	// Check if the parsed object is a map export.
	if (object.name && object.spawns) {
		/**
		 * Merge the parsed map with the client map settings.
		 * Proxy the map settings so whenever they're accessed,
		 * we can pass values and reference mapSettings.
		 */
		for (const index in object.colors) object.colors[index] = toGrayscale(object.colors[index]);
		return new Proxy({ ...object, ...mapSettings }, {
			get(target: MapExport, key: keyof MapExport) {
				return mapSettings[key] ?? target[key];
			}
		});
	}
	return object;
});
