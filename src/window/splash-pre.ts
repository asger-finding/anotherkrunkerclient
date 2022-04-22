import '../aliases';
import { MESSAGE_SPLASH_DONE, SPLASH_ALIVE_TIME } from '@constants';
import { ipcRenderer, shell } from 'electron';
import { diff as versionDifference, gt as versionGreater } from 'semver';
import { ReleaseData } from '../client';
import SplashPreloadUtils from '@splash-pre-utils';
import { info } from 'electron-log';

function transformSplash(rel: ReleaseData): void {
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
	const releaseData = await SplashPreloadUtils.getReleaseDataFromEventListener();

	document.addEventListener('DOMContentLoaded', () => {
		transformSplash(releaseData);
	});
	if (document.readyState === 'complete') document.dispatchEvent(new Event('DOMContentLoaded'));
}
setupEventListeners();
