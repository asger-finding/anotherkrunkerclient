import { Color, MapExport } from '@krunker';
import { MESSAGES } from '@constants';
import { Saveables } from '@settings-backend';
import Settings from '@game-settings';
import TwitchChat from '@twitch-chat';
import { promises as fs } from 'fs';
import { hexToRGB } from '@color-utils';
import { ipcRenderer } from 'electron';
import { resolve } from 'path';

/**
 * Return a promise for when/if the DOM content has loaded
 */
const ensureContentLoaded = () => new Promise<void>(promiseResolve => {
	if (document.readyState === 'interactive' || document.readyState === 'complete') promiseResolve();
	else document.addEventListener('DOMContentLoaded', () => promiseResolve());
});

const settings = new Settings();

if (process.isMainFrame) {
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

	const twitchChat = new TwitchChat();
	twitchChat.init();
}

/**
 * Get the saved skycolor config as an array
 * 
 * @returns Top, middle and bottom saved colors in rgb format
 */
const getSavedSkycolor = (): [string, string, string] => {
	const {
		[Saveables.SKY_TOP_COLOR]: topHex,
		[Saveables.SKY_MIDDLE_COLOR]: middleHex,
		[Saveables.SKY_BOTTOM_COLOR]: bottomHex
	} = settings.savedCache as Record<Saveables, string>;
	return [topHex, middleHex, bottomHex];
};

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
					settings.addEventListener(Settings.eventListenerTypes.ON_WRITE_SETTING, eventId => {
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

(() => {
	const jsonParse = JSON.parse;
	JSON.parse = function(...args: unknown[]) {
		const result = jsonParse.apply(this, args as never);

		if (result.name && result.spawns) {
			/**
			 * Merge the parsed map with the client map settings.
			 * Proxy the map settings so whenever they're accessed,
			 * we can pass values and reference mapSettings.
			 */
			const mapSettings = JSON.parse((settings.savedCache.mapAttributes as string | undefined) ?? '{}') as Partial<MapExport>;
			const [topHex, middleHex, bottomHex] = getSavedSkycolor();
			return new Proxy({
				...result,
				...mapSettings,
				...{
					skyDomeCol0: topHex,
					skyDomeCol1: middleHex,
					skyDomeCol2: bottomHex
				}
			}, {
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
			const mapSettings = JSON.parse((settings.savedCache.mapAttributes as string | undefined) ?? '{}') as Partial<MapExport>;

			const [topHex, middleHex, bottomHex] = getSavedSkycolor();
			return new Response(JSON.stringify({
				...json,
				...mapSettings,
				...{
					skyDomeCol0: topHex,
					skyDomeCol1: middleHex,
					skyDomeCol2: bottomHex
				}
			}));
		}

		return result;
	};
})();
