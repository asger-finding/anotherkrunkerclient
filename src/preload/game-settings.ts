import { EventListener, InputNodeAttributes } from '@client';
import store from '@store';

enum Frames {
	MAINFRAME,
	SUBFRAME
}
export enum Saveables {
	MAP_ATTRIBUTES = 'mapAttributes',
	SKY_TOP_COLOR = 'skyTopColor',
	SKY_MIDDLE_COLOR = 'skyMiddleColor',
	SKY_BOTTOM_COLOR = 'skyBottomColor'
}
export enum EventListenerTypes {
	WRITE_SETTING
}

export default class Settings {

	static prefix = 'settings';

	itemElements: HTMLElement[] = [];

	saved: { [key in Saveables]?: unknown } = {};

	savables = Saveables;

	private writeSettingEventListeners: Array<EventListener>;

	/**
	 * Initialize the base settings exclusively for store
	 */
	initSubFrame(): void {
		Settings.expectFrame(Frames.SUBFRAME);

		this.saved = store.get(Settings.prefix) as typeof this.saved;
		this.writeSettingEventListeners = [];
	}

	/**
	 * Initialize the store for main frame
	 * 
	 * @param DOMContentLoadedPromise A promise that will be resolved when the DOM is loaded
	 */
	async initMainFrame(DOMContentLoadedPromise: Promise<void>): Promise<void> {
		Settings.expectFrame(Frames.MAINFRAME);

		this.writeSettingEventListeners = [];
		[this.saved] = await Promise.all([
			store.get(Settings.prefix),
			DOMContentLoadedPromise,
			this.generateSettings()
		]) as [typeof this.saved, ...Array<unknown>];

		const interval = setInterval(() => {
			const instructions = document.getElementById('instructions');
			if (instructions) {
				this.observeInstructions(instructions as HTMLDivElement);
				clearInterval(interval);
			}
		}, 100);
	}

	/**
	 * Check if the frame aligns to what is expected. Else, throw an error.
	 * 
	 * @param expected If process.isMainFrame should return false.
	 */
	private static expectFrame(expected: Frames) {
		if (process.isMainFrame && Frames.SUBFRAME === expected) throw new Error('Saw main frame and expected sub frame');
		if (!process.isMainFrame && Frames.MAINFRAME === expected) throw new Error('Saw sub frame and expected main frame');
	}

	/**
	 *
	 * @param instructions The krunker instructions element
	 */
	private observeInstructions(instructions: HTMLDivElement) {
		Settings.expectFrame(Frames.MAINFRAME);

		new MutationObserver((_mutations, observer) => {
			observer.disconnect();

			interface KrunkerWindow extends Window {
				windows: [
					{
						applyAllWeps: (...args: unknown[]) => void;
						changeTab: (...args: unknown[]) => void;
						changeWep: (...args: unknown[]) => void;
						collapseFolder: (...args: unknown[]) => void;
						currWep: number;
						dark: boolean;
						gen: () => string;
						genList: (...args: unknown[]) => string;
						getSettings: (...args: unknown[]) => string;
						getTabs: (...args: unknown[]) => string;
						header: string;
						html: string;
						label: string;
						maxH: string;
						popup: boolean;
						resetAllWeps: (...args: unknown[]) => void;
						searchList: () => void;
						searchMatches: (...args: unknown[]) => boolean;
						settingSearch: string | null;
						settingType: string;
						sticky: boolean;
						tabIndex: number;
						tabs: {
							basic: Array<Record<string, unknown>>;
							advanced: Array<Record<string, unknown>>;
						}
						toggleType: (evt: Event) => void;
						width: number;
					},
					...Record<string, unknown>[]
				]
			}
			const [settingsWindow] = (window as unknown as KrunkerWindow).windows;

			if (settingsWindow.label !== 'settings') throw new Error('Wrong Game Settings index');

			const getSettingsHook = settingsWindow.getSettings.bind(settingsWindow);
			const getTabsHook = settingsWindow.getTabs.bind(settingsWindow);
			const changeTabHook = settingsWindow.changeTab.bind(settingsWindow);
			const genListHook = settingsWindow.genList.bind(settingsWindow);

			// Compensate for user agent spoofing
			const isElectron = navigator.userAgent.includes('Electron');
			let tabsLength = -1;
			let isClientTab = false;

			/**
			 * Append the client tab to the settings window
			 *
			 * @param args the native function arguments
			 * @returns The html for the settings tabs
			 */
			settingsWindow.getTabs = (...args: unknown[]) => {
				const result: string = getTabsHook(...args);

				tabsLength = ((result.match(/<\/div>/gu) ?? []).length);
				isClientTab = settingsWindow.tabIndex === tabsLength;

				const clientTab = Object.assign(document.createElement('div'), {
					innerText: 'Client',
					style: 'border-bottom: 5px solid transparent;'
				});
				const attributes = {
					class: `settingTab ${isClientTab ? 'tabANew' : ''}`,
					onmouseenter: 'playTick()',
					onclick: `playSelect(0.1);window.windows[0].changeTab(${ tabsLength })`
				};
				for (const [key, value] of Object.entries(attributes)) clientTab.setAttribute(key, value);

				return result + (!isElectron ? clientTab.outerHTML : '');
			};

			/**
			 * Void getSettingsCall if it's the client tab
			 *
			 * @param args the native function arguments
			 * @returns The html for the settings body
			 */
			settingsWindow.getSettings = (...args: unknown[]) => {
				const result: string = getSettingsHook(...args);

				if (isClientTab) return '';
				return result;
			};

			/**
			 * Append the client settings elements to the settings window if it's the client tab
			 * 
			 * @param args the native function arguments
			 * @returns The native function result
			 */
			settingsWindow.changeTab = (...args: unknown[]) => {
				const result = changeTabHook(...args);

				if (isClientTab) {
					const settingsHolder = document.getElementById('settHolder');
					if (settingsHolder) {
						settingsHolder.innerHTML = '';
						settingsHolder.append(...this.itemElements);
					}
				}

				return result;
			};

			/**
			 * 
			 * 
			 * @param args the native function arguments
			 * @returns The native function result
			 */
			settingsWindow.genList = (...args: unknown[]) => {
				const result = genListHook(...args);

				if (isClientTab) {
					const menuWindow = document.getElementById('menuWindow');
					if (menuWindow) {
						new MutationObserver((mutations, childObserver) => {
							// Iterate over all mutations
							for (const mutation of mutations) {
								for (const node of mutation.addedNodes) {
									if (node instanceof HTMLElement && node.id === 'settHolder') {
										childObserver.disconnect();

										node.innerHTML = '';
										node.append(...this.itemElements);
									}
								}
							}
						}).observe(menuWindow, { childList: true });
					}
				}


				return result;
			};
		}).observe(instructions, { childList: true });
	}

	/**
	 * @returns The generated settings elements
	 */
	generateSettings(): Node[] {
		Settings.expectFrame(Frames.MAINFRAME);

		const parenter = {
			set(target: Record<string, unknown>, prop: string, value: unknown) {
				if (value instanceof Object) {
					const proxy: typeof target = new Proxy({ parent: target }, parenter);
					for (const key in value) proxy[key] = value[key];

					target[prop] = proxy;
					return proxy;
				}

				target[prop] = value;
				return value;
			}
		};

		// Placeholder section
		const clientSection = this.createSection({
			title: 'Client',
			id: 'client',
			requiresRestart: true
		}, {
			title: 'Map Attributes (JSON)',
			type: 'text',
			inputNodeAttributes: {
				id: Saveables.MAP_ATTRIBUTES,

				/**
				 * Get and validate map attribute JSON.
				 * 
				 * @param evt Input event
				 * @returns void
				 */
				oninput: evt => {
					const { value } = <HTMLInputElement>evt.target;

					// Validate the JSON
					try {
						JSON.parse(value);
					} catch {
						// eslint-disable-next-line no-alert
						return alert('Invalid JSON');
					}

					return this.writeSetting(Saveables.MAP_ATTRIBUTES, (<HTMLInputElement>evt.target).value);
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

					return this.writeSetting(Saveables.SKY_TOP_COLOR, value);
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

					return this.writeSetting(Saveables.SKY_MIDDLE_COLOR, value);
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

					return this.writeSetting(Saveables.SKY_BOTTOM_COLOR, value);
				}
			}
		});

		const items = this.itemElements = [...clientSection];
		return items;
	}

	/**
	 * Get a setting from cache, if false try the config file, or return `null`
	 * 
	 * @param key The setting to get
	 * @returns Saved value or null
	 */
	public getSetting(key: Saveables): unknown | null {
		return this.saved[key] ?? store.get(`${ Settings.prefix }.${ key }`, null);
	}

	/**
	 * Save setting to the store
	 * 
	 * @param key Key to save value to
	 * @param value Value to write to key
	 */
	private writeSetting(key: Saveables, value: unknown): void {
		if (typeof value !== 'undefined' && value !== null) {
			store.set(`${ Settings.prefix }.${ key }`, value);
			this.saved[key] = value;
			this.emitEvent(EventListenerTypes.WRITE_SETTING, key, value);
		}
	}

	/**
	 * Push an event listener to the class
	 * 
	 * @param type Event listener type
	 * @param eventListener Event listener callback function
	 */
	public addEventListener(type: EventListenerTypes, eventListener: EventListener): void {
		switch (type) {
			case EventListenerTypes.WRITE_SETTING:
				this.writeSettingEventListeners.push(eventListener);
				break;
			default:
				break;
		}
	}

	/**
	 * Emit a new event to settings event listeners
	 * 
	 * @param type Event type
	 * @param eventId The id for the event to distinguish them
	 * @param data Optional data attached
	 */
	private emitEvent(type: EventListenerTypes, eventId: string, data?: unknown): void {
		switch (type) {
			case EventListenerTypes.WRITE_SETTING:
				for (const eventListener of this.writeSettingEventListeners) eventListener(eventId, data);
				break;
			default:
				break;
		}
	}

	/**
	 * @param sectionData the section body data
	 * @param sectionData.title the section title
	 * @param sectionData.id the section id
	 * @param sectionData.requiresRestart whether the section requires a restart
	 * @param properties the section elements
	 * @returns The section header and body
	 */
	public createSection(sectionData: {
		title: string;
		id: string;
		requiresRestart?: boolean;
	}, ...properties: {
		title: string;
		type: 'checkbox' | 'slider' | 'select' | 'color' | 'text';
		inputNodeAttributes: InputNodeAttributes<Event | MouseEvent>;
		options?: Record<string, string>
	}[]): HTMLElement[] {
		Settings.expectFrame(Frames.MAINFRAME);

		const header = document.createElement('div');
		header.classList.add('setHed');
		header.id = `setHed_${ sectionData.id }`;
		header.innerText = sectionData.title;

		const icon = document.createElement('span');
		icon.classList.add('material-icons', 'plusOrMinus');
		icon.innerText = 'keyboard_arrow_down';
		header.prepend(icon);

		if (sectionData.requiresRestart) {
			const requiresRestartSpan = document.createElement('span');
			requiresRestartSpan.id = 'requiresRestart';

			requiresRestartSpan.innerText = ' requires restart';
			requiresRestartSpan.prepend(Object.assign(document.createElement('span'), {
				innerText: '*',
				style: 'color: #eb5656'
			}));

			header.append(requiresRestartSpan);
		}

		/** On header click, toggle the section */
		header.onclick = () => {
			Settings.collapseFolder(header);
		};

		const body = document.createElement('div');
		body.classList.add('setBodH');
		body.id = `setBody_${ sectionData.id }`;

		for (const property of properties) body.append(this.createItemFrom(property));

		return [header, body];
	}

	/**
	 * Collapse a section by hiding its body
	 * 
	 * @param element The header element that was clicked
	 */
	private static collapseFolder(element: HTMLDivElement): void {
		// get the next sibling after element
		const next = element.nextElementSibling as HTMLDivElement | null;
		const arrow: HTMLSpanElement | null = element.querySelector('.material-icons.plusOrMinus');
		if (arrow && next && next.classList.contains('setBodH')) {
			if (next.style.display !== 'none') {
				arrow.innerText = 'keyboard_arrow_right';
				next.style.display = 'none';
			} else {
				arrow.innerText = 'keyboard_arrow_down';
				next.style.display = 'block';
			}
		}
	}

	/**
	 * @param property the property data
	 * @param property.title the title of the element
	 * @param property.type the type of the element
	 * @param property.inputNodeAttributes the attributes to apply to the input node
	 * @param property.options optional options for some of the element types
	 * @returns The newly created HTMLElement
	 */
	// eslint-disable-next-line complexity
	private createItemFrom(property: {
		title: string;
		type: 'checkbox' | 'slider' | 'select' | 'color' | 'text';
		inputNodeAttributes: InputNodeAttributes<Event | MouseEvent>;
		options?: Record<string, string>;
	}): HTMLElement {
		switch (property.type) {
			case 'checkbox':
				return this.createCheckbox(property.title, property.inputNodeAttributes);
			case 'slider':
				return this.createSlider(property.title, property.inputNodeAttributes);
			case 'select':
				return this.createSelect(property.title, property.inputNodeAttributes, property.options);
			case 'color':
				return this.createColor(property.title, property.inputNodeAttributes);
			case 'text':
				return this.createText(property.title, property.inputNodeAttributes);
			default:
				throw new Error('Unknown property type');
		}
	}

	/**
	 * Create a checkbox.
	 *
	 * @param title Wrapper title
	 * @param inputNodeAttributes Attributes to apply
	 * @param inputNodeAttributes.onclick Event handler
	 * @returns Wrapper
	 */
	private createCheckbox(title: string, inputNodeAttributes: InputNodeAttributes<MouseEvent>) {
		const label = document.createElement('label');
		label.classList.add('switch');

		const input = Object.assign(document.createElement('input'), inputNodeAttributes);
		input.type = 'checkbox';
		input.id = inputNodeAttributes.id;

		input.checked = this.getSetting(inputNodeAttributes.id) as boolean ?? inputNodeAttributes.checked ?? false;

		const span = document.createElement('span');
		span.classList.add('slider');

		label.append(input, span);

		return Settings.createWrapper(title, label);
	}

	/**
	 * Create a slider input.
	 *
	 * @param title Wrapper title
	 * @param inputNodeAttributes Attributes to apply
	 * @param inputNodeAttributes.oninput Event handler
	 * @returns Wrapper
	 */
	private createSlider(title: string, inputNodeAttributes: InputNodeAttributes<Event>) {
		const input = Object.assign(document.createElement('input'), inputNodeAttributes);
		input.style.borderWidth = '0px';
		input.classList.add('sliderVal');
		input.id = inputNodeAttributes.id;
		input.type = 'number';

		const div = document.createElement('div');
		div.classList.add('slidecontainer');

		const slider = Object.assign(document.createElement('input'), inputNodeAttributes);
		slider.classList.add('sliderM');
		slider.id = inputNodeAttributes.id;
		slider.type = 'range';

		slider.addEventListener('input', () => {
			input.value = slider.value;
		});
		input.addEventListener('input', () => {
			slider.value = input.value;
		});

		input.value = slider.value = this.getSetting(inputNodeAttributes.id) as string ?? inputNodeAttributes.value ?? '';

		div.append(slider);

		return Settings.createWrapper(title, div, input);
	}

	/**
	 * Create a select input.
	 *
	 * @param title Wrapper title
	 * @param inputNodeAttributes Attributes to apply
	 * @param inputNodeAttributes.oninput Event handler
	 * @param options Options to display
	 * @returns Wrapper
	 */
	private createSelect(title: string, inputNodeAttributes: InputNodeAttributes<Event>, options?: Record<string, string>) {
		const select = Object.assign(document.createElement('select'), inputNodeAttributes);
		select.classList.add('inputGrey2');

		if (options) {
			for (const [key, value] of Object.entries(options)) {
				const option = document.createElement('option');
				option.value = key;
				option.innerText = value;
				select.append(option);
			}
		}

		select.value = this.getSetting(inputNodeAttributes.id) as string ?? inputNodeAttributes.value ?? '';

		return Settings.createWrapper(title, select);
	}

	/**
	 * Create a color input.
	 *
	 * @param title Wrapper title
	 * @param inputNodeAttributes Attributes to apply
	 * @param inputNodeAttributes.oninput Event handler
	 * @returns Wrapper
	 */
	private createColor(title: string, inputNodeAttributes: InputNodeAttributes<Event>) {
		const input = Object.assign(document.createElement('input'), inputNodeAttributes);
		input.style.float = 'right';
		input.id = inputNodeAttributes.id;
		input.type = 'color';
		input.name = 'color';

		input.value = this.getSetting(inputNodeAttributes.id) as string ?? inputNodeAttributes.value ?? '';

		return Settings.createWrapper(title, input);
	}

	/**
	 * Create a text input.
	 *
	 * @param title Wrapper title
	 * @param inputNodeAttributes Attributes to apply
	 * @param inputNodeAttributes.oninput Event handler
	 * @returns Wrapper
	 */
	private createText(title: string, inputNodeAttributes: InputNodeAttributes<Event>) {
		const input = Object.assign(document.createElement('input'), inputNodeAttributes);
		input.classList.add('inputGrey2');
		input.id = inputNodeAttributes.id;
		input.type = 'text';
		input.name = 'text';

		input.value = this.getSetting(inputNodeAttributes.id) as string ?? inputNodeAttributes.value ?? '';

		return Settings.createWrapper(title, input);
	}

	/**
	 * Create an options wrapper with a title
	 * 
	 * @param title Wrapper title
	 * @param children Optional children to append to wrapper
	 * @returns Wrapper
	 */
	private static createWrapper(title: string, ...children: Node[]): HTMLElement {
		const wrapper = document.createElement('div');
		wrapper.classList.add('settName');
		wrapper.setAttribute('title', title);
		wrapper.innerText = title;

		if (children) wrapper.append(...children);

		return wrapper;
	}

}
