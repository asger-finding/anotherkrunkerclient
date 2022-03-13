require('../aliases.js');
import { GitHubReleaseData } from '../akc';

const { MESSAGE_SPLASH_DONE, SPLASH_LIFETIME, MESSAGE_EXIT_CLIENT, MESSAGE_OPEN_SETTINGS } = require('@constants');
const { ipcRenderer, shell } = require('electron');
const { gt: versionGreater, diff: versionDifference } = require('semver');
const SplashPreloadUtils = require('../utils/SplashPreloadUtils');
const { info } = require('electron-log');

document.addEventListener('DOMContentLoaded', async() => {
	const start = Date.now();

	// Get the version of the client from package.json and set it as innerText on the splash window.
	const { clientVersionElement, clientUpdateElement } = SplashPreloadUtils;
	const clientVersion = `v${ await SplashPreloadUtils.getClientVersion() }`;

	if (clientVersionElement instanceof HTMLSpanElement) clientVersionElement.innerText = clientVersion;

	const { releaseVersion, releaseUrl }: GitHubReleaseData = await SplashPreloadUtils.getLatestGitHubRelease();

	// See if an update is available.
	if (clientUpdateElement instanceof HTMLSpanElement && versionGreater(releaseVersion, clientVersion)) {
		info('New version of the client is available!');

		clientUpdateElement.innerText += `new ${ versionDifference(clientVersion, releaseVersion) } release available: `;
		clientUpdateElement.append(Object.assign(document.createElement('a'), {
			href: '#',
			innerText: releaseVersion,
			onclick: () => shell.openExternal(String(releaseUrl))
		}));
	} else {
		info('Client is up to date');

		clientUpdateElement.innerText += 'up to date';
	}

	// Invoke callback to indicate that the splash window is done.
	const doneTime = Date.now() - start;
	setTimeout(() => {
		info(`Invoking ${ MESSAGE_SPLASH_DONE }`);
		ipcRenderer.send(MESSAGE_SPLASH_DONE);
	}, doneTime > SPLASH_LIFETIME ? 1 : SPLASH_LIFETIME - doneTime);
});

window.openSettings = function() {
	ipcRenderer.send(MESSAGE_EXIT_CLIENT);
	return null;
};

window.exitClient = function() {
	ipcRenderer.send(MESSAGE_OPEN_SETTINGS);
	return null;
};
