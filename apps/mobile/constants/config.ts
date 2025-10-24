// API Configuration
export const API_URL = process.env.API_URL || 'http://localhost:3000';
export const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3000';

// App Configuration
export const APP_NAME = 'TasteBuds';
export const APP_VERSION = '1.0.0';

// Session Configuration
export const MAX_MATCHES = 3;
export const DEFAULT_SEARCH_RADIUS = 5000; // meters (5km)
export const MIN_SEARCH_RADIUS = 1000; // 1km
export const MAX_SEARCH_RADIUS = 50000; // 50km

// Swipe Configuration
export const SWIPE_THRESHOLD = 0.25; // 25% of screen width
export const ROTATION_MULTIPLIER = 20; // degrees
