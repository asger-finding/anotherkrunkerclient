import '@game-settings';

import FunctionHook from '@function-hooker';
import { MESSAGE_EXIT_CLIENT } from '@constants';
import { MapExport } from '../krunker';
import TwitchChat from '@twitch-chat';
import { promises as fs } from 'fs';
import { ipcRenderer } from 'electron';
import { resolve } from 'path';

(async function() {
	const css = await fs.readFile(resolve(__dirname, '../renderer/styles/main.css'), 'utf8');

	/** Inject the read css file into the DOM */
	function inject() {
		const injectElement = document.createElement('style');
		injectElement.innerHTML = css;
		document.head.appendChild(injectElement);
	}

	if (document.readyState === 'interactive' || document.readyState === 'complete') inject();
	else document.addEventListener('DOMContentLoaded', inject);
}());

// When closeClient is called from the onclick, close the client. The game will attempt to override this.
Object.defineProperty(window, 'closeClient', {
	enumerable: false,
	value(): void { return ipcRenderer.send(MESSAGE_EXIT_CLIENT); }
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

const functionHook = new FunctionHook();
functionHook.hook('JSON.parse', (object: MapExport | Record<string, unknown>) => {
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

const twitchChat = new TwitchChat();
twitchChat.init();
