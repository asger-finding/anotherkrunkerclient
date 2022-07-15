interface SettingsGenerator {
	createCheckbox(onclick: (this: GlobalEventHandlers, evt: Event) => unknown, inputNodeAttributes: Partial<HTMLInputElement>): HTMLLabelElement;
	createSlider(oninput: (this: GlobalEventHandlers, evt: Event) => unknown, inputNodeAttributes: Partial<HTMLInputElement>): [HTMLInputElement, HTMLDivElement];
	createSelect(onchange: (this: GlobalEventHandlers, evt: Event) => unknown, inputNodeAttributes: Partial<HTMLSelectElement>, options: { [key: string]: string }): HTMLSelectElement;
	createColor(onchange: (this: GlobalEventHandlers, evt: Event) => unknown, inputNodeAttributes: Partial<HTMLInputElement>): HTMLInputElement;
	createText(oninput: (this: GlobalEventHandlers, evt: Event) => unknown, inputNodeAttributes: Partial<HTMLInputElement>): HTMLInputElement;
}

declare global {
	namespace NodeJS {
		interface Global {
			resourceswapProtocolSource: string;
		}
	}
	export interface Window {
		OffCliV: boolean;
		SettingsGenerator: SettingsGenerator;
		clientAPI: {
			clientName: string;

			send(channel: string, data: unknown[]): void;
			receive(channel: string, ...callback: ((data: unknown) => void)[]): boolean | void;
			requestFromStore(key: string, fallback: unknown): unknown | void;
			setToStore(key: string, value: unknown): void;
			storeHas(key: string): unknown | null;
		};
		openSettings: () => null;
		closeClient: () => null;
	}
}

export type Callback = (...args: never[]) => unknown;

interface GitHubResponse extends Response {
	data?: {
		tag_name: string;
		html_url: string;
	}
}

export interface ReleaseData {
	clientVersion: string;
	releaseVersion: string,
	releaseUrl: string;
}

export interface WindowData {
	url: string | undefined,
	tab?: string,
	isInTabs: boolean,
	isKrunker: boolean,
	quickJoin: boolean,
	invalid: boolean
}

export interface WindowSaveData {
	x: number;
	y: number;
	width: number;
	height: number;
	maximized: boolean;
	fullscreen: boolean;
}

export type DefaultConstructorOptions = Electron.BrowserWindowConstructorOptions & WindowSaveData;

interface BrowserWindowCalls extends Record<keyof Electron.BrowserWindowConstructorOptions, keyof Electron.BrowserWindow> {
	width: 'setSize',
	height: 'setSize',
	x: 'setPosition',
	y: 'setPosition',
	show: 'show',
	title: 'setTitle',
	resizable: 'setResizable',
	alwaysOnTop: 'setAlwaysOnTop',
	fullscreen: 'setFullScreen',
	fullscreenable: 'setFullScreenable',
	simpleFullscreen: 'setSimpleFullScreen',
	skipTaskbar: 'setSkipTaskbar',
	kiosk: 'setKiosk',
	maximizable: 'setMaximizable',
	minimizable: 'setMinimizable',
	maxWidth: 'setMaximumSize',
	maxHeight: 'setMaximumSize',
	minWidth: 'setMinimumSize',
	minHeight: 'setMinimumSize',
	movable: 'setMovable',
}
