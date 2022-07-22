import { InputNodeAttributes } from '@client';
import { promises as fs } from 'fs';

export default class Settings {

	wrapper: HTMLDivElement;

	/**
	 *
	 */
	constructor() {
		this.wrapper = document.createElement('div');
		this.wrapper.classList.add('settings');

		// Asynchronously load the settings styling and append it to the wrapper
		fs.readFile('../renderer/styles/settings.css', 'utf8').then(css => {
			const injectElement = document.createElement('style');
			injectElement.innerHTML = css;

			this.wrapper.appendChild(injectElement);
		});
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

		return Settings.createWrapper(title).append(label);
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

		return Settings.createWrapper(title).append(input, div);
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

		return Settings.createWrapper(title).append(select);
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

		return Settings.createWrapper(title).append(input);
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

		return Settings.createWrapper(title).append(input);
	}

	/**
	 * Create an options wrapper with a title
	 * 
	 * @param title Wrapper title
	 * @returns Wrapper
	 */
	private static createWrapper(title: string) {
		const wrapper = document.createElement('div');
		wrapper.classList.add('settName');
		wrapper.setAttribute('title', title);

		return wrapper;
	}

}
