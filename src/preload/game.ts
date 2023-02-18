import { Color, MapExport } from '@typings/krunker';
import { EventListenerTypes, Saveables } from '@settings-backend';
import { parse, resolve } from 'path';
import GameSettings from '@game-settings';
import { KrunkerDomains } from '@typings/client';
import { MESSAGES } from '@constants';
import TwitchChat from '@twitch-chat';
import { promises as fs } from 'fs';
import { hexToRGB } from '@color-utils';
import { ipcRenderer } from 'electron';

/**
 * Return a promise for when/if the DOM content has loaded
 */
const ensureContentLoaded = () => new Promise<void>(promiseResolve => {
	if (document.readyState === 'interactive' || document.readyState === 'complete') promiseResolve();
	else document.addEventListener('DOMContentLoaded', () => promiseResolve());
});

const gameSettings = new GameSettings();

if (process.isMainFrame) {
	gameSettings.itemElements.push(...gameSettings.createSection({
		title: 'Client',
		id: 'client',
		requiresRestart: true
	}, {
		title: 'Twitch Integration',
		type: 'checkbox',
		inputNodeAttributes: {
			id: Saveables.INTEGRATE_WITH_TWITCH,

			/**
			 * Toggle Twitch chat integration
			 * 
			 * @param evt Input event
			 * @returns void
			 */
			oninput: evt => {
				const { checked } = <HTMLInputElement>evt.target;

				return gameSettings.writeSetting(Saveables.INTEGRATE_WITH_TWITCH, checked);
			}
		}
	}, {
		title: 'Resource Swapper Path',
		type: 'text',
		inputNodeAttributes: {
			id: Saveables.RESOURCE_SWAPPER_PATH,
			placeholder: 'default path',

			/**
			 * User-specified path to the resource swapper
			 * 
			 * @param evt Input event
			 * @returns void
			 */
			oninput: evt => {
				const element = evt.target as HTMLInputElement;
				const { value } = element;

				// Validate the path
				if (typeof value === 'string') {
					let filePath = value;
					if (filePath.length > 248) return false;

					const { root } = parse(filePath);
					if (root) filePath = filePath.slice(root.length);

					if (!/[<>:"|?*]/u.test(filePath)) {
						element.classList.remove('inputRed2');
						return gameSettings.writeSetting(Saveables.RESOURCE_SWAPPER_PATH, value);
					}
				}

				element.classList.add('inputRed2');
				return false;
			}
		}
	}, {
		title: 'Reset Filter Lists Cache',
		type: 'button',
		inputNodeAttributes: {
			id: Saveables.RESET_FILTER_LISTS_CACHE,
			innerText: 'Reset',

			/**
			 * Reset the electron blocker cache
			 * 
			 * @returns void
			 */
			onclick: async() => {
				const result: {
					result: boolean,
					message?: string
				} = await ipcRenderer.invoke(MESSAGES.CLEAR_ELECTRON_BLOCKER_CACHE);

				if (result.result) alert('Success in clearing electron blocker cache.\nYour client may take longer to launch next time.');
				else alert(`Error in clearing electron blocker cache:\n${result.message ?? ''}`);
			}
		}
	}, {
		title: 'Filter Lists (JSON Array)',
		type: 'text',
		inputNodeAttributes: {
			id: Saveables.USER_FILTER_LISTS,
			placeholder: '[]',

			/**
			 * User-specified path to the resource swapper
			 * 
			 * @param evt Input event
			 * @returns void
			 */
			// eslint-disable-next-line complexity
			oninput: evt => {
				const element = evt.target as HTMLInputElement;
				let { value } = element;

				// Validate the JSON
				if (value.length) {
					try {
						const parsed = JSON.parse(value);
						if (!Array.isArray(parsed)) throw new Error('Bad type');

						for (const filterList of parsed) {
							if (typeof filterList !== 'string') throw new Error(`Item is of type ${typeof filterList}, expected string`);
							if (filterList.startsWith('swapper://')) continue;

							const url = new URL(filterList);
							if (url.protocol !== 'https:'
								&& url.protocol !== 'http:') throw new Error('Bad URL protocol');
						}
					} catch (err) {
						element.classList.add('inputRed2');
						return false;
					}
				} else {
					value = '[]';
				}
				element.classList.remove('inputRed2');

				return gameSettings.writeSetting(Saveables.USER_FILTER_LISTS, value);
			}
		}
	}, {
		title: 'Game Frontend',
		type: 'select',
		inputNodeAttributes: {
			id: Saveables.GAME_FRONTEND,
			value: <KrunkerDomains>'krunker.io',

			/**
			 * Dropdown selector for krunker.io or browserfps.com
			 * 
			 * @param evt Input event
			 * @returns void
			 */
			oninput: evt => {
				const element = evt.target as HTMLInputElement;
				const { value } = element;

				return gameSettings.writeSetting(Saveables.GAME_FRONTEND, value);
			}
		},
		options: <Record<KrunkerDomains, KrunkerDomains>>{
			'krunker.io': 'krunker.io',
			'browserfps.com': 'browserfps.com'
		}
	}), ...gameSettings.createSection({
		title: 'Non-restart settings',
		id: 'noReload',
		requiresRestart: false
	}, {
		title: 'Reply to !link in Twitch chat',
		type: 'checkbox',
		inputNodeAttributes: {
			id: Saveables.ALLOW_TWITCH_LINK_COMMAND,
			value: 'off',

			/**
			 * Toggle whether !link is active
			 * 
			 * @param evt Input event
			 * @returns void
			 */
			oninput: evt => {
				const { checked } = <HTMLInputElement>evt.target;

				return gameSettings.writeSetting(Saveables.ALLOW_TWITCH_LINK_COMMAND, checked);
			}
		}
	}), ...gameSettings.createSection({
		title: 'Game Modification',
		id: 'gameModding',
		requiresRestart: false
	}, {
		title: 'Map Attributes (JSON)',
		type: 'text',
		inputNodeAttributes: {
			id: Saveables.MAP_ATTRIBUTES,
			value: '{}',

			/**
			 * Get and validate map attribute JSON.
			 * 
			 * @param evt Input event
			 * @returns void
			 */
			oninput: evt => {
				const element = evt.target as HTMLInputElement;
				let { value } = element;

				// Validate the JSON
				if (value.length) {
					try { JSON.parse(value); } catch {
						element.classList.add('inputRed2');
						return false;
					}
				} else {
					value = '{}';
				}
				element.classList.remove('inputRed2');

				return gameSettings.writeSetting(Saveables.MAP_ATTRIBUTES, value);
			}
		}
	},
	{
		title: 'Skydome Top Color',
		type: 'color',
		inputNodeAttributes: {
			id: Saveables.SKY_TOP_COLOR,

			/**
			 * Set top sky color
			 * 
			 * @param evt Input event
			 * @returns void
			 */
			oninput: evt => {
				const { value } = <HTMLInputElement>evt.target;

				return gameSettings.writeSetting(Saveables.SKY_TOP_COLOR, value);
			}
		}
	},
	{
		title: 'Skydome Middle Color',
		type: 'color',
		inputNodeAttributes: {
			id: Saveables.SKY_MIDDLE_COLOR,

			/**
			 * Set middle sky color
			 * 
			 * @param evt Input event
			 * @returns void
			 */
			oninput: evt => {
				const { value } = <HTMLInputElement>evt.target;

				return gameSettings.writeSetting(Saveables.SKY_MIDDLE_COLOR, value);
			}
		}
	},
	{
		title: 'Skydome Bottom Color',
		type: 'color',
		inputNodeAttributes: {
			id: Saveables.SKY_BOTTOM_COLOR,

			/**
			 * Set bottom sky color
			 * 
			 * @param evt Input event
			 * @returns void
			 */
			oninput: evt => {
				const { value } = <HTMLInputElement>evt.target;

				return gameSettings.writeSetting(Saveables.SKY_BOTTOM_COLOR, value);
			}
		}
	}));

	(async function() {
		const [css] = await Promise.all([
			fs.readFile(resolve(__dirname, '../renderer/styles/main.css'), 'utf8'),
			ensureContentLoaded()
		]);

		const injectElement = document.createElement('style');
		injectElement.innerHTML = css;
		document.head.appendChild(injectElement);
	}());

	/** Send a close message to main when function is called */
	const closeClient = () => {
		ipcRenderer.send(MESSAGES.EXIT_CLIENT);
	};

	// When closeClient is called from the onclick, close the client. The game will attempt to override this.
	Reflect.defineProperty(window, 'closeClient', {
		set() {
			Reflect.defineProperty(window, 'closeClient', { value: closeClient });
		},
		get() {
			return closeClient;
		}
	});

	if (gameSettings.getSetting(Saveables.INTEGRATE_WITH_TWITCH, false)) {
		const twitchChat = new TwitchChat();
		twitchChat.init();
	}
}

/**
 * Get the saved skycolor config as an array
 * 
 * @returns Top, middle and bottom saved colors in rgb format
 */
const getSavedSkycolor = (): [string, string, string] => ([
	gameSettings.getSetting(Saveables.SKY_TOP_COLOR, '#0a0b0c'),
	gameSettings.getSetting(Saveables.SKY_MIDDLE_COLOR, '#0a0b0c'),
	gameSettings.getSetting(Saveables.SKY_BOTTOM_COLOR, '#0a0b0c')
] as ReturnType<typeof getSavedSkycolor>);

type ThreeRenderer = {
	getContext: () => WebGL2RenderingContext;
	[key: string]: unknown;
};
type ThreeProgram = {
	getUniforms: () => {
		seq: [never];
		map: Record<string, Record<string, never> & {
			addr: WebGLUniformLocation;
		}>
	}
	cacheKey: string;
	program: WebGLProgram;
	[key: string]: unknown;
};

/**
 * Set the top, middle and bottom sky color of the skydome program
 * 
 * @param renderer THREE.js renderer instance
 * @param skydomeProgram The program for the skydome
 * @param firstColor Top color of the skydome
 * @param middleColor Middle color of the skydome
 * @param endColor Bottom color of the skydome
 */
const setSkycolor = (renderer: ThreeRenderer, skydomeProgram: ThreeProgram, firstColor: Color, middleColor: Color, endColor: Color): void => {
	const gl: WebGL2RenderingContext = renderer.getContext();
	const initialProgram = renderer.getContext().getParameter(renderer.getContext().CURRENT_PROGRAM);
	const { map } = skydomeProgram.getUniforms();

	if (map.firstColor && map.middleColor && map.endColor) {
		gl.useProgram(skydomeProgram.program);
		gl.uniform3f(map.firstColor.addr, ...firstColor);
		gl.uniform3f(map.middleColor.addr, ...middleColor);
		gl.uniform3f(map.endColor.addr, ...endColor);

		gl.useProgram(initialProgram);
	}
};

Reflect.defineProperty(Object.prototype, 'renderer', {
	set(renderer) {
		Reflect.defineProperty(renderer.info.programs, 'push', {
			value(...args: unknown[]) {
				const [program] = args as [ThreeProgram];

				if (program.cacheKey.includes('firstColor')) {
					gameSettings.addEventListener(EventListenerTypes.ON_WRITE_SETTING, eventId => {
						const [top, middle, bottom] = hexToRGB(1, ...getSavedSkycolor());
						if (eventId === Saveables.SKY_TOP_COLOR
							|| eventId === Saveables.SKY_MIDDLE_COLOR
							|| eventId === Saveables.SKY_BOTTOM_COLOR) setSkycolor(renderer, program, top, middle, bottom);
					});
					Reflect.defineProperty(renderer.info.programs, 'push', { value: Array.prototype.push });
				}

				return Array.prototype.push.apply(this, args);
			},
			enumerable: true,
			configurable: true
		});

		return Reflect.defineProperty(this, 'renderer', { value: renderer });
	},
	get() {
		return Reflect.getOwnPropertyDescriptor(this, 'renderer')?.value;
	}
});

// Disabled until further notice
(() => {
	return;

	(nativeFetch => {
		window.fetch = async function(...args: unknown[]) {
			const result = await nativeFetch.apply(this, args as never);

			const [target] = args;
			if (typeof target === 'string' && /^maps\/(?:.*)(?:.\.json)/u.test(target)) {
				const clone = result.clone();
				const json = await clone.json();

				const mapSettings = JSON.parse(gameSettings.getSetting(Saveables.MAP_ATTRIBUTES, '{}') as string) as Partial<MapExport>;
				const [skyDomeCol0, skyDomeCol1, skyDomeCol2] = getSavedSkycolor();
				const spoofedString = JSON.stringify({
					...json,
					...mapSettings,
					...{ skyDomeCol0, skyDomeCol1, skyDomeCol2 }
				});
				const spoofedStream = new ReadableStream({
					start(controller) {
						controller.enqueue(spoofedString);
						controller.close();
					}
				});

				Reflect.defineProperty(result, 'body', {
					get() {
						return spoofedStream;
					}
				});
			}

			return result;
		};
	})(window.fetch);

	(nativeParse => {
		JSON.parse = function(...args: unknown[]) {
			const result = nativeParse.apply(this, args as never);

			if (result instanceof Object && result.name && result.spawns) {
				/**
				 * Merge the parsed map with the client map settings.
				 * Proxy the map settings so whenever they're accessed,
				 * we can pass values and reference mapSettings.
				 */
				const mapSettings = nativeParse(gameSettings.getSetting(Saveables.MAP_ATTRIBUTES, '{}') as string) as Partial<MapExport>;
				const [skyDomeCol0, skyDomeCol1, skyDomeCol2] = getSavedSkycolor();
				return new Proxy({
					...result,
					...mapSettings,
					...{ skyDomeCol0, skyDomeCol1, skyDomeCol2 }
				}, {
					get(target: MapExport, key: keyof MapExport) {
						return mapSettings[key] ?? target[key];
					}
				});
			}

			return result;
		};
	})(JSON.parse);
})();
