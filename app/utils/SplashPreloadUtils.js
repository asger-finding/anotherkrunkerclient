const {
	CLIENT_REPO,
	CLIENT_VERSION
} = require('../constants.js');
const { get } = require('axios');
const { info, warn } = require('electron-log');

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
		info('Getting latest GitHub release...');

		const newest = await get(`https://api.github.com/repos/${ CLIENT_REPO }/releases/latest`)
			.then(response => ({
				releaseVersion: response.data.tag_name,
				releaseUrl: response.data.html_url
			}))
			.catch(() => ({ releaseVersion: 'v0.0.0' }), warn('No latest GitHub release was found.\nCheck that constants.js is configured correctly.'));

		return newest;
	}

	/**
	 * @returns {HTMLDivElement} clientInfoElement The client info element on the splash window
	 * @description
	 * Getter for the client info element on the splash window.
	 */
	static get clientInfoElement() {
		this._clientInfoElement = this._clientInfoElement
			|| document.getElementById('client-info');

		return this._clientInfoElement;
	}

	/**
	 * @returns {HTMLDivElement} clientVersionElement The version element on the splash window
	 * @description
	 * Getter for the version element on the splash window.
	 */
	static get clientVersionElement() {
		this._clientVersionElement = this._clientVersionElement
			|| this.clientInfoElement.getElementsByClassName('version-holder')[0];

		return this._clientVersionElement;
	}

	/**
	 * @returns {HTMLDivElement} clientUpdateElement The version update on the splash window
	 * @description
	 * Getter for the version update on the splash window.
	 */
	static get clientUpdateElement() {
		this._clientUpdateElement = this._clientUpdateElement
			|| this.clientInfoElement.getElementsByClassName('update-holder')[0];

		return this._clientUpdateElement;
	}

};
