import { ReleaseData } from '../client';
require('../aliases');

const { ipcRenderer, shell } = require('electron');
const { gt: versionGreater, diff: versionDifference } = require('semver');
const { info } = require('electron-log');
const SplashPreloadUtils = require('@splash-pre-utils');
const { SPLASH_ALIVE_TIME, MESSAGE_SPLASH_DONE } = require('@constants');

function transformSplash(rel: ReleaseData) {
	const { clientVersionElement, clientUpdateElement } = SplashPreloadUtils;
	if (clientVersionElement instanceof HTMLSpanElement) clientVersionElement.innerText = rel.clientVersion;

	if (clientUpdateElement instanceof HTMLSpanElement && versionGreater(rel.releaseVersion, rel.clientVersion)) {
		info(`Client update available: ${ rel.releaseVersion }`);

		clientUpdateElement.innerText += `new ${ versionDifference(rel.clientVersion, rel.releaseVersion) } release available: `;
		clientUpdateElement.append(Object.assign(document.createElement('a'), {
			href: '#',
			innerText: rel.releaseVersion,
			onclick: () => shell.openExternal(rel.releaseUrl)
		}));
	} else {
		info('Client is up to date');

		clientUpdateElement.innerText += 'up to date';
	}

	setTimeout(() => {
		info(`Invoking ${ MESSAGE_SPLASH_DONE }`);
		ipcRenderer.send(MESSAGE_SPLASH_DONE);
	}, SPLASH_ALIVE_TIME);
}

async function setupEventListeners() {
	const releaseData: ReleaseData = await SplashPreloadUtils.getReleaseDataFromEventListener();

	document.addEventListener('DOMContentLoaded', () => {
		transformSplash(releaseData);
	});
	if (document.readyState === 'complete') document.dispatchEvent(new Event('DOMContentLoaded'));
}
setupEventListeners();
