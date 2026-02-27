/**
 * API base URL: Vite env or localStorage for LAN (offline same-WiFi).
 * Set VITE_API_URL or use Settings to set "LAN server URL" (e.g. http://192.168.1.100:3001).
 */
import axios from 'axios';

const STORAGE_KEY = 'codedrop_api_url';

function getBaseURL() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored?.trim()) return stored.trim().replace(/\/+$/, '');
  } catch (_) {}
  return import.meta.env.VITE_API_URL || '';
}

export function setApiBaseURL(url) {
  if (url?.trim()) localStorage.setItem(STORAGE_KEY, url.trim().replace(/\/+$/, ''));
  else localStorage.removeItem(STORAGE_KEY);
  api.defaults.baseURL = getBaseURL() ? `${getBaseURL()}/api` : '/api';
  import('./socket.js').then((m) => m.disconnectSocket()).catch(() => {});
}

const baseURL = getBaseURL();

export const api = axios.create({
  baseURL: baseURL ? `${baseURL}/api` : '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

export function getSocketURL() {
  const url = (() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored?.trim()) return stored.trim().replace(/\/+$/, '');
    } catch (_) {}
    return import.meta.env.VITE_API_URL || '';
  })();
  if (url) {
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.host}`;
    } catch (_) {}
  }
  return ''; // same origin, Vite proxy will handle
}
