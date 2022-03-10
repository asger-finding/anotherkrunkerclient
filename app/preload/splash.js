const { CLIENT_REPO, CLIENT_VERSION } = require('../constants.js');
const { ipcRenderer, shell } = require('electron');
const { gt: semverGt, diff: semverDiff } = require('semver');
const { get } = require('axios');

class PreloadUtils {

	/**
	 * 
	 * @returns {string} package.json version
	 * @description
	 * Get the current version of the client from the package.
	 */
	static getClientVersion() {
		const version = CLIENT_VERSION;
		return version;
	}

	/**
	 * @returns {Promise<string>} Latest version of the client from GitHub
	 * @description
	 * Get the latest release from GitHub.  
	 * If none is found, return 0.0.0 to resolve with semver.
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
	static get clientVersionElement() {
		return document.getElementById('clientVersion');
	}

}

document.addEventListener('DOMContentLoaded', async() => {
	// Get the version of the client from package.json and set it as innerText on the splash window.
	const clientVersion = `v${ await PreloadUtils.getClientVersion() }`;
	if (PreloadUtils.clientVersionElement instanceof HTMLElement) PreloadUtils.clientVersionElement.innerText = clientVersion;

	// Get the latest release from GitHub, if any, and compare it to the client version. If true, there is a newer release.
	const { releaseVersion, releaseUrl } = await PreloadUtils.getLatestGitHubRelease();
	if (semverGt(releaseVersion, clientVersion)) {
		// Create hyperlink to append to the version element. On click, open the release page in the user's default browser.
		const hyperlink = Object.assign(document.createElement('a'), {
			href: '#',
			innerText: releaseVersion,
			onclick: () => shell.openExternal(releaseUrl)
		});

		// Append the notification and hyperlink to the version element. Clarify the difference between release and client version.
		PreloadUtils.clientVersionElement.innerHTML += ` — new ${ semverDiff(clientVersion, releaseVersion) } release available: `;
		PreloadUtils.clientVersionElement.appendChild(hyperlink);
	} else {
		PreloadUtils.clientVersionElement.innerText += ' — up to date';
	}
});

window.openSettings = function() {
	ipcRenderer.send('openSettings');
};
window.exitClient = function() {
	ipcRenderer.send('exitClient');
};
