const prefix = 'inflow2036.feature.';
export function load(key, fallback = []) { try { return JSON.parse(localStorage.getItem(prefix + key)) ?? fallback; } catch { return fallback; } }
export function save(key, value) { localStorage.setItem(prefix + key, JSON.stringify(value)); }
export function clearFeature(key) { localStorage.removeItem(prefix + key); }
