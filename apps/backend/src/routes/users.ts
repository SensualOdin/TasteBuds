import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { supabaseAdmin } from '../config/supabase';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Get user profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, display_name, avatar_url, cuisine_preferences, created_at')
      .eq('id', req.userId!)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        cuisinePreferences: user.cuisine_preferences,
        createdAt: user.created_at,
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', 
  [
    body('displayName').optional().trim(),
    body('avatarUrl').optional().isURL(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updates = req.body;

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('id', req.userId!)
        .select('id, email, display_name, avatar_url, cuisine_preferences, created_at')
        .single();

      if (error || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          cuisinePreferences: user.cuisine_preferences,
          createdAt: user.created_at,
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get user preferences
router.get('/preferences', async (req: AuthRequest, res: Response) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('cuisine_preferences')
      .eq('id', req.userId!)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ preferences: user.cuisine_preferences });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user preferences
router.put('/preferences',
  [
    body('cuisinePreferences').isArray(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { cuisinePreferences } = req.body;

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update({ cuisine_preferences: cuisinePreferences })
        .eq('id', req.userId!)
        .select('id, email, display_name, avatar_url, cuisine_preferences, created_at')
        .single();

      if (error || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          cuisinePreferences: user.cuisine_preferences,
          createdAt: user.created_at,
        }
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export { router as userRoutes }; 