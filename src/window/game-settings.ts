import { InputNodeAttributes } from '@client';
import { resolve } from 'path';

type ShowWindow = (windowId: number) => void;

export default class Settings {

	wrapper: HTMLDivElement;

	nativeShowWindow: ShowWindow;

	/**
	 * @param DOMContentLoadedPromise A promise that will be resolved when the DOM is loaded
	 */
	async initMainWindow(DOMContentLoadedPromise: Promise<void>) {
		await DOMContentLoadedPromise;

		const interval = setInterval(() => {
			const instructions = document.getElementById('instructions');
			if (instructions) {
				Settings.observeInstructions(instructions as HTMLDivElement);
				clearInterval(interval);
			}
		}, 100);
	}

	/**
	 *
	 * @param instructions
	 */
	private static observeInstructions(instructions: HTMLDivElement) {
		new MutationObserver((_mutations, observer) => {
			observer.disconnect();

			const [settingsWindow] = window.windows;

			if (settingsWindow.label !== 'settings') throw new Error('Wrong Game Settings index');

			const getSettingsHook = settingsWindow.getSettings;
			const getTabsHook = settingsWindow.getTabs;

			// Compensate for user agent spoofing
			const isElectron = navigator.userAgent.includes('Electron');
			let tabsLength = -1;

			/**
			 *
			 * @param args the native function arguments
			 * @returns The html for the settings tabs
			 */
			settingsWindow.getTabs = (...args: unknown[]) => {
				const result: string = getTabsHook.apply(settingsWindow, args);

				tabsLength = ((result.match(/<\/div>/gu) ?? []).length);
				const isPicked = settingsWindow.tabIndex === tabsLength;

				const clientTab = Object.assign(document.createElement('div'), {
					innerText: 'Client',
					style: 'border-bottom: 5px solid transparent;'
				});
				const attributes = {
					class: `settingTab ${isPicked ? 'tabANew' : ''}`,
					onmouseenter: 'playTick()',
					onclick: `playSelect(0.1);window.windows[0].changeTab(${ tabsLength })`
				};
				for (const [key, value] of Object.entries(attributes)) clientTab.setAttribute(key, value);

				return result + (!isElectron ? clientTab.outerHTML : '');
			};

			/**
			 *
			 * @param args the native function arguments
			 * @returns The html for the settings body
			 */
			settingsWindow.getSettings = (...args: unknown[]) => {
				const result: string = getSettingsHook.apply(settingsWindow, args);
				const isClientTab = settingsWindow.tabIndex === tabsLength;

				if (isClientTab) {
					const menuWindow = document.getElementById('menuWindow');
					if (menuWindow) menuWindow.scrollTop = 0;

					const styles = `<style>
						#settHolder webview {
							/* The header is 131px css in css. Window height is 100vh - 250px. */
							height: calc(100vh - 250px - 131px);
						}
						#menuWindow {
							overflow: hidden !important;
						}
					</style>`;
					const webviewTag = document.createElement('webview');
					webviewTag.src = `file://${ resolve(__dirname, '../renderer/html/settings.html') }`;

					// The preload script will already be transpiled to javascript
					webviewTag.preload = `file://${ resolve(__dirname, './settings-preload.js') }`;
					webviewTag.nodeintegrationinsubframes = true;

					return styles + webviewTag.outerHTML;
				}
				return result;
			};
		}).observe(instructions, { childList: true });
	}

	/**
	 *
	 */
	initSettingsWindow() {
		this.wrapper = Object.assign(document.createElement('div'), { id: 'settHolder' });

		// Placeholder section
		this.createSection({
			title: 'Client',
			id: 'client',
			requiresRestart: 'requires client restart'
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
				value: 0,
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
	}

	// eslint-disable-next-line complexity
	/**
	 * @param sectionData the section body data
	 * @param sectionData.title the section title
	 * @param sectionData.id the section id
	 * @param sectionData.requiresRestart whether the section requires a restart
	 * @param properties the section elements
	 */
	public createSection(sectionData: {
		title: string;
		id: string;
		requiresRestart?: 'requires restart' | 'requires client restart';
	}, ...properties: {
		title: string;
		type: 'checkbox' | 'slider' | 'select' | 'color' | 'text';
		inputNodeAttributes: InputNodeAttributes<Event | MouseEvent>;
		options?: Record<string, string>
	}[]) {
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
			requiresRestartSpan.classList.add('requiresRestart');

			requiresRestartSpan.innerText = ` ${ sectionData.requiresRestart }`;
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
		header.onclick = () => Settings.collapseFolder(header);

		const body = document.createElement('div');
		body.classList.add('setBodH');
		body.id = `setBody_${ sectionData.id }`;

		for (const property of properties) body.append(Settings.createItemFrom(property));

		this.wrapper.append(header, body);
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
	public static createSlider(title: string, inputNodeAttributes: InputNodeAttributes<Event>) {
		const input = Object.assign(document.createElement('input'), inputNodeAttributes);
		input.style.borderWidth = '0px';
		input.classList.add('sliderVal');
		input.id = `c_slid_input_${ inputNodeAttributes.id }`;
		input.type = 'number';

		const div = document.createElement('div');
		div.classList.add('slidecontainer');

		const slider = Object.assign(document.createElement('input'), inputNodeAttributes);
		slider.classList.add('sliderM');
		slider.id = `c_slid_${ inputNodeAttributes.id }`;
		slider.type = 'range';

		div.append(slider);

		slider.addEventListener('input', () => {
			input.value = slider.value;
		});
		input.addEventListener('input', () => {
			slider.value = input.value;
		});

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
	public static createColor(title: string, inputNodeAttributes: InputNodeAttributes<Event>) {
		const input = Object.assign(document.createElement('input'), inputNodeAttributes);
		input.style.float = 'right';
		input.id = `slid_${ inputNodeAttributes.id }`;
		input.type = 'color';
		input.name = 'color';

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
	public static createText(title: string, inputNodeAttributes: InputNodeAttributes<Event>) {
		const input = Object.assign(document.createElement('input'), inputNodeAttributes);
		input.classList.add('inputGrey2');
		input.id = `slid_${ inputNodeAttributes.id }`;
		input.type = 'text';
		input.name = 'text';

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
