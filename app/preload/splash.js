const { ipcRenderer, shell } = require('electron');
const { gt: versionGreater, diff: versionDifference } = require('semver');
const SplashPreloadUtils = require('../utils/SplashPreloadUtils.js');
const { info } = require('electron-log');

document.addEventListener('DOMContentLoaded', async() => {
	// Get the version of the client from package.json and set it as innerText on the splash window.
	const { clientVersionElement, clientUpdateElement } = SplashPreloadUtils;
	const clientVersion = `v${ await SplashPreloadUtils.getClientVersion() }`;

	if (clientVersionElement && clientUpdateElement) {
		clientVersionElement.innerText = clientVersion;

		const { releaseVersion, releaseUrl } = await SplashPreloadUtils.getLatestGitHubRelease();

		if (versionGreater(releaseVersion, clientVersion)) {
			info(`New version of client is available!`);

			clientUpdateElement.innerText += `new ${ versionDifference(clientVersion, releaseVersion) } release available: `;
			clientUpdateElement.append(Object.assign(document.createElement('a'), {
				href: '#',
				innerText: releaseVersion,
				onclick: () => shell.openExternal(releaseUrl)
			}));
		} else {
			info('Client is up to date');

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
