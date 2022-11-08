/* eslint-disable no-console */
import { IS_DEVELOPMENT } from '@constants';

const separator = process.platform === 'win32' ? '>' : '›';

/**
 * Create a new timestamp string.
 * 
 * @returns Formatted timestring in the format of 'HH:MM:SS.mmm' 
 */
function newTimestamp(): string {
	// Return date formatted as HH:MM:SS.mmm
	const date = new Date();
	const HH = (`${ date.getHours() }`).padStart(2, '0');
	const MM = (`${ date.getMinutes() }`).padStart(2, '0');
	const SS = (`${ date.getSeconds() }`).padStart(2, '0');
	const mmm = (`${ date.getMilliseconds() }`).padStart(3, '0');

	return `${ HH }:${ MM }:${ SS }.${ mmm }`;
}

/**
 * If in development, log a timestamped message to the console in blue.
 *
 * @param args The arguments to log
 */
export function info(...args: unknown[]): void {
	if (IS_DEVELOPMENT) console.log('\x1b[36m%s\x1b[0m', newTimestamp(), separator, ...args);
}

/**
 * If in development, log a timestamped message to the console in yellow.
 *
 * @param args The arguments to log
 */
export function warn(...args: unknown[]): void {
	if (IS_DEVELOPMENT) console.warn('\x1b[33m%s\x1b[0m', newTimestamp(), separator, ...args);
}

/**
 * If in development, log a timestamped message to the console in red.
 *
 * @param args The arguments to log
 */
export function error(...args: unknown[]): void {
	if (IS_DEVELOPMENT) console.error('\x1b[31m%s\x1b[0m', newTimestamp(), separator, ...args);
}
