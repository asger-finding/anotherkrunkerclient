import Electron = require('electron');
import 'module-alias/register';

import { GitHubReleaseData } from '../akc.d';

const { MESSAGE_SPLASH_DONE, SPLASH_DONE_WAIT, MESSAGE_EXIT_CLIENT, MESSAGE_OPEN_SETTINGS } = require('@constants');
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

		const { releaseVersion, releaseUrl }: GitHubReleaseData = await SplashPreloadUtils.getLatestGitHubRelease();

		if (versionGreater(releaseVersion, clientVersion)) {
			info(`New version of the client is available!`);

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

	// Invoke success callback
	info(`Invoking ${ MESSAGE_SPLASH_DONE } in ${ SPLASH_DONE_WAIT } ms`);
	setTimeout(() => ipcRenderer.send(MESSAGE_SPLASH_DONE), SPLASH_DONE_WAIT);
});

window.openSettings = function() {
	return ipcRenderer.send(MESSAGE_EXIT_CLIENT);
};
window.exitClient = function() {
	return ipcRenderer.send(MESSAGE_OPEN_SETTINGS);
};
