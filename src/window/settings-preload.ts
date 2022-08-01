import { contextBridge, ipcRenderer } from 'electron';
import Settings from '@game-settings';

contextBridge.exposeInMainWorld('electron', {
	ipcRenderer: {
		send: (channel: string, ...args:unknown[]) => {
			ipcRenderer.send(channel, ...args);
		}
	}
});

function ensureContentLoaded() {
	return new Promise<void>(promiseResolve => {
		if (document.readyState === 'interactive' || document.readyState === 'complete') promiseResolve();
		else document.addEventListener('DOMContentLoaded', () => promiseResolve());
	});
}

ensureContentLoaded().then(() => {
	const settings = new Settings();
	settings.initSettingsWindow();

	document.body.append(settings.wrapper);
});
