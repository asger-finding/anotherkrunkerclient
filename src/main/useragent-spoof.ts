import { info } from 'electron-log';
import { preferences } from '@constants';

/**
 * Get the current operating system and return it in a format matching a UA.
 * @returns The operating system as it would appear in a user agent string
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
 * Get a spoofed user agent from the top-user-agents package corresponding to the user operating system.
 * @returns The spoofed user agent string or null if no spoofed user agent is found
 */
export async function getSpoofedUA(): Promise<(string | null)> {
	// Check for a cached spoofed UA.
	const currentUA = preferences.get('spoofedUserAgent', null);

	// If there is no cached UA, generate a new one and cache it.
	if (!currentUA) {
		info('Generating a new spoofed user agent');

		// Get the top user agents. This is a pretty large task, so it's cached and only used when strictly necessary.
		const UserAgents = await import('top-user-agents');
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
