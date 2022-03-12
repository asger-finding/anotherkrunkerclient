export {};

declare global {
	export interface Window {
		openSettings: () => null;
		exitClient: () => null;
	}
}

export interface GitHubReleaseData {
	releaseVersion: string,
	releaseUrl: string | null
}
