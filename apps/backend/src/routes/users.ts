import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Get user profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        dietaryPrefs: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.patch('/profile',
  [
    body('name').optional().notEmpty().trim(),
    body('avatarUrl').optional().isURL(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updates = req.body;

      const user = await prisma.user.update({
        where: { id: req.userId! },
        data: updates,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          dietaryPrefs: true,
          createdAt: true,
        },
      });

      res.json({ user });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Get user preferences
router.get('/preferences', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        dietaryPrefs: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ preferences: user.dietaryPrefs });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update user preferences
router.patch('/preferences',
  [
    body('dietaryPrefs').isArray(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { dietaryPrefs } = req.body;

      const user = await prisma.user.update({
        where: { id: req.userId! },
        data: { dietaryPrefs },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          dietaryPrefs: true,
          createdAt: true,
        },
      });

      res.json({ user });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  }
);

export { router as userRoutes }; 