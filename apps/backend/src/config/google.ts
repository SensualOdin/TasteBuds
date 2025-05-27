// Google API Configuration
export const GOOGLE_CONFIG = {
  API_KEY: process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyCwN9nJzc2dSlCONQ-Bsd1pdRjGF9kaXSI',
  PLACES_API_URL: 'https://places.googleapis.com/v1',
  LEGACY_PLACES_URL: 'https://maps.googleapis.com/maps/api/place',
};

// Log configuration for debugging
console.log('🔑 Google API Configuration:');
console.log('API Key loaded:', GOOGLE_CONFIG.API_KEY ? 'YES ✅' : 'NO ❌');
console.log('API Key length:', GOOGLE_CONFIG.API_KEY?.length || 0);
console.log('From environment:', process.env.GOOGLE_PLACES_API_KEY ? 'YES' : 'NO (using fallback)'); 