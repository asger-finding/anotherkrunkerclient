import { USERAGENT_LIFETIME, preferences } from '@constants';
import { info } from 'electron-log';

const storeSchema = 'userAgentSpoof';

/**
 * Get the current operating system and return it in a format matching a UA.
 * @returns The operating system as it would appear in a user agent string
 */
function getCurrentUAOS(): string {
	switch (process.platform) {
		case 'darwin':
			return 'Mac';
		case 'linux':
			return 'Linux';
		case 'win32':
		default:
			return 'Win';
	}
}

function getCurrentUA(): string | null {
	// If it's been more than 30 days since the last user agent change, generate a new one.
	const lastSet = preferences.get(`${ storeSchema }.set`, Date.now());
	if (Date.now() - Number(lastSet) > USERAGENT_LIFETIME) preferences.reset(`${ storeSchema }.userAgent`);

	return preferences.get(`${ storeSchema }.userAgent`, null) as string | null;
}

/**
 * Get a spoofed user agent from the top-user-agents package corresponding to the user operating system.
 * @returns The spoofed user agent string or null if no spoofed user agent is found
 */
export async function getSpoofedUA(): Promise<(string | null)> {
	// Check for a cached spoofed UA.
	const currentUA = getCurrentUA();

	// If there is no cached UA or it's been more than a month, generate a new one
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
			preferences.set(`${ storeSchema }.userAgent`, bestUserAgent);
			preferences.set(`${ storeSchema }.set`, Date.now());
			return bestUserAgent;
		}

		// Fallback that should never happen.
		return null;
	}

	return String(currentUA);
}
