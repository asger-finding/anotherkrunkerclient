import '../aliases';
import '@game-settings';
import '@game-api';

import { MESSAGE_EXIT_CLIENT } from '@constants';
import { ipcRenderer } from 'electron';

// When closeClient is called from the onclick, close the client. This must not be enumerable as Krunker will overrride it.
Object.defineProperty(window, 'closeClient', {
	enumerable: false,
	value(): void { return ipcRenderer.send(MESSAGE_EXIT_CLIENT); }
});

// Show the client exit button
document.addEventListener('DOMContentLoaded', (): void => {
	const showClientExit = document.createElement('style');
	showClientExit.innerHTML = '#clientExit { display: flex; }';

	document.head.appendChild(showClientExit);
});
