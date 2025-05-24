import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { RestaurantService } from '../services/restaurantService';
import { supabaseAdmin } from '../config/supabase';

const router = Router();
const restaurantService = new RestaurantService();

// Search restaurants
router.get('/search', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      latitude, 
      longitude, 
      radius = 5000, 
      type = 'restaurant',
      priceLevel,
      cuisine 
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const restaurants = await restaurantService.searchNearby(
      parseFloat(latitude as string),
      parseFloat(longitude as string),
      parseInt(radius as string) / 1609.34, // Convert meters to miles
      priceLevel ? [parseInt(priceLevel as string)] : [1, 2, 3, 4]
    );

    res.json({ restaurants });
  } catch (error) {
    console.error('Restaurant search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get restaurant details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: restaurant, error } = await supabaseAdmin
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json({ restaurant });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as restaurantRoutes }; 