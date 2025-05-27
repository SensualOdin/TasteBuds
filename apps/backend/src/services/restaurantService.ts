import { Client } from '@googlemaps/google-maps-services-js';
import axios from 'axios';
import { supabaseAdmin } from '../config/supabase';
import { GOOGLE_CONFIG } from '../config/google';

const googleMapsClient = new Client({});

export class RestaurantService {
  async searchNearby(lat: number, lng: number, radius: number, priceRange: number[]) {
    try {
      console.log('🔍 Restaurant search started:', { lat, lng, radius, priceRange });
      
      // First check if we have restaurants in our database for this area
      const existingRestaurants = await this.getExistingRestaurants(lat, lng, radius, priceRange);
      console.log('📊 Existing restaurants found:', existingRestaurants.length);
      
      if (existingRestaurants.length > 10) {
        console.log('✅ Returning existing restaurants from database');
        return existingRestaurants;
      }

      // Use new Places API (Text Search) instead of deprecated nearby search
      console.log('🌐 Fetching from Google Places API...');
      const placesResponse = await this.searchWithNewPlacesAPI(lat, lng, radius);
      console.log('📍 Google Places API returned:', placesResponse.length, 'places');

      // Get Yelp data for cross-reference if API key is available
      let yelpBusinesses = [];
      if (process.env.YELP_API_KEY) {
        try {
          const yelpResponse = await axios.get('https://api.yelp.com/v3/businesses/search', {
            headers: {
              Authorization: `Bearer ${process.env.YELP_API_KEY}`,
            },
            params: {
              latitude: lat,
              longitude: lng,
              radius: Math.round(radius * 1609.34),
              categories: 'restaurants',
              limit: 50,
            },
          });
          yelpBusinesses = yelpResponse.data.businesses;
        } catch (yelpError) {
          console.log('Yelp API not available, continuing with Google Places only');
        }
      }

      // Merge and filter data
      console.log('🔄 Processing and filtering restaurants...');
      const restaurants = await this.mergeAndFilterRestaurants(
        placesResponse,
        yelpBusinesses,
        priceRange,
        lat,
        lng
      );
      console.log('✅ Final processed restaurants:', restaurants.length);

      return restaurants;
    } catch (error) {
      console.error('Restaurant search error:', error);
      
      // Fallback to existing restaurants if API fails
      const fallbackRestaurants = await this.getExistingRestaurants(lat, lng, radius, priceRange);
      return fallbackRestaurants;
    }
  }

  private async searchWithNewPlacesAPI(lat: number, lng: number, radiusMiles: number) {
    const radiusMeters = radiusMiles * 1609.34;
    
    try {
      // Use the new Places API Nearby Search as documented
      const response = await axios.post(
        'https://places.googleapis.com/v1/places:searchNearby',
        {
          includedTypes: ['restaurant'],
          locationRestriction: {
            circle: {
              center: {
                latitude: lat,
                longitude: lng
              },
              radius: radiusMeters
            }
          },
          maxResultCount: 20,
          languageCode: 'en'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_CONFIG.API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.photos,places.types,places.websiteUri,places.nationalPhoneNumber,places.regularOpeningHours,places.reviews,places.editorialSummary'
          }
        }
      );

      return response.data.places || [];
    } catch (newApiError) {
      console.log('New Places API failed, trying legacy fallback...');
      
      // Fallback to legacy API if new one fails
      try {
        const legacyResponse = await googleMapsClient.placesNearby({
          params: {
            location: { lat, lng },
            radius: radiusMeters,
            type: 'restaurant',
            key: GOOGLE_CONFIG.API_KEY,
          },
        });
        return legacyResponse.data.results;
      } catch (legacyError) {
        console.error('Both new and legacy Places API failed:', legacyError);
        throw legacyError;
      }
    }
  }

  private async getExistingRestaurants(lat: number, lng: number, radius: number, priceRange: number[]) {
    // Calculate approximate lat/lng bounds for the radius
    const latRange = radius / 69; // Approximate miles to degrees latitude
    const lngRange = radius / (69 * Math.cos(lat * Math.PI / 180)); // Adjust for longitude

    const { data: restaurants, error } = await supabaseAdmin
      .from('restaurants')
      .select('*')
      .gte('latitude', lat - latRange)
      .lte('latitude', lat + latRange)
      .gte('longitude', lng - lngRange)
      .lte('longitude', lng + lngRange)
      .in('price_level', priceRange)
      .order('rating', { ascending: false })
      .limit(50);

    if (error || !restaurants) {
      console.error('Error fetching restaurants:', error);
      return [];
    }

    return restaurants.map(restaurant => ({
      ...restaurant,
      distance: this.calculateDistance(lat, lng, restaurant.latitude, restaurant.longitude),
    }));
  }

  private async mergeAndFilterRestaurants(
    googlePlaces: any[],
    yelpBusinesses: any[],
    priceRange: number[],
    userLat: number,
    userLng: number
  ) {
    const processedRestaurants = [];

    console.log('🔄 Processing places:', googlePlaces.length);

    for (const place of googlePlaces) {
      // Handle both new API format and legacy format
      const isNewApiFormat = place.displayName && place.location;
      
      const rating = isNewApiFormat ? place.rating : place.rating;
      const rawPriceLevel = isNewApiFormat ? place.priceLevel : place.price_level;
      const name = isNewApiFormat ? place.displayName?.text : place.name;
      const address = isNewApiFormat ? place.formattedAddress : place.vicinity;
      const lat = isNewApiFormat ? place.location?.latitude : place.geometry?.location?.lat;
      const lng = isNewApiFormat ? place.location?.longitude : place.geometry?.location?.lng;
      const placeId = isNewApiFormat ? place.id : place.place_id;
      const types = place.types || [];
      
      // Convert new API price level format to numeric
      let priceLevel = 2; // default to moderate
      if (isNewApiFormat && rawPriceLevel) {
        switch (rawPriceLevel) {
          case 'PRICE_LEVEL_FREE': priceLevel = 0; break;
          case 'PRICE_LEVEL_INEXPENSIVE': priceLevel = 1; break;
          case 'PRICE_LEVEL_MODERATE': priceLevel = 2; break;
          case 'PRICE_LEVEL_EXPENSIVE': priceLevel = 3; break;
          case 'PRICE_LEVEL_VERY_EXPENSIVE': priceLevel = 4; break;
          default: priceLevel = 2;
        }
      } else if (!isNewApiFormat && rawPriceLevel) {
        priceLevel = rawPriceLevel;
      }
      
      console.log(`🔍 Processing ${name}: rating=${rating}, priceLevel=${priceLevel} (raw: ${rawPriceLevel}), isNewFormat=${isNewApiFormat}`);
      
      if (!rating || rating < 3.5) {
        console.log(`❌ Filtered out ${name}: rating too low (${rating})`);
        continue;
      }
      if (priceLevel && !priceRange.includes(priceLevel)) {
        console.log(`❌ Filtered out ${name}: price level ${priceLevel} not in ${priceRange}`);
        continue;
      }

      // Find matching Yelp business
      const yelpMatch = yelpBusinesses.find(business => 
        this.isSameRestaurant(name, business.name, address, business.location?.address1)
      );

      let photoUrls = [];
      if (place.photos && place.photos.length > 0) {
        if (isNewApiFormat) {
          // New API format: use the photo name to construct URL
          photoUrls = place.photos.slice(0, 3).map((photo: any) => 
            `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=400&key=${GOOGLE_CONFIG.API_KEY}`
          );
        } else {
          // Legacy API format
          photoUrls = place.photos.slice(0, 3).map((photo: any) => 
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_CONFIG.API_KEY}`
          );
        }
      }

      const restaurantData = {
        placeId: placeId,
        yelpId: yelpMatch?.id || null,
        name: name,
        cuisine: this.extractCuisine(types, yelpMatch?.categories),
        priceLevel: priceLevel || 2, // Default to $$ if not specified
        rating: yelpMatch?.rating || rating,
        userRatingCount: isNewApiFormat ? place.userRatingCount : null,
        photoUrls: photoUrls,
        address: address || yelpMatch?.location?.address1 || '',
        latitude: lat,
        longitude: lng,
        phone: isNewApiFormat ? place.nationalPhoneNumber : (yelpMatch?.phone || null),
        website: isNewApiFormat ? place.websiteUri : (yelpMatch?.url || null),
        hours: isNewApiFormat ? place.regularOpeningHours : (yelpMatch?.hours || null),
        reviews: isNewApiFormat ? place.reviews : null,
        editorialSummary: isNewApiFormat ? place.editorialSummary?.text : null,
      };

      // Calculate distance
      const distance = this.calculateDistance(
        userLat,
        userLng,
        restaurantData.latitude,
        restaurantData.longitude
      );

      // Calculate distance
      const calculatedDistance = this.calculateDistance(
        userLat,
        userLng,
        restaurantData.latitude,
        restaurantData.longitude
      );

      // For now, skip database save and return data directly to test API
      console.log(`✅ Successfully processed: ${name}`);
      processedRestaurants.push({
        ...restaurantData,
        distance: calculatedDistance,
      });
    }

    // Sort by distance and rating
    return processedRestaurants
      .sort((a, b) => {
        const aScore = (a.rating * 0.7) + ((5 - a.distance) * 0.3);
        const bScore = (b.rating * 0.7) + ((5 - b.distance) * 0.3);
        return bScore - aScore;
      })
      .slice(0, 30);
  }

  private isSameRestaurant(name1: string, name2: string, address1: string, address2: string): boolean {
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedName1 = normalize(name1);
    const normalizedName2 = normalize(name2);
    
    // Check if names are similar (80% match)
    const nameMatch = this.calculateSimilarity(normalizedName1, normalizedName2) > 0.8;
    
    // Check if addresses contain similar street names
    const addressMatch = address1 && address2 && 
      (address1.toLowerCase().includes(address2.toLowerCase().split(' ')[0]) ||
       address2.toLowerCase().includes(address1.toLowerCase().split(' ')[0]));
    
    return nameMatch || !!addressMatch;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private extractCuisine(googleTypes: string[], yelpCategories?: any[]): string[] {
    const cuisineMap: { [key: string]: string } = {
      'american_restaurant': 'American',
      'chinese_restaurant': 'Chinese',
      'italian_restaurant': 'Italian',
      'mexican_restaurant': 'Mexican',
      'japanese_restaurant': 'Japanese',
      'indian_restaurant': 'Indian',
      'thai_restaurant': 'Thai',
      'french_restaurant': 'French',
      'mediterranean_restaurant': 'Mediterranean',
      'korean_restaurant': 'Korean',
      'vietnamese_restaurant': 'Vietnamese',
      'greek_restaurant': 'Greek',
      'spanish_restaurant': 'Spanish',
      'turkish_restaurant': 'Turkish',
    };

    const cuisines = new Set<string>();

    // Extract from Google Places types
    googleTypes?.forEach(type => {
      if (cuisineMap[type]) {
        cuisines.add(cuisineMap[type]);
      }
    });

    // Extract from Yelp categories
    yelpCategories?.forEach(category => {
      if (category.title && category.title !== 'Restaurants') {
        cuisines.add(category.title);
      }
    });

    return cuisines.size > 0 ? Array.from(cuisines) : ['Restaurant'];
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in miles
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
} 