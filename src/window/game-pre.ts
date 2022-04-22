import '../aliases';
import '@game-settings';
import '@game-api';

import { MESSAGE_EXIT_CLIENT } from '@constants';
import { ipcRenderer } from 'electron';

// Remove the 'client deprecated' popup.
window.OffCliV = true;

// When closeClient is called from the onclick, close the client.
Object.defineProperty(window, 'closeClient', {
	enumerable: false,
	value(): void { return ipcRenderer.send(MESSAGE_EXIT_CLIENT); }
});

// Show the client exit button
document.addEventListener('DOMContentLoaded', () => {
	const showClientExit = document.createElement('style');
	showClientExit.innerHTML = '#clientExit { display: flex; }';

	document.head.appendChild(showClientExit);
});
