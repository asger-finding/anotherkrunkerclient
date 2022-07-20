import { Callback } from '@client';

export default class FunctionHook {

	/** Map indexing the function paths and their callbacks */
	private functionMap: Record<string, Callback> = Object.create(null);

	/** Native, unmodified appendChild function instance */
	private static nativeAppendChild = HTMLBodyElement.prototype.appendChild;

	/** Check if FunctionHook exists in the window context. */
	constructor() {
		// Check that no other instance is running on the same window by seeing if appendChild is native.
		if (!/\{ \[native code\] \}$/u.test(FunctionHook.nativeAppendChild.toString())) throw new SyntaxError('FunctionHook already exists in this context.');

		// Proxy the appendChild function to the primary window context.
		FunctionHook.proxyAppend(window, this.functionMap);
	}

	/**
	 * Override HTMLBodyElement.prototype.appendChild and hook it.  
	 * Upon appending an iframe, it will get a new context, where we will instantly set our hooks.
	 *
	 * @param windowContext - The window context to proxy the appendChild function to.
	 * @param functionMap - The map of functions to proxy in the iframe contentWindow.
	 */
	private static proxyAppend(windowContext: typeof window, functionMap: FunctionHook['functionMap']): void {
		Reflect.defineProperty(windowContext.HTMLBodyElement.prototype, 'appendChild', {
			value: <typeof FunctionHook.nativeAppendChild> function(this: unknown, node) {
				FunctionHook.nativeAppendChild.call(this, node);

				if (FunctionHook.isNodeRelevantIFrame(node)) {
					const iWindow = (<HTMLIFrameElement> <unknown>node);
					const { contentWindow } = iWindow;

					if (contentWindow) FunctionHook.defineAllProperties(contentWindow.window, functionMap);
				}
			}
		});
	}

	/**
	 * Take a function path and get its location relative to the provided windowContext and get it as a property.  
	 * Ensure it's a function and then hook the callback onto it.
	 *
	 * @param functionPath - The path to the function to define a property on.
	 * @param callback - The callback to execute after the native function is applied.
	 * @param windowContext - The window context to proxy the functionPath to.
	 */
	private static hookProperty(functionPath: string, callback: Callback, windowContext?: Window): void {
		// Pull the item from the path relative to the windowContext.
		const { itemWrapper, lastPart, nativeFunction } = FunctionHook.getItemFromPath(functionPath, windowContext);

		if (typeof nativeFunction === 'function') {
			Reflect.defineProperty(itemWrapper, lastPart, {
				value(...args: unknown[]) {
					return callback(nativeFunction.apply(this, args) as never);
				}
			});
		}
	}

	/**
	 * Get all entries in the function map, iterate over and hook them
	 *
	 * @param windowContext - The window context to proxy the entries to.
	 * @param functionMap - The map of functions to proxy.
	 */
	private static defineAllProperties(windowContext: typeof window, functionMap: FunctionHook['functionMap']): void {
		for (const [functionPath, callback] of Object.entries(functionMap)) FunctionHook.hookProperty(functionPath, callback, windowContext);
	}

	/**
	 * @param functionPath - The path to the function.
	 * @param windowContext - The window context to get the function from.
	 * @returns Necessary information to hook a property.
	 */
	private static getItemFromPath(functionPath: string, windowContext?: Window): {
		lastPart: string;
		itemWrapper: object;
		nativeFunction: typeof itemWrapper;
	} {
		const destructured = functionPath.split('.');
		const lastPart = destructured.pop() ?? '';
		const itemWrapper = destructured.reduce((target, key) => target[key as keyof typeof target], (windowContext ?? window as object));
		const nativeFunction = itemWrapper[lastPart as keyof typeof itemWrapper];

		return { itemWrapper, lastPart, nativeFunction };
	}

	/**
	 * Perform some checks on a node so we can determine if it's an iframe that we want to hook.
	 *
	 * @param node - The node to check.
	 * @returns Whether the node is a relevant iframe
	 */
	private static isNodeRelevantIFrame(node: Node): boolean {
		if (node instanceof HTMLIFrameElement && !node.src && node.contentWindow) return true;
		return false;
	}

	/**
	 * Hook a function in the main window context and in all iframes.
	 *
	 * @param functionPath - The path to the function.
	 * @param callback - The callback to execute after the native function is applied.
	 */
	public hook(functionPath: string, callback: Callback): void {
		this.functionMap[functionPath] = callback;

		FunctionHook.hookProperty(functionPath, callback);
	}

}
