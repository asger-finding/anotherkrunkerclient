import { MESSAGES } from '@constants';
import { MapExport } from '@krunker';
import Settings from '@game-settings';
import TwitchChat from '@twitch-chat';
import { promises as fs } from 'fs';
import { ipcRenderer } from 'electron';
import { resolve } from 'path';

if (process.isMainFrame) {
	/**
	 * Return a promise for when/if the DOM content has loaded
	 */
	const ensureContentLoaded = () => new Promise<void>(promiseResolve => {
		if (document.readyState === 'interactive' || document.readyState === 'complete') promiseResolve();
		else document.addEventListener('DOMContentLoaded', () => promiseResolve());
	});

	(async function() {
		const [css] = await Promise.all([
			fs.readFile(resolve(__dirname, '../renderer/styles/main.css'), 'utf8'),
			ensureContentLoaded()
		]);

		const injectElement = document.createElement('style');
		injectElement.innerHTML = css;
		document.head.appendChild(injectElement);
	}());

	/**
	 * Send a close message to main when function is called
	 *
	 * @returns void
	 */
	const exitClient = () => ipcRenderer.send(MESSAGES.EXIT_CLIENT);

	// When closeClient is called from the onclick, close the client. The game will attempt to override this.
	Reflect.defineProperty(window, 'closeClient', {
		set() {
			Reflect.defineProperty(window, 'closeClient', { value: exitClient });
		},
		get() {
			return exitClient;
		}
	});

	const twitchChat = new TwitchChat();
	twitchChat.init();

	const settings = new Settings();
	settings.init(ensureContentLoaded());
}

const mapSettings: Partial<MapExport> = {
	skyDome: false,
	toneMapping: 4,
	sky: 0x040a14,
	fog: 0x080c12,
	lightI: 1.6,
	light: 0xffffff,
	ambient: 0x2d4c80
};

const jsonParse = JSON.parse;
JSON.parse = function(...args: unknown[]) {
	const result = jsonParse.apply(this, args as never);

	if (result.name && result.spawns) {
		/**
		 * Merge the parsed map with the client map settings.
		 * Proxy the map settings so whenever they're accessed,
		 * we can pass values and reference mapSettings.
		 */
		return new Proxy({ ...result, ...mapSettings }, {
			get(target: MapExport, key: keyof MapExport) {
				return mapSettings[key] ?? target[key];
			}
		});
	}

	return result;
};

const nativeFetch = fetch;
window.fetch = async function(...args: unknown[]) {
	const result = await nativeFetch.apply(this, args as never);


	const [target] = args;
	if (typeof target === 'string' && /^maps\/(?:.*)(?:.\.json)/u.test(target)) {
		const json = await (result.clone()).json();

		return new Response(JSON.stringify({ ...json, ...mapSettings }));
	}

	return result;
};
