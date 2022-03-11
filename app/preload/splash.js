const { ipcRenderer, shell } = require('electron');
const { gt: versionGreater, diff: versionDifference } = require('semver');
const PreloadUtils = require('../utils/PreloadUtils.js');

document.addEventListener('DOMContentLoaded', async() => {
	// Get the version of the client from package.json and set it as innerText on the splash window.
	const { clientVersionElement, clientUpdateElement } = PreloadUtils;
	const clientVersion = `v${ await PreloadUtils.getClientVersion() }`;

	if (clientVersionElement && clientUpdateElement) {
		clientVersionElement.innerText = clientVersion;

		const { releaseVersion, releaseUrl } = await PreloadUtils.getLatestGitHubRelease();

		if (versionGreater(releaseVersion, clientVersion)) {
			clientUpdateElement.innerText += `new ${ versionDifference(clientVersion, releaseVersion) } release available: `;
			clientUpdateElement.append(Object.assign(document.createElement('a'), {
				href: '#',
				innerText: releaseVersion,
				onclick: () => shell.openExternal(releaseUrl)
			}));
		} else {
			clientUpdateElement.innerText += 'up to date';
		}
	}
});

window.openSettings = function() {
	ipcRenderer.send('openSettings');
};
window.exitClient = function() {
	ipcRenderer.send('exitClient');
};
