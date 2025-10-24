import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/config';
import type { AuthResponse, User, Group, Session, Restaurant, Match, ApiError } from '@/types';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        if (!this.token) {
          this.token = await AsyncStorage.getItem('auth_token');
        }
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await this.clearAuth();
        }
        return Promise.reject(error);
      }
    );
  }

  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('auth_token', token);
  }

  async clearAuth() {
    this.token = null;
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
  }

  // Auth endpoints
  async register(email: string, password: string, displayName: string): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/auth/register', {
      email,
      password,
      displayName,
    });
    await this.setToken(data.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    await this.setToken(data.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
    return data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
    await this.clearAuth();
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const { data } = await this.client.get<{ user: User }>('/auth/me');
    await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
    return data;
  }

  // User endpoints
  async updateProfile(updates: Partial<User>): Promise<{ user: User }> {
    const { data } = await this.client.put<{ user: User }>('/users/profile', updates);
    await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
    return data;
  }

  async updatePreferences(preferences: {
    cuisinePreferences?: string[];
    priceRangeMin?: number;
    priceRangeMax?: number;
    distancePreference?: number;
  }): Promise<{ user: User }> {
    const { data } = await this.client.put<{ user: User }>('/users/preferences', preferences);
    await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
    return data;
  }

  // Group endpoints
  async createGroup(name: string, description?: string): Promise<{ group: Group }> {
    const { data } = await this.client.post<{ group: Group }>('/groups', {
      name,
      description,
    });
    return data;
  }

  async getGroups(): Promise<{ groups: Group[] }> {
    const { data } = await this.client.get<{ groups: Group[] }>('/groups');
    return data;
  }

  async getGroup(groupId: string): Promise<{ group: Group }> {
    const { data } = await this.client.get<{ group: Group }>(`/groups/${groupId}`);
    return data;
  }

  async joinGroup(groupId: string): Promise<{ group: Group }> {
    const { data } = await this.client.post<{ group: Group }>(`/groups/${groupId}/join`);
    return data;
  }

  async leaveGroup(groupId: string): Promise<void> {
    await this.client.delete(`/groups/${groupId}/leave`);
  }

  async updateGroupSettings(
    groupId: string,
    settings: { name?: string; description?: string; max_members?: number }
  ): Promise<{ group: Group }> {
    const { data } = await this.client.put<{ group: Group }>(
      `/groups/${groupId}/settings`,
      settings
    );
    return data;
  }

  // Session endpoints
  async startSession(params: {
    groupId: string;
    locationLat: number;
    locationLng: number;
    searchRadius?: number;
    priceRangeMin?: number;
    priceRangeMax?: number;
  }): Promise<{ session: Session }> {
    const { data } = await this.client.post<{ session: Session }>('/sessions/start', params);
    return data;
  }

  async getRestaurants(sessionId: string): Promise<{ restaurants: Restaurant[] }> {
    const { data } = await this.client.get<{ restaurants: Restaurant[] }>(
      `/sessions/${sessionId}/restaurants`
    );
    return data;
  }

  async recordSwipe(
    sessionId: string,
    restaurantId: string,
    direction: 'left' | 'right'
  ): Promise<{ swipe: any }> {
    const { data } = await this.client.post(`/sessions/${sessionId}/swipe`, {
      restaurantId,
      direction,
    });
    return data;
  }

  async getMatches(sessionId: string): Promise<{ matches: Match[] }> {
    const { data } = await this.client.get<{ matches: Match[] }>(
      `/sessions/${sessionId}/matches`
    );
    return data;
  }

  async completeSession(sessionId: string): Promise<{ session: Session }> {
    const { data } = await this.client.post<{ session: Session }>(
      `/sessions/${sessionId}/complete`
    );
    return data;
  }

  // Restaurant endpoints
  async searchRestaurants(params: {
    lat: number;
    lng: number;
    radius: number;
    priceRange?: number[];
  }): Promise<{ restaurants: Restaurant[] }> {
    const { data } = await this.client.get<{ restaurants: Restaurant[] }>(
      '/restaurants/search',
      { params }
    );
    return data;
  }

  async getRestaurant(restaurantId: string): Promise<{ restaurant: Restaurant }> {
    const { data } = await this.client.get<{ restaurant: Restaurant }>(
      `/restaurants/${restaurantId}`
    );
    return data;
  }
}

export const api = new ApiClient();
