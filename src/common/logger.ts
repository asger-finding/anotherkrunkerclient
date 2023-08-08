/* eslint-disable no-console */
import { IS_DEVELOPMENT } from '@constants';

const separator = process.platform === 'win32' ? '>' : '›';

/**
 * Create a new timestamp string.
 * 
 * @returns Formatted timestring in the format of 'HH:MM:SS.mmm' 
 */
const newTimestamp = (): string => new Date().toISOString()
	.slice(11, -1);

const newlineSpacer = ' '.repeat(newTimestamp().length + separator.length + 2);

/**
 * Takes in log arguments, finds strings
 * and adds adequate spacing to newlines
 * to stay inline with the first line with
 * the timestamp.
 * 
 * @param args Arguments passed to log function
 * @returns Transformed argument list
 */
const transformArgs = (args: unknown[]): unknown[] => args.map(arg => (typeof arg === 'string'
	? arg.replaceAll('\n', `\n${ newlineSpacer }`)
	: arg));

/**
 * If in development, log a timestamped message to the console in blue.
 *
 * @param args The arguments to log
 */
export const info = (...args: unknown[]): void => {
	if (IS_DEVELOPMENT) console.log('\x1b[36m%s\x1b[0m', newTimestamp(), separator, ...transformArgs(args));
};

/**
 * If in development, log a timestamped message to the console in yellow.
 *
 * @param args The arguments to log
 */
export const warn = (...args: unknown[]): void => {
	if (IS_DEVELOPMENT) console.warn('\x1b[33m%s\x1b[0m', newTimestamp(), separator, ...transformArgs(args));
};

/**
 * If in development, log a timestamped message to the console in red.
 *
 * @param args The arguments to log
 */
export const error = (...args: unknown[]): void => {
	if (IS_DEVELOPMENT) console.error('\x1b[31m%s\x1b[0m', newTimestamp(), separator, ...transformArgs(args));
};
