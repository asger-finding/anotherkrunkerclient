import { type InputNodeAttributes } from '@typings/client';
import { type KrunkerWindow } from '@typings/krunker';
import SettingsBackend from '@settings-backend';

enum Frames {
	MAINFRAME,
	SUBFRAME
}

type SettingTypes = 'checkbox' | 'slider' | 'select' | 'color' | 'text' | 'button';
type InputTypeToElement<T extends string> =
	T extends 'checkbox' | 'slider' | 'select' | 'color' | 'text' ? HTMLInputElement :
		T extends 'button' ? HTMLDivElement :
			never;

export default class GameSettings extends SettingsBackend {

	itemElements: HTMLElement[] = [];

	/**
	 * Construct the 
	 * 
	 * @param DOMContentLoadedPromise A promise that will be resolved when the DOM is loaded
	 */
	constructor(DOMContentLoadedPromise: Promise<void> = Promise.resolve()) {
		super();

		if (process.isMainFrame) this.mainFrameInit(DOMContentLoadedPromise);
	}

	/**
	 * Initialize the store for the main frame.
	 * 
	 * @param DOMContentLoadedPromise A promise that will be resolved when the DOM is loaded
	 */
	private async mainFrameInit(DOMContentLoadedPromise: Promise<void>) {
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
	 * Check if the frame aligns to what is expected. Else, throw an error.
	 * 
	 * @param expected If process.isMainFrame should return false.
	 * @returns True if it hasn't thrown an error
	 */
	private static expectFrame(expected: Frames): boolean {
		if (process.isMainFrame && Frames.SUBFRAME === expected) throw new Error('Saw main frame and expected sub frame');
		else if (!process.isMainFrame && Frames.MAINFRAME === expected) throw new Error('Saw sub frame and expected main frame');

		return true;
	}

	/**
	 *
	 * @param instructions The krunker instructions element
	 */
	private observeInstructions(instructions: HTMLDivElement) {
		GameSettings.expectFrame(Frames.MAINFRAME);

		new MutationObserver((_mutations, observer) => {
			observer.disconnect();

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
		type: SettingTypes;
		inputNodeAttributes: InputNodeAttributes<InputTypeToElement<SettingTypes>>;
		options?: Record<string, string>
	}[]): [header: HTMLDivElement, body: HTMLDivElement] {
		GameSettings.expectFrame(Frames.MAINFRAME);

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
			GameSettings.collapseFolder(header);
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
		type: SettingTypes;
		inputNodeAttributes: InputNodeAttributes<InputTypeToElement<SettingTypes>>;
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
			case 'button':
				return this.createButton(property.title, property.inputNodeAttributes);
			default:
				throw new TypeError('Unknown property type');
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
	private createCheckbox(title: string, inputNodeAttributes: InputNodeAttributes<HTMLInputElement>) {
		const label = document.createElement('label');
		label.classList.add('switch');

		const input = Object.assign(document.createElement('input'), inputNodeAttributes);
		input.type = 'checkbox';
		input.id = inputNodeAttributes.id;

		input.checked = this.getSetting(inputNodeAttributes.id, inputNodeAttributes.checked ?? false) as boolean;

		const span = document.createElement('span');
		span.classList.add('slider');

		label.append(input, span);

		return GameSettings.createWrapper(title, label);
	}

	/**
	 * Create a slider input.
	 *
	 * @param title Wrapper title
	 * @param inputNodeAttributes Attributes to apply
	 * @param inputNodeAttributes.oninput Event handler
	 * @returns Wrapper
	 */
	private createSlider(title: string, inputNodeAttributes: InputNodeAttributes<HTMLInputElement>) {
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

		input.value = slider.value = this.getSetting(inputNodeAttributes.id, inputNodeAttributes.value ?? '') as string;

		div.append(slider);

		return GameSettings.createWrapper(title, div, input);
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
	private createSelect(title: string, inputNodeAttributes: InputNodeAttributes<HTMLInputElement>, options?: Record<string, string>) {
		const select = Object.assign(document.createElement('select'), inputNodeAttributes);
		select.classList.add('inputGrey2');

		let fallbackValue = '';
		if (options) {
			for (const [key, value] of Object.entries(options)) {
				const option = document.createElement('option');
				option.value = key;
				option.innerText = value;
				select.append(option);

				if (!fallbackValue) fallbackValue = key;
			}
		}

		select.value = this.getSetting(inputNodeAttributes.id, inputNodeAttributes.value ?? fallbackValue) as string;

		return GameSettings.createWrapper(title, select);
	}

	/**
	 * Create a color input.
	 *
	 * @param title Wrapper title
	 * @param inputNodeAttributes Attributes to apply
	 * @param inputNodeAttributes.oninput Event handler
	 * @returns Wrapper
	 */
	private createColor(title: string, inputNodeAttributes: InputNodeAttributes<HTMLInputElement>) {
		const input = Object.assign(document.createElement('input'), inputNodeAttributes);
		input.style.float = 'right';
		input.id = inputNodeAttributes.id;
		input.type = 'color';
		input.name = 'color';

		input.value = this.getSetting(inputNodeAttributes.id, inputNodeAttributes.value ?? '#0a0b0c') as string;

		return GameSettings.createWrapper(title, input);
	}

	/**
	 * Create a text input.
	 *
	 * @param title Wrapper title
	 * @param inputNodeAttributes Attributes to apply
	 * @param inputNodeAttributes.oninput Event handler
	 * @returns Wrapper
	 */
	private createText(title: string, inputNodeAttributes: InputNodeAttributes<HTMLInputElement>) {
		const input = Object.assign(document.createElement('input'), inputNodeAttributes);
		input.classList.add('inputGrey2');
		input.id = inputNodeAttributes.id;
		input.type = 'text';
		input.name = 'text';

		input.value = this.getSetting(inputNodeAttributes.id, inputNodeAttributes.value ?? '') as string;

		return GameSettings.createWrapper(title, input);
	}

	/**
	 * Create a button input.
	 *
	 * @param title Wrapper title
	 * @param inputNodeAttributes Attributes to apply
	 * @param inputNodeAttributes.oninput Event handler
	 * @returns Wrapper
	 */
	// eslint-disable-next-line class-methods-use-this
	private createButton(title: string, inputNodeAttributes: InputNodeAttributes<HTMLDivElement>) {
		const button = Object.assign(document.createElement('div'), inputNodeAttributes);
		button.classList.add('settingsBtn');
		button.id = inputNodeAttributes.id;

		return GameSettings.createWrapper(title, button);
	}

	/**
	 * Create an options wrapper with a title.
	 * 
	 * @param title Wrapper title
	 * @param children Optional children to append to wrapper
	 * @returns Wrapper
	 */
	public static createWrapper(title: string, ...children: Node[]): HTMLElement {
		const wrapper = document.createElement('div');
		wrapper.classList.add('settName');
		wrapper.setAttribute('title', title);
		wrapper.innerText = title;

		if (children) wrapper.append(...children);

		return wrapper;
	}

}
