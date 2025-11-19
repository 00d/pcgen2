/**
 * IndexedDB wrapper using localforage
 * Provides simple key-value storage with IndexedDB backend
 */

import localforage from 'localforage';

// Configure localforage for character storage
export const characterStorage = localforage.createInstance({
  name: 'pcgen-web',
  storeName: 'characters',
  description: 'PCGen character data storage',
});

// Configure localforage for app settings
export const settingsStorage = localforage.createInstance({
  name: 'pcgen-web',
  storeName: 'settings',
  description: 'PCGen app settings storage',
});

export { localforage };
