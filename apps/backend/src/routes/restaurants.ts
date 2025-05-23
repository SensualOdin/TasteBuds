import { Router, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { RestaurantService } from '../services/restaurantService';

const router = Router();
const restaurantService = new RestaurantService();

router.use(authenticateToken);

// Search nearby restaurants
router.get('/search',
  [
    query('lat').isFloat(),
    query('lng').isFloat(),
    query('radius').optional().isFloat({ min: 0.5, max: 50 }),
    query('priceRange').optional(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { lat, lng, radius = 5, priceRange = '1,2,3,4' } = req.query;
      const priceArray = String(priceRange).split(',').map(Number);

      const restaurants = await restaurantService.searchNearby(
        Number(lat),
        Number(lng),
        Number(radius),
        priceArray
      );

      res.json({ restaurants });
    } catch (error) {
      console.error('Search restaurants error:', error);
      res.status(500).json({ error: 'Failed to search restaurants' });
    }
  }
);

// Get restaurant details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json({ restaurant });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

export { router as restaurantRoutes }; 