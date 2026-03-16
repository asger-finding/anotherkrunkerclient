import { app } from 'electron';

/**
 * Generate a spoofed Chrome user agent string matching the current platform.
 * Uses the real Chromium version from Electron but strips the Electron identifier.
 */
export const getSpoofedUA = (): string => {
	const chromeVersion = process.versions.chrome;

	switch (process.platform) {
		case 'darwin':
			return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
		case 'win32':
			return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
		default:
			return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
	}
};
