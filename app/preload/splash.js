const { ipcRenderer, shell } = require('electron');
const { gt: semverGt, diff: semverDiff } = require('semver');
const PreloadUtils = require('../utils/PreloadUtils.js');

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
