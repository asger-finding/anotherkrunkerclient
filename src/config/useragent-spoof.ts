import { info } from 'electron-log';
import { preferences } from '@constants';

/**
 * @returns {string} The operating system as it would appear in a user agent string
 * @description Get the current operating system and return it in a format matching a UA.
 */
function getCurrentUAOS(): string {
	switch (process.platform) {
		default:
		case 'win32':
			return 'Win';
		case 'darwin':
			return 'Mac';
		case 'linux':
			return 'Linux';
	}
}

/**
 * @returns {Promise<(string | null)>} The spoofed user agent string or null if no spoofed user agent is found
 * @description Get a spoofed user agent from the top-user-agents package corresponding to the user operating system.
 */
export async function getSpoofedUA(): Promise<(string | null)> {
	// Check for a cached spoofed UA.
	const currentUA = preferences.get('spoofedUserAgent', null);

	// If there is no cached UA, generate a new one and cache it.
	if (!currentUA) {
		info('Generating a new spoofed user agent');

		// eslint-disable-next-line global-require
		const UserAgents = await require('top-user-agents');
		const currentOS = getCurrentUAOS();

		if (Array.isArray(UserAgents)) {
			let [bestUserAgent] = UserAgents;

			// Loop through the user agents and find the top scoring one for the current OS.
			for (const userAgent of UserAgents) {
				if (userAgent.includes(currentOS)) {
					// Found the top scoring UA.
					bestUserAgent = userAgent;
					break;
				}
			}

			// Cache in preferences
			preferences.set('spoofedUserAgent', bestUserAgent);
			return bestUserAgent;
		}

		// Fallback that should never happen.
		return null;
	}

	return String(currentUA);
}
