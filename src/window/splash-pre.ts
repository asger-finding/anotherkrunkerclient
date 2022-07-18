import { MESSAGE_SPLASH_DONE, SPLASH_ALIVE_TIME } from '@constants';
import { diff as versionDifference, gt as versionGreater } from 'semver';
import { ReleaseData } from '@client';
import SplashPreloadUtils from '@splash-pre-utils';
import { info } from '@logger';
import { ipcRenderer } from 'electron';
import { openExternal } from '@window-utils';

/**
 * Transform the HTML of the splash window to show the release data and assign event listeners.
 * 
 * @param releaseData - Release data from GitHub API to display in the splash
 */
function transformSplash(releaseData: ReleaseData): void {
	const { clientVersionElement, clientUpdateElement } = SplashPreloadUtils;
	const { releaseVersion, clientVersion, releaseUrl } = releaseData;

	if (clientVersionElement instanceof HTMLSpanElement) clientVersionElement.innerText = clientVersion;
	if (clientUpdateElement instanceof HTMLSpanElement && versionGreater(releaseVersion, clientVersion)) {
		info(`Client update available: ${ releaseVersion }`);

		clientUpdateElement.innerText += `new ${ versionDifference(clientVersion, releaseVersion) } release available: `;
		clientUpdateElement.append(Object.assign(document.createElement('a'), {
			href: '#',
			innerText: releaseVersion,

			/**
			 * Open the release page externally.
			 *
			 * @returns void
			 */
			onclick: () => openExternal(releaseUrl)
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

(async function setupEventListeners() {
	const releaseData = await SplashPreloadUtils.getReleaseDataFromEventListener();

	document.addEventListener('DOMContentLoaded', () => {
		transformSplash(releaseData);
	});
	if (document.readyState === 'complete') document.dispatchEvent(new Event('DOMContentLoaded'));
}());
