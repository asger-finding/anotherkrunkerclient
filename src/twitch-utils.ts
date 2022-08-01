import {
	IS_DEVELOPMENT,
	TWITCH_CLIENT_ID,
	TWITCH_PORT,
	preferences
} from '@constants';
import { error, info, warn } from '@logger';
import { Client } from 'tmi.js';
import { createServer } from 'http';
import fetch from 'node-fetch';
import { openExternal } from '@window-utils';

export default class {

	/**
	 * Create a new Twitch client.
	 * 
	 * @returns Promise for a tmi.js client instance.
	 */
	public static async createClient(): Promise<Client> {
		const token = await this.getAccessToken();
		const username = await this.getUsername(token);

		return new Client({
			options: { debug: IS_DEVELOPMENT ?? false },
			logger: { info, warn, error },
			identity: {
				username,
				password: `oauth:${ token }`
			},
			// TODO: Any channel can be selected
			channels: [username]
		});
	}

	/** @returns Promise for Twitch oauth token, either saved in the preferences or fetched from the Twitch API. */
	private static getAccessToken(): Promise<string> {
		return new Promise((resolve, reject) => {
			const cachedToken = preferences.get('twitch.token');
			if (typeof cachedToken === 'string') return resolve(cachedToken);

			// Create a random state string to prevent csrf attacks
			const state = Math.random().toString(36)
				.substring(2, 12)
			+ Math.random().toString(36)
				.substring(2, 12);

			// Create oauth url
			const url = `https://id.twitch.tv/oauth2/authorize?client_id=${
				TWITCH_CLIENT_ID
			}&redirect_uri=http://localhost:${
				TWITCH_PORT
			}&state=${
				state
			}&response_type=token&scope=chat:read+chat:edit`;

			const server = createServer((req, res) => {
				if (req.method !== 'GET') return res.end();

				if (req.url === '/') {
					res.writeHead(200, { 'Content-Type': 'text/html' });

					return res.end(`<!DOCTYPE html>
					<html lang="en">
						<head><title>Twitch oAuth Portal</title><head>
	
						<body>
							<noscript><h2>You must enable JavaScript to use Twitch oauth!</h2></noscript>
					
							<h2>You may close this window</h2>
					
							<script>
								if (location.hash) {
									const token = location.hash.match(/access_token=(.*)&scope/)[1];
									const state = location.hash.match(/state=(.*)&/)[1];
									if (state !== '${ state }') throw new Error('State mismatch');
	
									fetch('http://localhost:${ TWITCH_PORT }/token?token=' + token, {
										method: 'GET',
										headers: {
											'Content-Type': 'application/json'
										}
									}).then(window.close);
								} else {
									document.write('<h2>An error has occured</h2>');
								}
							</script>
						<body>
					</html>`);
				}
				if (String(req.url).startsWith('/token')) {
					res.writeHead(200, { 'Content-Type': 'text/html' });
					res.end();
					server.close();

					const result = this.handleTokenUrl(req.url);

					if (result instanceof Error) return reject(result);
					return resolve(result);
				}
				return res.end();
			}).listen(TWITCH_PORT, () => {
				openExternal(url);
			});

			// Close the server after 5 minutes
			setTimeout(() => {
				server.close();

				return reject(new Error('Timeout'));
			}, 5 * 60 * 1000);
		});
	}

	/**
	 * Handles the Twitch oauth token url with a regex.
	 * 
	 * @param url url string
	 * @returns Twitch oauth token or an error if the token was not found.
	 */
	private static handleTokenUrl(url: string | undefined): string | Error {
		const { token } = String(url).match(/token=(?<token>.*)/u)?.groups ?? {};

		if (!token) return new Error('No token');

		preferences.set('twitch.token', token);
		return token;
	}

	/**
	 * Get the username of the Twitch authenticated user.
	 * 
	 * @param token Twitch oauth token
	 * @returns Promise for Twitch username from the Twitch API.
	 */
	private static async getUsername(token: string): Promise<string> {
		// We should not cache the username, as it can be changed.
		const login: string = await fetch('https://api.twitch.tv/helix/users', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${ token }`,
				'Client-ID': TWITCH_CLIENT_ID
			}
		}).then(res => res.json())
			.then(({ data }) => data[0].login);

		preferences.set('twitch.username', login);

		return login;
	}

	/**
	 * Check the live status of the authenticated user.
	 * 
	 * The status may take a few minutes to update.
	 */
	public static async isLive() {
		const token = await this.getAccessToken();
		// TODO: Any streamer can be checked for live status.
		const username = await this.getUsername(token);

		return fetch(`https://api.twitch.tv/helix/streams?user_login=${ username }`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${ token }`,
				'Client-ID': TWITCH_CLIENT_ID
			}
		}).then(res => res.json())
			.then(({ data }) => data.length > 0);
	}

}
