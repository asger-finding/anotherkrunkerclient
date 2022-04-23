import { MESSAGE_RELEASES_DATA } from '@constants';
import { ReleaseData } from '@client';
import { ipcRenderer } from 'electron';

export default class {

	/**
	 * @returns {Promise<ReleaseData>} clientUpdateElement The version update on the splash window
	 * @description Get the client release data and emit it to the splash window event listener.
	 */
	public static getReleaseDataFromEventListener(): Promise<ReleaseData> {
		return new Promise(resolve => {
			ipcRenderer.once(MESSAGE_RELEASES_DATA, (_evt, data: ReleaseData) => resolve(data));
		});
	}

	/**
	 * @returns {HTMLDivElement} client info wrapper element
	 * @description Getter for the client info wrapper element
	 */
	public static get clientInfoElement(): HTMLDivElement {
		return <HTMLDivElement> document.getElementById('client-info');
	}

	/**
	 * @returns {HTMLSpanElement} version text element
	 * @description Getter for the version text element
	 */
	public static get clientVersionElement(): HTMLSpanElement {
		return <HTMLSpanElement> this.clientInfoElement.getElementsByClassName('version-holder')[0];
	}

	/**
	 * @returns {HTMLSpanElement} update text element
	 * @description Getter for the update text element
	 */
	public static get clientUpdateElement(): HTMLSpanElement {
		return <HTMLSpanElement> this.clientInfoElement.getElementsByClassName('update-holder')[0];
	}

}
