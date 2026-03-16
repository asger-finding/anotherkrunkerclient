
import { EventListeners, Savable } from '@settings-backend';
import { hexToRGB } from '@color-utils';
import { parse, resolve } from 'path';
import DiscordRPC from '@renderer/discord-rpc';
import GameSettings from '@game-settings';
import { type KrunkerDomains } from '@typings/client';
import { MESSAGES } from '@constants';
import TwitchChat from '@twitch-chat';
import { promises as fs } from 'fs';
import { ipcRenderer } from 'electron';

const ensureContentLoaded = () => new Promise<void>(promiseResolve => {
	if (document.readyState === 'interactive' || document.readyState === 'complete') promiseResolve();
	else document.addEventListener('DOMContentLoaded', () => promiseResolve());
});

const gameSettings = new GameSettings();

// Cap frame rate to prevent compositor stalls with --disable-frame-rate-limit
(function frameLimiter() {
	const TARGET_FPS = 500;
	const FRAME_TIME = 1000 / TARGET_FPS;
	const originalRAF = window.requestAnimationFrame;
	let lastFrame = 0;

	window.requestAnimationFrame = function(callback: FrameRequestCallback) {
		return originalRAF.call(window, (timestamp: number) => {
			const elapsed = timestamp - lastFrame;
			if (elapsed >= FRAME_TIME) {
				lastFrame = timestamp - (elapsed % FRAME_TIME);
				callback(timestamp);
			} else {
				originalRAF.call(window, (ts: number) => {
					lastFrame = ts;
					callback(ts);
				});
			}
		});
	};
}());

// Hook WebGL to detect the skydome shader program by its uniforms,
// avoiding Object.prototype modification that triggers anti-cheat.
(function hookSkydomeShader() {
	const SKYDOME_UNIFORMS = ['firstColor', 'middleColor', 'endColor'] as const;
	let skydomeProgram: WebGLProgram | null = null;
	let skyUniforms: Record<string, WebGLUniformLocation | null> | null = null;

	for (const Proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype] as const) {
		const originalLinkProgram = Proto.linkProgram;
		Proto.linkProgram = function(this: WebGLRenderingContext | WebGL2RenderingContext, program: WebGLProgram) {
			originalLinkProgram.call(this, program);

			const activeUniforms = this.getProgramParameter(program, this.ACTIVE_UNIFORMS) as number;
			const uniformNames: string[] = [];
			for (let i = 0; i < activeUniforms; i++) {
				const info = this.getActiveUniform(program, i);
				if (info) uniformNames.push(info.name);
			}

			if (SKYDOME_UNIFORMS.every(name => uniformNames.includes(name))) {
				skydomeProgram = program;
				skyUniforms = {};
				for (const name of SKYDOME_UNIFORMS) {
					skyUniforms[name] = this.getUniformLocation(program, name);
				}
			}
		};
	}

	let activeProgram: WebGLProgram | null = null;
	const originalUseProgram = WebGL2RenderingContext.prototype.useProgram;
	WebGL2RenderingContext.prototype.useProgram = function(program: WebGLProgram | null) {
		activeProgram = program;
		return originalUseProgram.call(this, program);
	};

	let skyColors: [number[], number[], number[]] | null = null;

	const updateSkyColors = () => {
		const [top, middle, bottom] = hexToRGB(1,
			gameSettings.getSetting(Savable.SKY_TOP_COLOR, '#0a0b0c'),
			gameSettings.getSetting(Savable.SKY_MIDDLE_COLOR, '#0a0b0c'),
			gameSettings.getSetting(Savable.SKY_BOTTOM_COLOR, '#0a0b0c')
		);
		skyColors = [top, middle, bottom];
	};
	updateSkyColors();

	gameSettings.addEventListener(EventListeners.ON_WRITE_SETTING, eventId => {
		if (eventId === Savable.SKY_TOP_COLOR
			|| eventId === Savable.SKY_MIDDLE_COLOR
			|| eventId === Savable.SKY_BOTTOM_COLOR) updateSkyColors();
	});

	const overrideSkyUniforms = function(this: WebGL2RenderingContext) {
		if (skydomeProgram && activeProgram === skydomeProgram && skyUniforms && skyColors) {
			if (skyUniforms.firstColor) this.uniform3f(skyUniforms.firstColor, ...skyColors[0] as [number, number, number]);
			if (skyUniforms.middleColor) this.uniform3f(skyUniforms.middleColor, ...skyColors[1] as [number, number, number]);
			if (skyUniforms.endColor) this.uniform3f(skyUniforms.endColor, ...skyColors[2] as [number, number, number]);
		}
	};

	const originalDrawArrays = WebGL2RenderingContext.prototype.drawArrays;
	WebGL2RenderingContext.prototype.drawArrays = function(...args: Parameters<WebGL2RenderingContext['drawArrays']>) {
		overrideSkyUniforms.call(this);
		return originalDrawArrays.apply(this, args);
	};

	const originalDrawElements = WebGL2RenderingContext.prototype.drawElements;
	WebGL2RenderingContext.prototype.drawElements = function(...args: Parameters<WebGL2RenderingContext['drawElements']>) {
		overrideSkyUniforms.call(this);
		return originalDrawElements.apply(this, args);
	};
}());

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

	gameSettings.itemElements.push(...gameSettings.createSection({
		title: 'Client',
		id: 'client',
		requiresRestart: true
	}, {
		title: 'Twitch Integration',
		type: 'checkbox',
		inputNodeAttributes: {
			id: Savable.INTEGRATE_WITH_TWITCH,
			oninput: evt => {
				const { checked } = <HTMLInputElement>evt.target;
				return gameSettings.writeSetting(Savable.INTEGRATE_WITH_TWITCH, checked);
			}
		}
	}, {
		title: 'Resource Swapper Path',
		type: 'text',
		inputNodeAttributes: {
			id: Savable.RESOURCE_SWAPPER_PATH,
			placeholder: 'default path',
			oninput: evt => {
				const element = evt.target as HTMLInputElement;
				const { value } = element;

				if (typeof value === 'string') {
					let filePath = value;
					if (filePath.length > 248) return false;

					const { root } = parse(filePath);
					if (root) filePath = filePath.slice(root.length);

					if (!/[<>:"|?*]/u.test(filePath)) {
						element.classList.remove('inputRed2');
						return gameSettings.writeSetting(Savable.RESOURCE_SWAPPER_PATH, value);
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
			id: Savable.RESET_FILTER_LISTS_CACHE,
			innerText: 'Reset',
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
		title: 'Filter Lists',
		type: 'text',
		inputNodeAttributes: {
			id: Savable.USER_FILTER_LISTS,
			placeholder: '',
			// eslint-disable-next-line complexity
			oninput: evt => {
				const element = evt.target as HTMLInputElement;
				let { value } = element;

				if (value.length) {
					try {
						const parsed = value.split(',');
						if (!Array.isArray(parsed)) throw new Error('Bad type');

						for (const filterList of parsed) {
							if (typeof filterList !== 'string') throw new Error(`Item is of type ${typeof filterList}, expected string`);
							if (filterList.startsWith('swapper://')) continue;

							const url = new URL(filterList);
							if (url.href !== filterList) throw new Error('FilterList URL is not properly URL-encoded');
							if (url.protocol !== 'https:'
								&& url.protocol !== 'http:') throw new Error('Bad URL protocol');
						}
					} catch (err) {
						element.classList.add('inputRed2');
						return false;
					}
				} else {
					value = '';
				}
				element.classList.remove('inputRed2');

				return gameSettings.writeSetting(Savable.USER_FILTER_LISTS, value);
			}
		}
	}, {
		title: 'Game Frontend',
		type: 'select',
		inputNodeAttributes: {
			id: Savable.GAME_FRONTEND,
			value: <KrunkerDomains>'krunker.io',
			oninput: evt => {
				const element = evt.target as HTMLInputElement;
				const { value } = element;
				return gameSettings.writeSetting(Savable.GAME_FRONTEND, value);
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
			id: Savable.ALLOW_TWITCH_LINK_COMMAND,
			value: 'off',
			oninput: evt => {
				const { checked } = <HTMLInputElement>evt.target;
				return gameSettings.writeSetting(Savable.ALLOW_TWITCH_LINK_COMMAND, checked);
			}
		}
	}, {
		title: 'Render Twitch chatters name color',
		type: 'checkbox',
		inputNodeAttributes: {
			id: Savable.RENDER_TWITCH_NAME_COLOR,
			value: 'off',
			oninput: evt => {
				const { checked } = <HTMLInputElement>evt.target;
				return gameSettings.writeSetting(Savable.RENDER_TWITCH_NAME_COLOR, checked);
			}
		}
	}), ...gameSettings.createSection({
		title: 'Game Modification',
		id: 'gameModding',
		requiresRestart: false
	}, {
		title: 'Skydome Top Color',
		type: 'color',
		inputNodeAttributes: {
			id: Savable.SKY_TOP_COLOR,
			oninput: evt => {
				const { value } = <HTMLInputElement>evt.target;
				return gameSettings.writeSetting(Savable.SKY_TOP_COLOR, value);
			}
		}
	},
	{
		title: 'Skydome Middle Color',
		type: 'color',
		inputNodeAttributes: {
			id: Savable.SKY_MIDDLE_COLOR,
			oninput: evt => {
				const { value } = <HTMLInputElement>evt.target;
				return gameSettings.writeSetting(Savable.SKY_MIDDLE_COLOR, value);
			}
		}
	},
	{
		title: 'Skydome Bottom Color',
		type: 'color',
		inputNodeAttributes: {
			id: Savable.SKY_BOTTOM_COLOR,
			oninput: evt => {
				const { value } = <HTMLInputElement>evt.target;
				return gameSettings.writeSetting(Savable.SKY_BOTTOM_COLOR, value);
			}
		}
	}));

	const closeClient = () => {
		ipcRenderer.send(MESSAGES.EXIT_CLIENT);
	};

	Reflect.defineProperty(window, 'closeClient', {
		set() {
			Reflect.defineProperty(window, 'closeClient', { value: closeClient });
		},
		get() {
			return closeClient;
		}
	});

	if (gameSettings.getSetting(Savable.INTEGRATE_WITH_TWITCH, false)) {
		const twitchChat = new TwitchChat();
		const discordRpc = new DiscordRPC();
	}
}
