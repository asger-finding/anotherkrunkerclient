const { ipcRenderer } = require('electron');
const { MESSAGE_RELEASES_DATA } = require('@constants');

module.exports = class {

	public static setupEventListeners() {
		return new Promise(resolve => {
			ipcRenderer.on(MESSAGE_RELEASES_DATA, (_event, data) => {
				resolve(data);
			});
		});
	}

	/**
	 * @returns {HTMLDivElement} clientInfoElement The client info element on the splash window
	 * @description
	 * Getter for the client info element on the splash window.
	 */
	public static get clientInfoElement(): HTMLDivElement {
		return <HTMLDivElement> document.getElementById('client-info');
	}

	/**
	 * @returns {HTMLSpanElement} clientVersionElement The version element on the splash window
	 * @description
	 * Getter for the version element on the splash window.
	 */
	public static get clientVersionElement(): HTMLSpanElement {
		return <HTMLSpanElement> this.clientInfoElement.getElementsByClassName('version-holder')[0];
	}

	/**
	 * @returns {HTMLSpanElement} clientUpdateElement The version update on the splash window
	 * @description
	 * Getter for the version update on the splash window.
	 */
	public static get clientUpdateElement(): HTMLSpanElement {
		return <HTMLSpanElement> this.clientInfoElement.getElementsByClassName('update-holder')[0];
	}

};
