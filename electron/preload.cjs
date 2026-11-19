const {
  contextBridge
} = require('electron');

contextBridge.exposeInMainWorld(
  'cybill',
  {
    isDesktop: true,
    platform: process.platform
  }
);