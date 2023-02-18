import UserscriptParser from '@userscripts/gm-metadata';
import fetch from 'node-fetch';

/**
 *
 * 
 * @param require URL that's been required
 * @returns String result or void
 */
const handleRequire = (require: string) => new Promise<string>(resolve => {
	try {
		const url = new URL(require);
		if (!url.protocol.startsWith('http')) throw new Error('Bad @require protocol');
	} catch {
		console.log('Invalid require');
	}

	fetch(require)
		.then(buffer => buffer.text())
		.then(result => resolve(result))
		.catch(() => resolve(''));
});

/**
 *
 * @param rawUserscript
 */
const generateInjectCode = async(rawUserscript: string) => {
	const parsed = UserscriptParser.parse(rawUserscript);
	const { meta } = parsed;

	const required = await Promise.all(meta.require.map(require => handleRequire(require)));
	console.log(required);
};
