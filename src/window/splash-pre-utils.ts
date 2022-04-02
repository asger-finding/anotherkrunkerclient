import { ReleaseData } from '../client';

const { ipcRenderer } = require('electron');
const { MESSAGE_RELEASES_DATA } = require('@constants');

module.exports = class {

	/**
	 * @returns {Promise<>} clientUpdateElement The version update on the splash window
	 * @description
	 * Get the client release data and emit it to the splash window event listener.
	 */
	public static getReleaseDataFromEventListener() {
		return new Promise(resolve => {
			ipcRenderer.once(MESSAGE_RELEASES_DATA, (_event, data: ReleaseData) => {
				resolve(data);
			});
		});
	}

	/**
	 * @returns {HTMLDivElement} client info wrapper element
	 * @description public getter
	 */
	public static get clientInfoElement(): HTMLDivElement {
		return <HTMLDivElement> document.getElementById('client-info');
	}

	/**
	 * @returns {HTMLSpanElement} version text element
	 * @description public getter
	 */
	public static get clientVersionElement(): HTMLSpanElement {
		return <HTMLSpanElement> this.clientInfoElement.getElementsByClassName('version-holder')[0];
	}

	/**
	 * @returns {HTMLSpanElement} update text element
	 * @description public getter
	 */
	public static get clientUpdateElement(): HTMLSpanElement {
		return <HTMLSpanElement> this.clientInfoElement.getElementsByClassName('update-holder')[0];
	}

};
