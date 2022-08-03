import { InputNodeAttributes } from '@client';
import { resolve } from 'path';

type ShowWindow = (windowId: number) => void;

export default class Settings {

	itemElements: Node[] = [];

	nativeShowWindow: ShowWindow;

	/**
	 * @param DOMContentLoadedPromise A promise that will be resolved when the DOM is loaded
	 */
	static async init(DOMContentLoadedPromise: Promise<void>) {
		await DOMContentLoadedPromise;

		const interval = setInterval(() => {
			const instructions = document.getElementById('instructions');
			if (instructions) {
				this.observeInstructions(instructions as HTMLDivElement);
				clearInterval(interval);
			}
		}, 100);
	}

	/**
	 *
	 * @param instructions The krunker instructions element
	 */
	private static observeInstructions(instructions: HTMLDivElement) {
		new MutationObserver((_mutations, observer) => {
			observer.disconnect();

			const [settingsWindow] = window.windows;

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
						settingsHolder.append(...this.generateSettings());
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
										node.append(...this.generateSettings());
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
	 *
	 */
	static generateSettings(): HTMLElement[] {
		// Placeholder section
		const section1 = this.createSection({
			title: 'Client',
			id: 'client',
			requiresRestart: true
		}, {
			title: 'Auto-reload',
			type: 'checkbox',
			inputNodeAttributes: {
				oninput(evt) {
					console.log(evt);
				}
			}
		}, {
			title: 'Auto-reload delay',
			type: 'slider',
			inputNodeAttributes: {
				min: 0,
				max: 10,
				step: 1,
				value: 4,
				oninput(evt) {
					console.log(evt);
				}
			}
		}, {
			title: 'Auto-reload delay unit',
			type: 'select',
			inputNodeAttributes: {
				oninput(evt) {
					console.log(evt);
				}
			},
			options: {
				Seconds: 's',
				Minutes: 'm',
				Hours: 'h'
			}
		}, {
			title: 'Background color',
			type: 'color',
			inputNodeAttributes: {
				oninput(evt) {
					console.log(evt);
				}
			}
		}, {
			title: 'Background image',
			type: 'text',
			inputNodeAttributes: {
				oninput(evt) {
					console.log(evt);
				}
			}
		});

		return [...section1];
	}

	/**
	 * @param sectionData the section body data
	 * @param sectionData.title the section title
	 * @param sectionData.id the section id
	 * @param sectionData.requiresRestart whether the section requires a restart
	 * @param properties the section elements
	 * @returns The section header and body
	 */
	public static createSection(sectionData: {
		title: string;
		id: string;
		requiresRestart?: boolean;
	}, ...properties: {
		title: string;
		type: 'checkbox' | 'slider' | 'select' | 'color' | 'text';
		inputNodeAttributes: InputNodeAttributes<Event | MouseEvent>;
		options?: Record<string, string>
	}[]): HTMLElement[] {
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

		/**
		 * On header click, toggle the section
		 * 
		 * @returns void
		 */
		header.onclick = () => this.collapseFolder(header);

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
	public static createItemFrom(property: {
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
	public static createCheckbox(title: string, inputNodeAttributes: InputNodeAttributes<MouseEvent>) {
		const label = document.createElement('label');
		label.classList.add('switch');

		const input = Object.assign(document.createElement('input'), inputNodeAttributes);
		input.type = 'checkbox';

		const span = document.createElement('span');
		span.classList.add('slider');

		label.append(input, span);

		return this.createWrapper(title, label);
	}

	/**
	 * Create a slider input.
	 *
	 * @param title Wrapper title
	 * @param inputNodeAttributes Attributes to apply
	 * @param inputNodeAttributes.oninput Event handler
	 * @returns Wrapper
	 */
	public static createSlider(title: string, inputNodeAttributes: InputNodeAttributes<Event>) {
		const input = Object.assign(document.createElement('input'), inputNodeAttributes);
		input.style.borderWidth = '0px';
		input.classList.add('sliderVal');
		input.id = `slid_input_${ inputNodeAttributes.id }`;
		input.type = 'number';

		const div = document.createElement('div');
		div.classList.add('slidecontainer');

		const slider = Object.assign(document.createElement('input'), inputNodeAttributes);
		slider.classList.add('sliderM');
		slider.id = `slid_${ inputNodeAttributes.id }`;
		slider.type = 'range';

		slider.addEventListener('input', () => {
			input.value = slider.value;
		});
		input.addEventListener('input', () => {
			slider.value = input.value;
		});

		div.append(slider);

		return this.createWrapper(title, div, input);
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
	public static createSelect(title: string, inputNodeAttributes: InputNodeAttributes<Event>, options?: Record<string, string>) {
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

		return this.createWrapper(title, select);
	}

	/**
	 * Create a color input.
	 *
	 * @param title Wrapper title
	 * @param inputNodeAttributes Attributes to apply
	 * @param inputNodeAttributes.oninput Event handler
	 * @returns Wrapper
	 */
	public static createColor(title: string, inputNodeAttributes: InputNodeAttributes<Event>) {
		const input = Object.assign(document.createElement('input'), inputNodeAttributes);
		input.style.float = 'right';
		input.id = `slid_${ inputNodeAttributes.id }`;
		input.type = 'color';
		input.name = 'color';

		return this.createWrapper(title, input);
	}

	/**
	 * Create a text input.
	 *
	 * @param title Wrapper title
	 * @param inputNodeAttributes Attributes to apply
	 * @param inputNodeAttributes.oninput Event handler
	 * @returns Wrapper
	 */
	public static createText(title: string, inputNodeAttributes: InputNodeAttributes<Event>) {
		const input = Object.assign(document.createElement('input'), inputNodeAttributes);
		input.classList.add('inputGrey2');
		input.id = `slid_${ inputNodeAttributes.id }`;
		input.type = 'text';
		input.name = 'text';

		return this.createWrapper(title, input);
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
