const { ipcRenderer } = require('electron');
const { PreloadUtils } = require('../utils.js');

document.addEventListener('DOMContentLoaded', async() => {
	const clientVersion = await PreloadUtils.getClientVersion();

	if (PreloadUtils.clientVersionElement instanceof HTMLDivElement) PreloadUtils.clientVersionElement.innerText = `anotherkrunkerclient v${ clientVersion }`;
});

window.openSettings = function() {
	ipcRenderer.send('openSettings');
};
window.exitClient = function() {
	ipcRenderer.send('exitClient');
};
