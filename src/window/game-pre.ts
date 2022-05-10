// TODO: Clean up messy code.

import '../aliases';
import '@game-settings';
import '@game-api';

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

const { parse } = JSON;
const proxy = <typeof JSON.parse> function(text, reviver) {
	const parsed: MapExport = parse(text, reviver);

	// Check if the parsed object is a map export.
	if (parsed.name && parsed.spawns) {
		/**
		 * Merge the parsed map with the client map settings.
		 * Proxy the map settings so whenever they're accessed,
		 * we can pass values and reference mapSettings.
		 */
		return new Proxy({ ...parsed, ...mapSettings }, {
			get(target: MapExport, key: keyof MapExport) {
				return mapSettings[key] ?? target[key];
			}
		});
	}
	return parsed;
};
Reflect.defineProperty(JSON, 'parse', { value: proxy });

interface IFrameWindow {
	JSON: typeof JSON;
	HTMLBodyElement: typeof HTMLBodyElement;
}

const { appendChild } = HTMLBodyElement.prototype;
const appendChildHook = function(this: unknown, child: Node) {
	appendChild.call(this, child);

	if (child instanceof HTMLIFrameElement && !child.src && child.contentWindow) {
		const iFrameWindow = child.contentWindow as unknown as IFrameWindow;

		Reflect.defineProperty(iFrameWindow.JSON, 'parse', { value: proxy });

		// Recursively hook sub-frames's JSON.parse.
		Reflect.defineProperty(iFrameWindow.HTMLBodyElement.prototype, 'appendChild', { value: appendChildHook });
	}
} as typeof HTMLBodyElement.prototype.appendChild;
Reflect.defineProperty(HTMLBodyElement.prototype, 'appendChild', { value: appendChildHook });
