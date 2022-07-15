import { MESSAGE_SPLASH_DONE, SPLASH_ALIVE_TIME } from '@constants';
import { ipcRenderer, shell } from 'electron';
import { diff as versionDifference, gt as versionGreater } from 'semver';
import { ReleaseData } from '@client';
import SplashPreloadUtils from '@splash-pre-utils';
import { info } from '@logger';

function transformSplash(rel: ReleaseData): void {
	const { clientVersionElement, clientUpdateElement } = SplashPreloadUtils;
	const { releaseVersion, clientVersion, releaseUrl } = rel;

	if (clientVersionElement instanceof HTMLSpanElement) clientVersionElement.innerText = clientVersion;
	if (clientUpdateElement instanceof HTMLSpanElement && versionGreater(releaseVersion, clientVersion)) {
		info(`Client update available: ${ releaseVersion }`);

		clientUpdateElement.innerText += `new ${ versionDifference(rel.clientVersion, releaseVersion) } release available: `;
		clientUpdateElement.append(Object.assign(document.createElement('a'), {
			href: '#',
			innerText: releaseVersion,
			onclick: () => shell.openExternal(releaseUrl)
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
