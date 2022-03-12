import Electron = require('electron');

const {
	CLIENT_REPO,
	CLIENT_VERSION
} = require('@constants');
const { get } = require('axios');
const { info, warn } = require('electron-log');

module.exports = class {

	/**
	 * 
	 * @returns {string} version The package.json version
	 * @description
	 * Get the current version of the client from the package.
	 */
	public static getClientVersion() {
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
	public static async getLatestGitHubRelease() {
		info('Getting latest GitHub release...');

		const newest = await get(`https://api.github.com/repos/${ CLIENT_REPO }/releases/latest`)
			.then((response: { data: { tag_name: string; html_url: string; } }) => ({
				releaseVersion: response.data.tag_name,
				releaseUrl: response.data.html_url
			}))
			.catch(() => ({ releaseVersion: 'v0.0.0' }), warn('No latest GitHub release was found. Check that constants.js is configured correctly.'));

		return newest;
	}

	/**
	 * @returns {HTMLDivElement} clientInfoElement The client info element on the splash window
	 * @description
	 * Getter for the client info element on the splash window.
	 */
	public static get clientInfoElement() {
		return document.getElementById('client-info');
	}

	/**
	 * @returns {HTMLDivElement} clientVersionElement The version element on the splash window
	 * @description
	 * Getter for the version element on the splash window.
	 */
	public static get clientVersionElement() {
		return this.clientInfoElement.getElementsByClassName('version-holder')[0];
	}

	/**
	 * @returns {HTMLDivElement} clientUpdateElement The version update on the splash window
	 * @description
	 * Getter for the version update on the splash window.
	 */
	public static get clientUpdateElement() {
		return this.clientInfoElement.getElementsByClassName('update-holder')[0];
	}

};
