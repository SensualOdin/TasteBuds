import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Create group
router.post('/',
  [
    body('name').notEmpty().trim(),
    body('radius').optional().isFloat({ min: 0.5, max: 50 }),
    body('priceRange').optional().isArray(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, radius = 5.0, priceRange = [1, 2, 3, 4] } = req.body;

      const group = await prisma.group.create({
        data: {
          name,
          radius,
          priceRange,
          creatorId: req.userId!,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      // Add creator as first member
      await prisma.groupMember.create({
        data: {
          userId: req.userId!,
          groupId: group.id,
        },
      });

      res.status(201).json({ group });
    } catch (error) {
      console.error('Create group error:', error);
      res.status(500).json({ error: 'Failed to create group' });
    }
  }
);

// Get user's groups
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: req.userId!,
          },
        },
        isActive: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ groups });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get group details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const group = await prisma.group.findFirst({
      where: {
        id,
        members: {
          some: {
            userId: req.userId!,
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        sessions: {
          orderBy: {
            startedAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ group });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Join group with code
router.post('/join',
  [
    body('code').notEmpty().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { code } = req.body;

      const group = await prisma.group.findUnique({
        where: { code },
        include: {
          members: true,
        },
      });

      if (!group) {
        return res.status(404).json({ error: 'Invalid group code' });
      }

      if (!group.isActive) {
        return res.status(400).json({ error: 'Group is inactive' });
      }

      // Check if already a member
      const existingMember = group.members.find(m => m.userId === req.userId);
      if (existingMember) {
        return res.status(400).json({ error: 'Already a member of this group' });
      }

      // Add user to group
      await prisma.groupMember.create({
        data: {
          userId: req.userId!,
          groupId: group.id,
        },
      });

      // Return updated group
      const updatedGroup = await prisma.group.findUnique({
        where: { id: group.id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      res.json({ group: updatedGroup });
    } catch (error) {
      console.error('Join group error:', error);
      res.status(500).json({ error: 'Failed to join group' });
    }
  }
);

// Leave group
router.delete('/:id/leave', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const member = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: req.userId!,
          groupId: id,
        },
      },
    });

    if (!member) {
      return res.status(404).json({ error: 'Not a member of this group' });
    }

    await prisma.groupMember.delete({
      where: { id: member.id },
    });

    res.json({ message: 'Left group successfully' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ error: 'Failed to leave group' });
  }
});

// Update group settings (creator only)
router.patch('/:id/settings',
  [
    body('name').optional().notEmpty().trim(),
    body('radius').optional().isFloat({ min: 0.5, max: 50 }),
    body('priceRange').optional().isArray(),
    body('latitude').optional().isFloat(),
    body('longitude').optional().isFloat(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updates = req.body;

      const group = await prisma.group.findUnique({
        where: { id },
      });

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      if (group.creatorId !== req.userId) {
        return res.status(403).json({ error: 'Only group creator can update settings' });
      }

      const updatedGroup = await prisma.group.update({
        where: { id },
        data: updates,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      res.json({ group: updatedGroup });
    } catch (error) {
      console.error('Update group error:', error);
      res.status(500).json({ error: 'Failed to update group' });
    }
  }
);

export { router as groupRoutes }; 