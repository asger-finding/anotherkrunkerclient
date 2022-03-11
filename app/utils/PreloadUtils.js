const { CLIENT_REPO, CLIENT_VERSION } = require('../constants.js');
const { get } = require('axios');

module.exports = class {

	/**
	 * 
	 * @returns {string} version The package.json version
	 * @description
	 * Get the current version of the client from the package.
	 */
	static getClientVersion() {
		const version = CLIENT_VERSION;
		return version;
	}

	/**
	 * @returns {string} releaseVersion The latest version of the client from GitHub
	 * @returns {string} releaseUrl The release URL from GitHub
	 * @description
	 * Get the latest release from GitHub.  
	 * If none is found, return v0.0.0 to resolve with semver.
	 */
	static async getLatestGitHubRelease() {
		const newest = await get(`https://api.github.com/repos/${ CLIENT_REPO }/releases/latest`)
			.then(response => ({
				releaseVersion: response.data.tag_name,
				releaseUrl: response.data.html_url
			}))
			.catch(() => ({ releaseVersion: 'v0.0.0' }));

		return newest;
	}

	/**
	 * @returns {HTMLDivElement} clientVersionElement The version element on the splash window
	 * @description
	 * Getter for the version element on the splash window.
	 */
	static get clientVersionElement() {
		return document.getElementById('clientVersion');
	}

};
