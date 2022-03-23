export {};

declare global {
	export interface Window {
		OffCliV: boolean;
		openSettings: () => null;
		exitClient: () => null;
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
