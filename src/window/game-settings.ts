window.SettingsGenerator = {

	createCheckbox(onclick, inputNodeAttributes) {
		const label = document.createElement('label');
		label.classList.add('switch');

		const input = Object.assign(document.createElement('input'), inputNodeAttributes);
		input.type = 'checkbox';
		input.onclick = onclick;

		const span = document.createElement('span');
		span.classList.add('slider');

		label.append(input, span);

		return label;
	},

	createSlider(oninput, inputNodeAttributes) {
		const input = Object.assign(document.createElement('input'), inputNodeAttributes);
		input.style.borderWidth = '0px';
		input.classList.add('sliderVal');
		input.id = `c_slid_input_${ inputNodeAttributes.id}`;
		input.type = 'number';

		const div = document.createElement('div');
		div.classList.add('slidecontainer');

		const slider = Object.assign(document.createElement('input'), inputNodeAttributes);
		slider.classList.add('sliderM');
		slider.id = `c_slid_${ inputNodeAttributes.id}`;
		slider.type = 'range';
		slider.oninput = oninput;

		div.append(slider);

		return [input, div];
	},

	createSelect(onchange, inputNodeAttributes, options) {
		const select = Object.assign(document.createElement('select'), inputNodeAttributes);
		select.classList.add('inputGrey2');
		select.onchange = onchange;

		for (const [key, value] of Object.entries(options)) {
			const option = document.createElement('option');
			option.value = key;
			option.innerText = value;
			select.append(option);
		}

		return select;
	},

	createColor(onchange, inputNodeAttributes) {
		const input = Object.assign(document.createElement('input'), inputNodeAttributes);
		input.style.float = 'right';
		input.id = `slid_${ inputNodeAttributes.id}`;
		input.type = 'color';
		input.name = 'color';
		input.onchange = onchange;

		return input;
	},

	createText(oninput, inputNodeAttributes) {
		const input = Object.assign(document.createElement('input'), inputNodeAttributes);
		input.classList.add('inputGrey2');
		input.id = `slid_${ inputNodeAttributes.id}`;
		input.type = 'text';
		input.name = 'text';
		input.placeholder = inputNodeAttributes.placeholder ?? '';
		input.oninput = oninput;

		return input;
	}

};
