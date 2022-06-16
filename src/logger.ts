/* eslint-disable no-console */
import { IS_DEVELOPMENT } from '@constants';

function newTimestamp(): string {
	// Return date formatted as HH:MM:SS.mmm
	const date = new Date();
	const HH = (`${ date.getHours() }`).padStart(2, '0');
	const MM = (`${ date.getMinutes() }`).padStart(2, '0');
	const SS = (`${ date.getSeconds() }`).padStart(2, '0');
	const mmm = (`${ date.getMilliseconds() }`).padStart(3, '0');

	return `${ HH }:${ MM }:${ SS }.${ mmm }`;
}

export function info(...args: unknown[]): void {
	if (IS_DEVELOPMENT) console.log('\x1b[36m%s\x1b[0m', newTimestamp(), '›', ...args);
}

export function warn(...args: unknown[]): void {
	if (IS_DEVELOPMENT) console.log('\x1b[33m%s\x1b[0m', newTimestamp(), '›', ...args);
}

export function error(...args: unknown[]): void {
	if (IS_DEVELOPMENT) console.log('\x1b[31m%s\x1b[0m', newTimestamp(), '›', ...args);
}
