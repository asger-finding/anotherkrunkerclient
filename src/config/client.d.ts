export type EventHandler<T extends Event> = (event: T) => void;

export type InputNodeAttributes<Target extends Event> = { [key: string]: unknown } & {
	oninput: EventHandler<Target>;
};

export type Callback = (...args: never[]) => unknown;

export type AsyncReturnType<Target extends (...args: unknown[]) => Promise<unknown>> = Awaited<ReturnType<Target>>;

declare global {
	namespace NodeJS {
		interface Global {
			resourceswapProtocolSource: string;
		}
	}
	export interface Window {
		OffCliV: boolean;
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

interface GitHubResponse {
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

export type SimplifiedTwitchMessage = {
	username: string;
	message: string;
	color?: string;
};

export interface PartialGPU {
	gpuDevice: Array<{
		active: boolean;
		vendorId: number;
		deviceId: number;
	}>;
}

export type Flags = Array<[string] | [string, string]>;
