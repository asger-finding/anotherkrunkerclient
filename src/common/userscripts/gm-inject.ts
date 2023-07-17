import MetadataParser from '@userscripts/gm-metadata-parser';
import fetch from 'node-fetch-commonjs';

/**
 * Create a pseudo-random string
 * 
 * 
 * @param length Length of string
 * @returns Random string of length N
 */
const getRandomString = (length = 10) => {
	for (let random = ''; (random += Math.random().toString(36)
		.slice(2));) if (random.length >= length) return random.slice(0, length);
};

/**
 * Generate a new unique Id with a prefix
 * 
 * @param prefix What to prefix the Id with
 * @returns Pseudo-random id
 */
const getUniqueId = (prefix = 'VM') => prefix + getRandomString();

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
 * @param rawUserscript Userscript passed as a string to parse and execute
 */
const generateInjectCode = async(rawUserscript: string) => {
	const parsed = MetadataParser.parse(rawUserscript);
	const { meta } = parsed;

	const required = await Promise.all(meta.require.map(require => handleRequire(require)))
		.then(requires => requires.map(code => (/\n(?:(?!\n)\s)*$/u.test(code) ? `${ code };` : `${ code };\n`)));
	const windowKey = getUniqueId();
	const dataKey = getUniqueId();
	const generated = `
	window.${ windowKey } = function ${ dataKey }(${ meta.grant ? 'GM' : '{ GM, GM_info, unsafeWindow, cloneInto, createObjectIn, exportFunction }'}) {
		${ meta.grant ? 'with (this) with (c) delete (c),' : '' }
		((define, module, exports) => {
			${ required }
			${ required.length ? '(() => {' : '' }
				${ rawUserscript }
			${ required.length ? '})()' : '' } 
		})()
	}`;

	console.log(generated);
};

generateInjectCode(`// ==UserScript==
// @name        TankTrouble Keystrokes
// @author      Commander
// @description Key overlay for TankTrouble game inputs
// @version     0.0.1
// @namespace   https://github.com/asger-finding
// @license     GPL-3.0
// @match       https://*.tanktrouble.com/*
// @desc        Show input keys
// @run-at      document-end
// @resource    resourceName1 https://i.imgur.com/fHyEMsl.jpg
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @require     https://pastebin.com/raw/3YT72G2c
// @require     https://pastebin.com/raw/CkrJ2ZZb
// ==/UserScript==

/* jshint esversion: 8 */

console.log('aaaaaa, aaa', GM_getResourceText('resourceName1'))
`);
