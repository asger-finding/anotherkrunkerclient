import { Hexadecimal } from './krunker';

/**
 * Get the grayscale value of a given color using the specified algorithm.
 *
 * @param hex Hexadecimal color code in the format 0xdeafbeef or '#deafbeef'
 * @returns Grayscale hex color
 */
export const toGrayscale = (hex: Hexadecimal) => {
	if (typeof hex === 'string') {
		hex = hex.replace('#', '');
		hex = parseInt(hex, 16);
	}
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
