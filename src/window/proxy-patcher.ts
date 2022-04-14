/** Addresses https://stackoverflow.com/a/44854201/11452298 and https://stackoverflow.com/a/28121768/11452298 */

/**
 * Known problems:
 * * Detectable with Error.prototype.stack
 */

const dictionary: Record<string, string> = {};

Function.prototype.toString.call = new Proxy(Function.prototype.toString.call, {
	apply(target, thisArg, args) {
		const [func] = args;
		const result = func.toString();

		// If we have it in our proxy dictionary, return the toString() result as a native function.
		if (Object.values(dictionary).includes(result)) return result;

		// Call the original function and return the result.
		return target.call(thisArg, func);
	}
});

/**
 * @param {string} path Path to the proxy relative to window.
 * @returns {string} Native function toString() message.
 */
function generateNativeMessage(path: string): { nativeMessage: string, funcName: string } {
	const split = path.split('.');
	return {
		nativeMessage: `function ${split[split.length - 1]}() { [native code] }`,
		funcName: split[split.length - 1]
	}
}

/**
 * @param {string} path Path to the proxy relative to window.
 * @description Add proxy to the dictionary.  
 * Bind a native toString() description to the proxy and delete prototype access.
 */
module.exports.addProxy = function(path: string): void {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const func = path.split('.').reduce((prev, current) => prev[current] || null, window as any);
	const { nativeMessage, funcName } = generateNativeMessage(path);

	if (typeof func === 'function') {
		// Make func.toString() return native code.
		Object.defineProperty(func, 'toString', {
			value: String.bind(null, nativeMessage),
			configurable: true
		});
		Object.defineProperty(func, 'name', {
			value: funcName,
			configurable: true
		});

		dictionary[path] = nativeMessage;
	}
};

/**
 * @param {string[]} paths Array of paths to the proxies relative to window.
 * @description Patch multiple proxies to avoid detection by Krunker.
 */
module.exports.addProxies = function (paths: string[]): void {
	paths.push('Function.prototype.toString.call');
	for (const path of paths) if (!dictionary[path]) module.exports.addProxy(path);
};
