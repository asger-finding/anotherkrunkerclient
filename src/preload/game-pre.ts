require('../aliases');

const { contextBridge } = require('electron');

// Remove the client deprecated popup.
contextBridge.exposeInMainWorld('OffCliV', [true]);
