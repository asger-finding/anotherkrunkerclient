import { MESSAGE_RELEASES_DATA } from '@constants';
import { ReleaseData } from '@client';
import { ipcRenderer } from 'electron';

export default class {

	/**
	 * Get the client release data and emit it to the splash window event listener.
	 *
	 * @returns Promise for when MESSAGE_RELEASES_DATA is received
	 */
	public static getReleaseDataFromEventListener(): Promise<ReleaseData> {
		return new Promise(resolve => {
			ipcRenderer.once(MESSAGE_RELEASES_DATA, (_evt, data: ReleaseData) => resolve(data));
		});
	}

	/**
	 * Getter for the client info wrapper element
	 *
	 * @returns Client info wrapper element
	 */
	public static get clientInfoElement(): HTMLDivElement {
		return <HTMLDivElement> document.getElementById('client-info');
	}

	/**
	 * Getter for the version text element
	 *
	 * @returns Version text element
	 */
	public static get clientVersionElement(): HTMLSpanElement {
		return <HTMLSpanElement> this.clientInfoElement.getElementsByClassName('version-holder')[0];
	}

	/**
	 * Getter for the update text element
	 *
	 * @returns Update text element
	 */
	public static get clientUpdateElement(): HTMLSpanElement {
		return <HTMLSpanElement> this.clientInfoElement.getElementsByClassName('update-holder')[0];
	}

}
