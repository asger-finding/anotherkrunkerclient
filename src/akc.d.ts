export {};

declare global {
	export interface Window {
		openSettings: () => null;
		exitClient: () => null;
	}
}

export interface ReleaseData {
	clientVersion: string;
	releaseVersion: string,
	releaseUrl: string | null
}
