export {};

declare global {
	export interface Window {
		openSettings: Function;
		exitClient: Function;
	}
}

export interface GitHubReleaseData {
	releaseVersion: string,
	releaseUrl: string | null
}
