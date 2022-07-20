import '@game-settings';

import FunctionHook from '@function-hooker';
import { MESSAGE_EXIT_CLIENT } from '@constants';
import { MapExport } from '../krunker';
import { TwitchMessage } from '@client';
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

let chatList = document.getElementById('chatList');

/**
 * Construct an in-game chat message from a Twitch message.
 * 
 * @param message - The Twitch message and username.
 * @returns The chat message element.
 */
function constructChatMessage(message: TwitchMessage): HTMLDivElement {
	// Get the last element in chatList
	const lastElement = chatList?.lastElementChild as HTMLDivElement;
	const lastIndex = lastElement?.id?.lastIndexOf('_') ?? 0;
	const lastId = Number(lastElement?.id?.substring(lastIndex + 1) ?? '-1');

	const wrapper = document.createElement('div');
	wrapper.setAttribute('data-tab', '-1');
	wrapper.setAttribute('id', `chatMsg_${lastId + 1}`);

	const chatItem = document.createElement('div');
	chatItem.setAttribute('class', 'chatItem');
	chatItem.setAttribute('style', 'background-color: rgba(0, 0, 0, 0.3)');
	chatItem.innerText = `\u200e${ message.username }\u200e: `;

	const chatMsg = document.createElement('span');
	chatMsg.setAttribute('class', 'chatMsg');
	chatMsg.innerText = `\u200e${ message.message }\u200e`;

	chatItem.append(chatMsg);
	wrapper.append(chatItem);

	return wrapper;
}

/**
 * Construct and add a chat message to the chat list.
 * 
 * @param message - The Twitch message and username.
 */
function createAndAppend(message: TwitchMessage): void {
	const chatMessage = constructChatMessage(message);
	chatList?.append(chatMessage);
}

ipcRenderer.on('twitch-message', (_evt, message: TwitchMessage) => {
	if (chatList) { createAndAppend(message); } else {
		chatList = document.getElementById('chatList');
		if (chatList) createAndAppend(message);
	}
});
