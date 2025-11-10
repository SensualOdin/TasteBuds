import { Json, Tables } from '@lib/database.types';
import { supabase } from '@lib/supabase';

export type Restaurant = Tables<'restaurants'>;

type ExpoExtra = {
  googlePlacesApiKey?: string;
};

const GOOGLE_PLACES_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ??
  ((globalThis as typeof globalThis & { extra?: ExpoExtra }).extra?.googlePlacesApiKey);

if (__DEV__ && GOOGLE_PLACES_API_KEY) {
  console.log('[RestaurantService] Google Places API key loaded:', GOOGLE_PLACES_API_KEY.substring(0, 10) + '...');
} else if (__DEV__ && !GOOGLE_PLACES_API_KEY) {
  console.warn('[RestaurantService] Google Places API key is missing!');
}

const GOOGLE_GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const GOOGLE_PLACE_DETAILS_API_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

type GoogleGeocodeResponse = {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
  status: string;
};

type GooglePlaceResult = {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  price_level?: number;
  photos?: Array<{
    photo_reference: string;
  }>;
  types?: string[];
};

type GooglePlacesResponse = {
  results: GooglePlaceResult[];
  status: string;
  next_page_token?: string;
};

type GooglePlaceDetailsResponse = {
  result: {
    place_id: string;
    name: string;
    formatted_address: string;
    formatted_phone_number?: string;
    website?: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    rating?: number;
    price_level?: number;
    photos?: Array<{
      photo_reference: string;
    }>;
    types?: string[];
    opening_hours?: {
      weekday_text?: string[];
    };
  };
  status: string;
};

async function geocodeZipCode(zipCode: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('Google Places API key is not configured. Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY to your .env file.');
  }

  const url = `${GOOGLE_GEOCODING_API_URL}?address=${encodeURIComponent(zipCode)}&key=${GOOGLE_PLACES_API_KEY}`;
  const response = await fetch(url);
  const data = (await response.json()) as GoogleGeocodeResponse;

  if (data.status === 'REQUEST_DENIED') {
    throw new Error(
      'Geocoding API request denied. Check that:\n1. Your API key is correct\n2. Geocoding API is enabled\n3. API key restrictions allow this request\n4. Billing is enabled on your Google Cloud project',
    );
  }

  if (data.status !== 'OK' || !data.results.length) {
    if (data.status === 'ZERO_RESULTS') {
      throw new Error(`No results found for zip code: ${zipCode}`);
    }
    throw new Error(`Geocoding API error: ${data.status}`);
  }

  const location = data.results[0].geometry.location;
  return { lat: location.lat, lng: location.lng };
}

function getPhotoUrl(photoReference: string, maxWidth = 400): string {
  if (!GOOGLE_PLACES_API_KEY) {
    return '';
  }
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}

function extractCuisineTypes(types: string[] | undefined, name?: string): string[] {
  if (!types) return [];
  
  const genericTypes = ['establishment', 'point_of_interest', 'food', 'restaurant', 'meal_delivery', 'meal_takeaway', 'store'];
  const cuisineMap: Record<string, string> = {
    meal_takeaway: 'Takeout',
    meal_delivery: 'Delivery',
    cafe: 'Cafe',
    bakery: 'Bakery',
    bar: 'Bar',
    night_club: 'Nightclub',
  };

  const foundCuisines: string[] = [];
  
  // First, check restaurant name for cuisine keywords (most reliable)
  if (name) {
    const nameLower = name.toLowerCase();
    const cuisineKeywords: Record<string, string> = {
      italian: 'Italian',
      pizza: 'Italian',
      pasta: 'Italian',
      chinese: 'Chinese',
      japanese: 'Japanese',
      sushi: 'Japanese',
      ramen: 'Japanese',
      mexican: 'Mexican',
      taco: 'Mexican',
      burrito: 'Mexican',
      indian: 'Indian',
      curry: 'Indian',
      thai: 'Thai',
      french: 'French',
      american: 'American',
      burger: 'American',
      bbq: 'BBQ',
      barbecue: 'BBQ',
      seafood: 'Seafood',
      steak: 'Steakhouse',
      steakhouse: 'Steakhouse',
      vegan: 'Vegan',
      vegetarian: 'Vegetarian',
      mediterranean: 'Mediterranean',
      greek: 'Greek',
      korean: 'Korean',
      vietnamese: 'Vietnamese',
      brazilian: 'Brazilian',
      spanish: 'Spanish',
      german: 'German',
      bavarian: 'German',
      texas: 'American',
      texan: 'American',
      grill: 'Grill',
      sports: 'Sports Bar',
      pub: 'Pub',
      tavern: 'Tavern',
    };

    for (const [keyword, cuisine] of Object.entries(cuisineKeywords)) {
      if (nameLower.includes(keyword) && !foundCuisines.includes(cuisine)) {
        foundCuisines.push(cuisine);
        break; // Only take first match from name
      }
    }
  }
  
  // Then check types array
  for (const type of types) {
    if (genericTypes.includes(type)) continue;
    
    if (cuisineMap[type]) {
      if (!foundCuisines.includes(cuisineMap[type])) {
        foundCuisines.push(cuisineMap[type]);
      }
    } else if (type.includes('_')) {
      // Check if any part of the type matches a cuisine keyword
      const parts = type.split('_');
      for (const part of parts) {
        if (part.length > 2) {
          const capitalized = part.charAt(0).toUpperCase() + part.slice(1);
          // Only add if it looks like a cuisine type (not generic words)
          const cuisineWords = ['italian', 'chinese', 'japanese', 'mexican', 'indian', 'thai', 'french', 'american', 'greek', 'korean', 'vietnamese', 'spanish', 'german'];
          if (cuisineWords.includes(part.toLowerCase()) && !foundCuisines.includes(capitalized)) {
            foundCuisines.push(capitalized);
            break;
          }
        }
      }
    }
  }

  return foundCuisines.slice(0, 2);
}

export async function fetchNearbyRestaurants({
  zipCode,
  radiusMiles,
  cuisineFilters,
  priceMin,
  priceMax,
}: {
  zipCode: string;
  radiusMiles: number;
  cuisineFilters?: string[];
  priceMin?: number;
  priceMax?: number;
}): Promise<Restaurant[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('Google Places API key is not configured. Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY to your .env file.');
  }

  const location = await geocodeZipCode(zipCode);
  if (!location) {
    throw new Error(`Unable to find location for zip code: ${zipCode}`);
  }

  const radiusMeters = Math.round(radiusMiles * 1609.34);
  let url = `${GOOGLE_PLACES_API_URL}?location=${location.lat},${location.lng}&radius=${radiusMeters}&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`;

  if (cuisineFilters && cuisineFilters.length > 0) {
    url += `&keyword=${encodeURIComponent(cuisineFilters.join(' '))}`;
  }

  const restaurants: Restaurant[] = [];
  let nextPageToken: string | undefined;

  do {
    const currentUrl = nextPageToken ? `${url}&pagetoken=${nextPageToken}` : url;
    const response = await fetch(currentUrl);
    const data = (await response.json()) as GooglePlacesResponse;

    if (data.status === 'REQUEST_DENIED') {
      throw new Error(
        'Places API request denied. Check that:\n1. Your API key is correct\n2. Places API is enabled\n3. API key restrictions allow this request\n4. Billing is enabled on your Google Cloud project',
      );
    }

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    if (data.status === 'ZERO_RESULTS') {
      break;
    }

    for (const place of data.results) {
      if (priceMin !== undefined && place.price_level !== undefined && place.price_level < priceMin) {
        continue;
      }
      if (priceMax !== undefined && place.price_level !== undefined && place.price_level > priceMax) {
        continue;
      }

      const photoUrls = place.photos
        ?.slice(0, 3)
        .map((photo) => getPhotoUrl(photo.photo_reference))
        .filter(Boolean) ?? [];

      const cuisineTypes = extractCuisineTypes(place.types, place.name);

      const restaurant: Restaurant = {
        id: place.place_id,
        place_id: place.place_id,
        name: place.name,
        address: place.vicinity,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: place.rating ?? null,
        price_level: place.price_level ?? null,
        photo_urls: photoUrls.length > 0 ? photoUrls : null,
        cuisine: cuisineTypes.length > 0 ? cuisineTypes : null,
        phone: null,
        website: null,
        hours: null,
        yelp_id: null,
        created_at: new Date().toISOString(),
      };

      restaurants.push(restaurant);
    }

    nextPageToken = data.next_page_token;
    if (nextPageToken) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } while (nextPageToken);

  return restaurants;
}

export async function fetchRestaurantDetails(placeId: string): Promise<Restaurant | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('Google Places API key is not configured');
  }

  const url = `${GOOGLE_PLACE_DETAILS_API_URL}?place_id=${placeId}&fields=place_id,name,formatted_address,formatted_phone_number,website,geometry,rating,price_level,photos,types,opening_hours&key=${GOOGLE_PLACES_API_KEY}`;
  const response = await fetch(url);
  const data = (await response.json()) as GooglePlaceDetailsResponse;

  if (data.status !== 'OK') {
    return null;
  }

  const result = data.result;
  const photoUrls = result.photos
    ?.slice(0, 3)
    .map((photo) => getPhotoUrl(photo.photo_reference))
    .filter(Boolean) ?? [];

  const cuisineTypes = extractCuisineTypes(result.types, result.name);

  return {
    id: result.place_id,
    place_id: result.place_id,
    name: result.name,
    address: result.formatted_address,
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    rating: result.rating ?? null,
    price_level: result.price_level ?? null,
    photo_urls: photoUrls.length > 0 ? photoUrls : null,
    cuisine: cuisineTypes.length > 0 ? cuisineTypes : null,
    phone: result.formatted_phone_number ?? null,
    website: result.website ?? null,
    hours: result.opening_hours?.weekday_text ? (result.opening_hours.weekday_text as Json) : null,
    yelp_id: null,
    created_at: new Date().toISOString(),
  };
}

export async function upsertRestaurants(restaurants: Restaurant[]): Promise<void> {
  if (restaurants.length === 0) return;

  const { error } = await supabase.from('restaurants').upsert(restaurants, { onConflict: 'place_id' });

  if (error) {
    throw error;
  }
}

