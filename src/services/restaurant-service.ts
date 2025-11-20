import { Json, Tables } from '@lib/database.types';
import { supabase } from '@lib/supabase';

export type Restaurant = Tables<'restaurants'>;

type ExpoExtra = {
  googlePlacesApiKey?: string;
};

const GOOGLE_PLACES_API_KEY =
  (process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ??
  ((globalThis as typeof globalThis & { extra?: ExpoExtra }).extra?.googlePlacesApiKey) ?? '').trim();

if (__DEV__ && GOOGLE_PLACES_API_KEY) {
  console.log('[RestaurantService] Google Places API key loaded. Length:', GOOGLE_PLACES_API_KEY.length);
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
  error_message?: string;
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

const geocodeCache = new Map<string, { lat: number; lng: number }>();

async function geocodeZipCode(zipCode: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('Google Places API key is not configured. Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY to your .env file.');
  }

  if (geocodeCache.has(zipCode)) {
    return geocodeCache.get(zipCode)!;
  }

  const url = `${GOOGLE_GEOCODING_API_URL}?address=${encodeURIComponent(zipCode)}&components=country:US&key=${GOOGLE_PLACES_API_KEY}`;
  console.log('[RestaurantService] Geocoding URL:', url.replace(GOOGLE_PLACES_API_KEY, 'HIDDEN_KEY'));
  
  const response = await fetch(url);
  const data = (await response.json()) as GoogleGeocodeResponse;

  if (data.status !== 'OK') {
    console.error('[RestaurantService] Geocoding Error:', data.status, data.error_message);
  }

  if (data.status === 'REQUEST_DENIED') {
    throw new Error(
      `Geocoding API request denied (${data.error_message || 'No error message'}). Check that:\n1. Your API key is correct\n2. Geocoding API is enabled\n3. API key restrictions allow this request\n4. Billing is enabled on your Google Cloud project`,
    );
  }

  if (data.status !== 'OK' || !data.results.length) {
    if (data.status === 'ZERO_RESULTS') {
      throw new Error(`No location found for zip code: "${zipCode}". Please verify the Geocoding API is enabled in Google Cloud Console.`);
    }
    throw new Error(`Geocoding API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
  }

  const location = data.results[0].geometry.location;
  geocodeCache.set(zipCode, { lat: location.lat, lng: location.lng });
  return { lat: location.lat, lng: location.lng };
}

function getPhotoUrl(photoReference: string, maxWidth = 400): string {
  if (!GOOGLE_PLACES_API_KEY) {
    return '';
  }
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}

/**
 * Check if a place should be excluded from restaurant results
 * Filters out non-food establishments like movie theaters, gas stations, etc.
 */
function shouldExcludePlace(types: string[] | undefined, name?: string): boolean {
  if (!types && !name) return false;
  
  const nameLower = name?.toLowerCase() || '';
  
  // Exclude based on Google Places types
  const excludedTypes = [
    // Entertainment venues
    'movie_theater',
    'movie_rental',
    'amusement_park',
    'aquarium',
    'art_gallery',
    'bowling_alley',
    'casino',
    'museum',
    'stadium',
    'tourist_attraction',
    'zoo',
    // Transportation
    'gas_station',
    'gas',
    'car_rental',
    'parking',
    'subway_station',
    'transit_station',
    'bus_station',
    'train_station',
    'airport',
    // Retail (non-food)
    'clothing_store',
    'shoe_store',
    'electronics_store',
    'furniture_store',
    'hardware_store',
    'home_goods_store',
    'jewelry_store',
    'pet_store',
    'pharmacy',
    'book_store',
    'convenience_store', // Usually gas stations
    // Services
    'bank',
    'atm',
    'hospital',
    'doctor',
    'dentist',
    'veterinary_care',
    'gym',
    'spa',
    'hair_care',
    'beauty_salon',
    'car_dealer',
    'car_repair',
    'car_wash',
    'laundry',
    'dry_cleaning',
    // Other
    'lodging',
    'real_estate_agency',
    'lawyer',
    'accounting',
    'insurance_agency',
    'post_office',
    'school',
    'university',
    'church',
    'mosque',
    'synagogue',
    'hindu_temple',
    'cemetery',
    'funeral_home',
  ];
  
  // Check types array
  if (types) {
    for (const type of types) {
      if (excludedTypes.includes(type)) {
        return true;
      }
    }
  }
  
  // Check name for excluded keywords
  const excludedKeywords = [
    // Entertainment
    'movie theater',
    'cinema',
    'theater',
    'theatre',
    'amc',
    'regal',
    'cinemark',
    'imax',
    // Gas stations
    'gas station',
    'gas station',
    'shell',
    'chevron',
    'exxon',
    'mobil',
    'bp',
    'arco',
    'valero',
    'speedway',
    '7-eleven', // Usually gas stations
    'circle k',
    'wawa', // Some locations are gas stations - but some have food, so check types
    // Retail
    'walmart',
    'target',
    'costco',
    'sam\'s club',
    'best buy',
    'home depot',
    'lowes',
    // Services
    'bank',
    'atm',
    'hospital',
    'clinic',
    'pharmacy',
    'cvs',
    'walgreens',
    'rite aid',
    'gym',
    'fitness',
    'spa',
    'salon',
    'barber',
    'car wash',
    'carwash',
    'auto repair',
    'mechanic',
    // Other
    'hotel',
    'motel',
    'inn',
    'school',
    'university',
    'college',
    'church',
    'temple',
    'mosque',
    'synagogue',
  ];
  
  for (const keyword of excludedKeywords) {
    if (nameLower.includes(keyword)) {
      // Allow exceptions - some places might have these words but are still restaurants
      // e.g., "The Bank" restaurant, "Hotel Restaurant", etc.
      // But exclude if it's clearly a non-food establishment
      if (types && types.some(t => excludedTypes.includes(t))) {
        return true;
      }
      // If name contains excluded keyword but has restaurant-related types, allow it
      const foodRelatedTypes = ['restaurant', 'food', 'cafe', 'bakery', 'bar', 'meal_takeaway', 'meal_delivery', 'fast_food_restaurant'];
      if (types && types.some(t => foodRelatedTypes.some(frt => t.includes(frt) || t === frt))) {
        continue; // This is a restaurant/food place, don't exclude
      }
      // Special case: Wawa and 7-Eleven might have food, but if they're gas stations, exclude
      if ((keyword === 'wawa' || keyword === '7-eleven' || keyword === 'circle k') && types) {
        if (types.includes('gas_station') || types.includes('gas')) {
          return true; // It's a gas station, exclude
        }
        // If it has restaurant types, keep it
        if (types.some(t => foodRelatedTypes.some(frt => t.includes(frt) || t === frt))) {
          continue;
        }
      }
      // Otherwise exclude
      return true;
    }
  }
  
  return false;
}

function extractCuisineTypes(types: string[] | undefined, name?: string): string[] {
  if (!types && !name) return ['Restaurant'];
  
  const genericTypes = ['establishment', 'point_of_interest', 'food', 'restaurant', 'meal_delivery', 'meal_takeaway', 'store'];
  
  // Map Google Places types to cuisine labels (comprehensive list)
  const typeToCuisineMap: Record<string, string> = {
    // Service types
    meal_takeaway: 'Takeout',
    meal_delivery: 'Delivery',
    // Venue types
    cafe: 'Cafe',
    bakery: 'Bakery',
    bar: 'Bar',
    night_club: 'Nightclub',
    // Italian food types
    italian_restaurant: 'Italian',
    pizza: 'Pizza',
    // Asian food types
    chinese_restaurant: 'Chinese',
    japanese_restaurant: 'Japanese',
    sushi_restaurant: 'Japanese',
    ramen_restaurant: 'Japanese',
    korean_restaurant: 'Korean',
    vietnamese_restaurant: 'Vietnamese',
    thai_restaurant: 'Thai',
    // Other cuisines
    mexican_restaurant: 'Mexican',
    indian_restaurant: 'Indian',
    french_restaurant: 'French',
    greek_restaurant: 'Greek',
    spanish_restaurant: 'Spanish',
    german_restaurant: 'German',
    american_restaurant: 'American',
    seafood_restaurant: 'Seafood',
    steak_house: 'Steakhouse',
    steakhouse: 'Steakhouse',
    // Fast food
    fast_food_restaurant: 'Fast Food',
    // Other specific types
    ice_cream_shop: 'Ice Cream',
    donut_shop: 'Donuts',
    sandwich_shop: 'Sandwiches',
    hamburger_restaurant: 'Burgers',
    fried_chicken_restaurant: 'Chicken',
    bbq_restaurant: 'BBQ',
    barbecue_restaurant: 'BBQ',
  };

  const foundCuisines: string[] = [];
  const nameLower = name?.toLowerCase() || '';
  
  // Priority 1: Check for specific food types in name (most specific first)
  const specificFoodTypes: Array<{ keywords: string[]; label: string }> = [
    { keywords: ['cheesesteak', 'cheese steak', 'philly', 'philadelphia'], label: 'Cheesesteak' },
    { keywords: ['hot pot', 'hotpot', 'shabu', 'shabu shabu'], label: 'Hot Pot' },
    { keywords: ['pizza', 'sbarro', 'domino', 'papa john', 'papa johns', 'little caesar', 'pizza hut', 'papa murphy', 'mod pizza', 'blaze', 'pieology', 'jet\'s pizza', 'hungry howie'], label: 'Pizza' },
    { keywords: ['pho', 'phở'], label: 'Vietnamese' },
    { keywords: ['ramen', 'tonkotsu'], label: 'Ramen' },
    { keywords: ['sushi', 'sashimi', 'sashimi bar'], label: 'Sushi' },
    { keywords: ['taco', 'taqueria', 'taqueria', 'taco bell', 'del taco'], label: 'Mexican' },
    { keywords: ['burrito', 'burrito bowl', 'qdoba', 'chipotle', 'moe\'s'], label: 'Mexican' },
    { keywords: ['curry', 'tandoori', 'naan'], label: 'Indian' },
    { keywords: ['bbq', 'barbecue', 'barbeque', 'smokehouse', 'smoked', 'ribs'], label: 'BBQ' },
    { keywords: ['burger', 'hamburger', 'cheeseburger', 'shake shack', 'in-n-out', 'five guys', 'mcdonald', 'burger king', 'wendy\'s', 'white castle', 'culver\'s', 'sonic', 'whataburger', 'smashburger'], label: 'Burgers' },
    { keywords: ['wings', 'wing', 'buffalo wings', 'wingstop', 'b-dubs', 'buffalo wild wings'], label: 'Wings' },
    { keywords: ['sandwich', 'sub', 'subway', 'jimmy john', 'potbelly', 'jersey mike', 'firehouse subs', 'panera', 'mcAlister'], label: 'Sandwiches' },
    { keywords: ['deli', 'delicatessen', 'deli counter'], label: 'Deli' },
    { keywords: ['ice cream', 'gelato', 'frozen yogurt', 'froyo', 'dairy queen', 'cold stone', 'baskin robbins', 'ben & jerry'], label: 'Ice Cream' },
    { keywords: ['donut', 'doughnut', 'krispy kreme', 'dunkin', 'tim hortons'], label: 'Donuts' },
    { keywords: ['coffee', 'espresso', 'cappuccino', 'latte', 'starbucks', 'dunkin', 'peets', 'caribou', 'tim hortons', 'biggby'], label: 'Coffee' },
    { keywords: ['chicken', 'chick-fil-a', 'kfc', 'popeyes', 'raising cane', 'zaxby', 'church\'s chicken', 'bojangles'], label: 'Chicken' },
    { keywords: ['seafood', 'fish', 'lobster', 'crab', 'oyster', 'red lobster', 'long john silver'], label: 'Seafood' },
    { keywords: ['steak', 'steakhouse', 'outback', 'texas roadhouse', 'longhorn', 'ruth\'s chris'], label: 'Steakhouse' },
    { keywords: ['pasta', 'spaghetti', 'lasagna', 'olive garden', 'carrabba', 'macaroni grill'], label: 'Italian' },
    { keywords: ['chinese', 'panda express', 'pf chang', 'peiking', 'china'], label: 'Chinese' },
    { keywords: ['japanese', 'teriyaki', 'hibachi', 'benihana'], label: 'Japanese' },
    { keywords: ['korean', 'kbbq', 'korean bbq'], label: 'Korean' },
    { keywords: ['thai', 'pad thai'], label: 'Thai' },
    { keywords: ['mexican', 'chipotle', 'qdoba', 'el charro', 'hacienda'], label: 'Mexican' },
    { keywords: ['breakfast', 'pancake', 'waffle', 'ihop', 'denny', 'cracker barrel', 'bob evans', 'first watch', 'biscuit', 'omelette', 'bagel', 'einstein bros'], label: 'Breakfast' },
    { keywords: ['diner', 'coney island'], label: 'Diner' },
    { keywords: ['pub', 'tavern', 'bar & grill', 'bar and grill', 'ale house', 'brewery', 'brewing', 'taphouse'], label: 'Pub Food' },
  ];

  for (const { keywords, label } of specificFoodTypes) {
    if (keywords.some(keyword => nameLower.includes(keyword)) && !foundCuisines.includes(label)) {
      foundCuisines.push(label);
      break; // Take first specific match
    }
  }
  
  // Priority 2: Check for cuisine types in name (if no specific food type found)
  if (foundCuisines.length === 0) {
    const cuisineKeywords: Record<string, string> = {
      italian: 'Italian',
      chinese: 'Chinese',
      japanese: 'Japanese',
      mexican: 'Mexican',
      indian: 'Indian',
      thai: 'Thai',
      french: 'French',
      american: 'American',
      greek: 'Greek',
      korean: 'Korean',
      vietnamese: 'Vietnamese',
      brazilian: 'Brazilian',
      spanish: 'Spanish',
      german: 'German',
      mediterranean: 'Mediterranean',
      seafood: 'Seafood',
      steakhouse: 'Steakhouse',
      vegan: 'Vegan',
      vegetarian: 'Vegetarian',
      texas: 'American',
      texan: 'American',
      grill: 'Grill',
      sports: 'Sports Bar',
      pub: 'Pub',
      tavern: 'Tavern',
      bistro: 'Bistro',
      cafe: 'Cafe',
      diner: 'Diner',
      bar: 'Bar',
      lounge: 'Bar',
      club: 'Club', // For golf clubs etc. that serve food
      kitchen: 'American', // Generic "Kitchen" often implies American/Comfort
      house: 'American', // "Ale House", "Roadhouse"
    };

    for (const [keyword, cuisine] of Object.entries(cuisineKeywords)) {
      if (nameLower.includes(keyword) && !foundCuisines.includes(cuisine)) {
        foundCuisines.push(cuisine);
        break;
      }
    }
  }
  
  // Priority 3: Check Google Places types array
  if (types) {
    // Log types in dev mode for debugging
    if (__DEV__ && foundCuisines.length === 0) {
      console.log(`[RestaurantService] No cuisine found for "${name}". Types:`, types);
    }
    
    for (const type of types) {
      if (genericTypes.includes(type)) continue;
      
      // Direct type mapping
      if (typeToCuisineMap[type]) {
        if (!foundCuisines.includes(typeToCuisineMap[type])) {
          foundCuisines.push(typeToCuisineMap[type]);
        }
        continue;
      }
      
      // Parse compound types (e.g., "italian_restaurant" -> "Italian")
      if (type.includes('_')) {
        const parts = type.split('_');
        for (const part of parts) {
          if (part.length > 2) {
            const partLower = part.toLowerCase();
            const cuisineWords: Record<string, string> = {
              italian: 'Italian',
              chinese: 'Chinese',
              japanese: 'Japanese',
              mexican: 'Mexican',
              indian: 'Indian',
              thai: 'Thai',
              french: 'French',
              american: 'American',
              greek: 'Greek',
              korean: 'Korean',
              vietnamese: 'Vietnamese',
              spanish: 'Spanish',
              german: 'German',
              seafood: 'Seafood',
              steak: 'Steakhouse',
              pizza: 'Pizza',
              sushi: 'Sushi',
              ramen: 'Ramen',
              bbq: 'BBQ',
              barbecue: 'BBQ',
              burger: 'Burgers',
              hamburger: 'Burgers',
              chicken: 'Chicken',
              wing: 'Wings',
              sandwich: 'Sandwiches',
              deli: 'Deli',
              ice: 'Ice Cream',
              cream: 'Ice Cream',
              donut: 'Donuts',
              doughnut: 'Donuts',
              coffee: 'Coffee',
              cafe: 'Cafe',
              bakery: 'Bakery',
            };
            
            if (cuisineWords[partLower] && !foundCuisines.includes(cuisineWords[partLower])) {
              foundCuisines.push(cuisineWords[partLower]);
              break;
            }
          }
        }
      } else {
        // Handle single-word types (e.g., "pizza", "sushi", "cafe")
        const singleWordMap: Record<string, string> = {
          pizza: 'Pizza',
          sushi: 'Sushi',
          ramen: 'Ramen',
          cafe: 'Cafe',
          bakery: 'Bakery',
          bar: 'Bar',
          bbq: 'BBQ',
          burger: 'Burgers',
          chicken: 'Chicken',
          wings: 'Wings',
          sandwich: 'Sandwiches',
          deli: 'Deli',
          donut: 'Donuts',
          coffee: 'Coffee',
        };
        
        const typeLower = type.toLowerCase();
        if (singleWordMap[typeLower] && !foundCuisines.includes(singleWordMap[typeLower])) {
          foundCuisines.push(singleWordMap[typeLower]);
        }
      }
    }
  }

  // Fallback: If still no cuisine found, try to infer from name or use generic label
  if (foundCuisines.length === 0) {
    if (name) {
      const nameLower = name.toLowerCase();
      // Check for common restaurant indicators
      if (nameLower.includes('grill') || nameLower.includes('grille')) {
        foundCuisines.push('Grill');
      } else if (nameLower.includes('kitchen')) {
        foundCuisines.push('Restaurant');
      } else if (nameLower.includes('diner')) {
        foundCuisines.push('Diner');
      } else if (nameLower.includes('cafe') || nameLower.includes('coffee')) {
        foundCuisines.push('Cafe');
      } else if (nameLower.includes('bakery') || nameLower.includes('bread')) {
        foundCuisines.push('Bakery');
      } else if (nameLower.includes('bar') || nameLower.includes('pub')) {
        foundCuisines.push('Pub');
      } else {
        // Default fallback
        foundCuisines.push('Restaurant');
      }
    } else {
      foundCuisines.push('Restaurant');
    }
  }

  // Return up to 2 most relevant cuisine types
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
      // Exclude non-food establishments (movie theaters, gas stations, etc.)
      if (shouldExcludePlace(place.types, place.name)) {
        if (__DEV__) {
          console.log(`[RestaurantService] Excluding non-food place: "${place.name}" (types: ${place.types?.join(', ') || 'none'})`);
        }
        continue;
      }
      
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

