import { Client } from '@googlemaps/google-maps-services-js';
import axios from 'axios';
import { prisma } from '../lib/prisma';

const googleMapsClient = new Client({});

export class RestaurantService {
  async searchNearby(lat: number, lng: number, radius: number, priceRange: number[]) {
    try {
      // First check if we have restaurants in our database for this area
      const existingRestaurants = await this.getExistingRestaurants(lat, lng, radius, priceRange);
      
      if (existingRestaurants.length > 10) {
        return existingRestaurants;
      }

      // Search Google Places
      const placesResponse = await googleMapsClient.placesNearby({
        params: {
          location: { lat, lng },
          radius: radius * 1609.34, // Convert miles to meters
          type: 'restaurant',
          key: process.env.GOOGLE_PLACES_API_KEY!,
        },
      });

      // Get Yelp data for cross-reference
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

      // Merge and filter data
      const restaurants = await this.mergeAndFilterRestaurants(
        placesResponse.data.results,
        yelpResponse.data.businesses,
        priceRange,
        lat,
        lng
      );

      return restaurants;
    } catch (error) {
      console.error('Restaurant search error:', error);
      
      // Fallback to existing restaurants if API fails
      const fallbackRestaurants = await this.getExistingRestaurants(lat, lng, radius, priceRange);
      return fallbackRestaurants;
    }
  }

  private async getExistingRestaurants(lat: number, lng: number, radius: number, priceRange: number[]) {
    // Calculate approximate lat/lng bounds for the radius
    const latRange = radius / 69; // Approximate miles to degrees latitude
    const lngRange = radius / (69 * Math.cos(lat * Math.PI / 180)); // Adjust for longitude

    const restaurants = await prisma.restaurant.findMany({
      where: {
        latitude: {
          gte: lat - latRange,
          lte: lat + latRange,
        },
        longitude: {
          gte: lng - lngRange,
          lte: lng + lngRange,
        },
        priceLevel: {
          in: priceRange,
        },
      },
      take: 50,
      orderBy: {
        rating: 'desc',
      },
    });

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

    for (const place of googlePlaces) {
      if (!place.rating || place.rating < 3.5) continue;
      if (!place.price_level || !priceRange.includes(place.price_level)) continue;

      // Find matching Yelp business
      const yelpMatch = yelpBusinesses.find(business => 
        this.isSameRestaurant(place.name, business.name, place.vicinity, business.location?.address1)
      );

      const photoUrls = place.photos ? 
        place.photos.slice(0, 3).map((photo: any) => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
        ) : [];

      const restaurantData = {
        placeId: place.place_id,
        yelpId: yelpMatch?.id || null,
        name: place.name,
        cuisine: this.extractCuisine(place.types, yelpMatch?.categories),
        priceLevel: place.price_level,
        rating: yelpMatch?.rating || place.rating,
        photoUrls: photoUrls,
        address: place.vicinity || yelpMatch?.location?.address1 || '',
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        phone: yelpMatch?.phone || null,
        website: yelpMatch?.url || null,
        hours: yelpMatch?.hours || null,
      };

      // Calculate distance
      const distance = this.calculateDistance(
        userLat,
        userLng,
        restaurantData.latitude,
        restaurantData.longitude
      );

      // Save to database
      try {
        const savedRestaurant = await prisma.restaurant.upsert({
          where: { placeId: place.place_id },
          update: restaurantData,
          create: restaurantData,
        });

        processedRestaurants.push({
          ...savedRestaurant,
          distance,
        });
      } catch (error) {
        console.error('Error saving restaurant:', error);
      }
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