import { Color, Hexadecimal } from '@krunker';

/**
 * Get the grayscale value of a given color using the specified algorithm.
 *
 * @param value Hexadecimal color code in the format 0xdeafbeef or '#deafbeef'
 * @returns Grayscale hex color
 */
export const toGrayscale = (value: Hexadecimal) => {
	const hex = typeof value === 'number' ? value : parseInt(value.replace('#', ''), 16);

	const red = (hex & 0xff0000) >> 16;
	const green = (hex & 0x00ff00) >> 8;
	const blue = hex & 0x0000ff;

	/**
	 * See also: https://yerl.org/Bovtz837bqCwrZOAN3g1pt
	 * Average:        (red + green + blue) / 3
	 * Luma (BT.601):  (red * 0.299) + (green * 0.587) + (blue * 0.114)
	 * Luma (BT.709):  (red * 0.2126) + (green * 0.7152) + (blue * 0.0722)
	 * Luma (BT.2100): (red * 0.2627) + (green * 0.6780) + (blue * 0.0593)
	 * Lightness:      (Math.max(red, green, blue) + Math.min(red, green, blue)) / 2
	 * Max. Decomp.:   Math.max(red, green, blue)
	 * Min. Decomp.:   Math.min(red, green, blue)
	 */
	// TODO: Support multiple algorithms via parameter or settings.
	const gray = (Math.max(red, green, blue) + Math.min(red, green, blue)) / 2;

	// Merge the grayscale value into a hex value and round to the nearest integer.
	return (gray << 16) + (gray << 8) + (gray << 0);
};


/**
 * Generator function that iterates over the color of the rainbow.
 * 
 * @param frequency Sine wave width
 * @param startIndex Start index on the rainbow
 * @param multiplier Color multiplier
 * @yields RGB values
 */
export function* rainbow(frequency: number, startIndex: number, multiplier: number): IterableIterator<Color> {
	let index = 0 + startIndex;
	let red = 1;
	let green = 0;
	let blue = 0;

	while (true) {
		red = Math.sin((frequency * index) + 0);
		green = Math.sin((frequency * index) + 2);
		blue = Math.sin((frequency * index) + 4);

		index++;

		yield [red * multiplier, green * multiplier, blue * multiplier];
	}
}


/**
 * Convert a hex color value to an rgb array.
 * 
 * @param hexCodes Hex input(s)
 * @param maxValue The max value to represent color brightness; 1-255.
 * @returns [r, g, b] array or fallback
 */
export const hexToRGB = (maxValue: number, ...hexCodes: string[]): Array<Color> => {
	const result: Array<Color> = [];
	for (const hex of hexCodes) {
		const regexResult = hex.padEnd(7, '#')
			.match(/^#?(?<red>[\da-f]{2})(?<green>[\da-f]{2})(?<blue>[\da-f]{2})$/iu);

		const divider = 255 / maxValue;
		if (regexResult) {
			const { red, green, blue } = regexResult.groups as {
				red: string;
				green: string;
				blue: string;
			};
			result.push([
				parseInt(red, 16) / divider,
				parseInt(green, 16) / divider,
				parseInt(blue, 16) / divider
			]);
		}

		// Dark fallback colour
		result.push([
			10 / divider,
			12 / divider,
			14 / divider
		]);
	}

	return result;
};
