import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// Start swiping session
router.post('/start',
  [
    body('groupId').notEmpty(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { groupId } = req.body;

      // Verify user is member of group
      const member = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: req.userId!,
            groupId: groupId,
          },
        },
      });

      if (!member) {
        return res.status(403).json({ error: 'Not a member of this group' });
      }

      // Create session
      const session = await prisma.session.create({
        data: { groupId },
        include: {
          group: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      res.status(201).json({ session });
    } catch (error) {
      console.error('Start session error:', error);
      res.status(500).json({ error: 'Failed to start session' });
    }
  }
);

// Get restaurants for session
router.get('/:id/restaurants', async (req: AuthRequest, res: Response) => {
  try {
    const { id: sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        group: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Verify user is member
    const isMember = session.group.members.some((m: any) => m.userId === req.userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get restaurants user hasn't swiped on yet
    const swipedRestaurantIds = await prisma.swipe.findMany({
      where: {
        sessionId,
        userId: req.userId!,
      },
      select: {
        restaurantId: true,
      },
    });

    const swipedIds = swipedRestaurantIds.map((s: any) => s.restaurantId);

    const restaurants = await prisma.restaurant.findMany({
      where: {
        id: {
          notIn: swipedIds,
        },
        priceLevel: {
          in: session.group.priceRange,
        },
      },
      take: 20,
      orderBy: {
        rating: 'desc',
      },
    });

    res.json({ restaurants });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// Record swipe
router.post('/:id/swipe',
  [
    body('restaurantId').notEmpty(),
    body('direction').isIn(['left', 'right', 'superlike']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id: sessionId } = req.params;
      const { restaurantId, direction } = req.body;

      // Record swipe
      const swipe = await prisma.swipe.create({
        data: {
          userId: req.userId!,
          sessionId,
          restaurantId,
          direction,
        },
      });

      res.json({ swipe });
    } catch (error) {
      console.error('Record swipe error:', error);
      res.status(500).json({ error: 'Failed to record swipe' });
    }
  }
);

// Get matches for session
router.get('/:id/matches', async (req: AuthRequest, res: Response) => {
  try {
    const { id: sessionId } = req.params;

    const matches = await prisma.match.findMany({
      where: { sessionId },
      include: {
        restaurant: true,
      },
      orderBy: {
        matchedAt: 'desc',
      },
    });

    res.json({ matches });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Complete session
router.post('/:id/complete', async (req: AuthRequest, res: Response) => {
  try {
    const { id: sessionId } = req.params;

    const session = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
      include: {
        matches: {
          include: {
            restaurant: true,
          },
        },
      },
    });

    res.json({ session });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

export { router as sessionRoutes }; 