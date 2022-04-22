interface SettingsGenerator {
	createCheckbox(onclick: (this: GlobalEventHandlers, evt: Event) => unknown, inputNodeAttributes: Partial<HTMLInputElement>): HTMLLabelElement;
	createSlider(oninput: (this: GlobalEventHandlers, evt: Event) => unknown, inputNodeAttributes: Partial<HTMLInputElement>): [ HTMLInputElement, HTMLDivElement ];
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

export interface EventListener {
	id: number;
	message: string;
	callback: () => unknown;
}

export interface ReleaseData {
	clientVersion: string;
	releaseVersion: string,
	releaseUrl: string;
}

export interface WindowData {
	url: string | undefined,
	tab: string | null,
	isInTabs: boolean,
	isKrunker: boolean,
	quickJoin: boolean,
	invalid: boolean
}
