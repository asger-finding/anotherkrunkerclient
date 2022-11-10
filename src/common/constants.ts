import { Author, WindowData } from '@client';
import { author, productName, repository, version } from '../../package.json';
import { app } from 'electron';

// The author field in package.json may appear as either a string or an object.
// Ensure its of type string
export const CLIENT_AUTHOR = ((author as Author) instanceof Object
	? `${ author.name }${ author.email ? ` <${ author.email }>` : '' }`
	: author) as string;

export {
	productName as CLIENT_NAME,
	version as CLIENT_VERSION,
	repository as CLIENT_REPO
};

// Permalink to the license
export const CLIENT_LICENSE_PERMALINK = 'https://yerl.org/ZKZ8V';

export const TARGET_GAME_DOMAIN: 'krunker.io' | 'browserfps.com' = 'krunker.io';
export const TARGET_GAME_URL = `https://${ TARGET_GAME_DOMAIN }/`;
export const QUICKJOIN_URL_QUERY_PARAM = 'quickjoin';

// Client ID can be obtained by creating a new app on the Twitch developer portal (https://dev.twitch.tv/console/apps)
export enum TWITCH {
	CLIENT_ID = 'b8ee5yb7azo5fochp2ajvt9e5f4sfs',
	PORT = 33333,
	MATERIAL_ICON = 'live_tv'
}

// If not contained, it will throw an error whenever Constants is referenced outside the main process.
export const IS_DEVELOPMENT = process.type === 'browser' ? !app.isPackaged : null;

// How long before the client ends the electron process after all windows are closed
export const WINDOW_ALL_CLOSED_BUFFER_TIME = 200;

// 14 days in milliseconds
export const USERAGENT_LIFETIME = 14 * 24 * 60 * 60 * 1000;

// Named krunker tabs
export const TABS = {
	GAME: 'game',
	SOCIAL: 'social',
	DOCS: 'docs',
	COMP: 'comp',
	VIEWER: 'viewer',
	EDITOR: 'editor'
};

// ipc messages must be typeof string
export enum MESSAGES {
	GAME_DONE = 'game-done',
	EXIT_CLIENT = 'exit-client',
	TWITCH_GET_INFO = 'twitch-get-info',
	TWITCH_MESSAGE_SEND = 'twitch-message-send',
	TWITCH_MESSAGE_RECEIVE = 'twitch-message-receive'
}

/**
 * Returns the current Krunker tab (if any), whether we're on Krunker, what Krunker tab we're on, and whether quickJoin is enabled
 *
 * @param baseURL The URL to analyze
 * @returns Analyzed URL
 */
export const getURLData = (baseURL?: string): WindowData => {
	try {
		if (typeof baseURL !== 'string') throw new TypeError('Provided URL is not typeof string');

		const url = new URL(baseURL);

		const isKrunker = url.hostname.endsWith(TARGET_GAME_DOMAIN);
		const tab = isKrunker ? (String(url.pathname.split('/')[1]).replace('.html', '') || TABS.GAME) : '';
		const isInTabs = Object.values(TABS).includes(tab);
		const quickJoin = url.searchParams.get(QUICKJOIN_URL_QUERY_PARAM) === 'true';

		return {
			url: baseURL,
			invalid: false,
			tab,
			isInTabs,
			isKrunker,
			quickJoin
		};
	} catch (err) {
		// Fallback to default
		return {
			url: baseURL,
			invalid: true,
			isInTabs: false,
			isKrunker: false,
			quickJoin: false
		};
	}
};
