import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { supabaseAdmin } from '../config/supabase';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Create group
router.post('/',
  [
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description } = req.body;

      // Create the group
      const { data: group, error: groupError } = await supabaseAdmin
        .from('groups')
        .insert({
          name,
          description,
          created_by: req.userId!,
          is_active: true,
          max_members: 8,
        })
        .select()
        .single();

      if (groupError) {
        console.error('Create group error:', groupError);
        return res.status(500).json({ error: 'Failed to create group' });
      }

      // Add creator as first member
      const { error: memberError } = await supabaseAdmin
        .from('group_members')
        .insert({
          user_id: req.userId!,
          group_id: group.id,
          role: 'admin',
        });

      if (memberError) {
        console.error('Add member error:', memberError);
        return res.status(500).json({ error: 'Failed to add creator as member' });
      }

      // Fetch the complete group with members
      const { data: completeGroup, error: fetchError } = await supabaseAdmin
        .from('groups')
        .select(`
          *,
          group_members!inner(
            id,
            role,
            joined_at,
            users!inner(
              id,
              email,
              display_name,
              avatar_url
            )
          )
        `)
        .eq('id', group.id)
        .single();

      if (fetchError) {
        console.error('Fetch group error:', fetchError);
        return res.status(500).json({ error: 'Failed to fetch created group' });
      }

      res.status(201).json({ group: completeGroup });
    } catch (error) {
      console.error('Create group error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get user's groups
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { data: groups, error } = await supabaseAdmin
      .from('groups')
      .select(`
        *,
        group_members!inner(
          id,
          role,
          joined_at,
          users!inner(
            id,
            email,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('group_members.user_id', req.userId!)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get groups error:', error);
      return res.status(500).json({ error: 'Failed to fetch groups' });
    }

    res.json({ groups: groups || [] });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get group details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // First check if user is a member
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', id)
      .eq('user_id', req.userId!)
      .single();

    if (membershipError || !membership) {
      return res.status(404).json({ error: 'Group not found or access denied' });
    }

    // Fetch group details with members
    const { data: group, error } = await supabaseAdmin
      .from('groups')
      .select(`
        *,
        group_members(
          id,
          role,
          joined_at,
          users(
            id,
            email,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ group });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join group by ID (simplified - no codes for now)
router.post('/:id/join', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if group exists and is active
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('id, is_active, max_members')
      .eq('id', id)
      .single();

    if (groupError || !group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.is_active) {
      return res.status(400).json({ error: 'Group is inactive' });
    }

    // Check if already a member
    const { data: existingMember } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', id)
      .eq('user_id', req.userId!)
      .single();

    if (existingMember) {
      return res.status(400).json({ error: 'Already a member of this group' });
    }

    // Check member count
    const { count: memberCount } = await supabaseAdmin
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', id);

    if (memberCount && memberCount >= group.max_members) {
      return res.status(400).json({ error: 'Group is full' });
    }

    // Add user to group
    const { error: joinError } = await supabaseAdmin
      .from('group_members')
      .insert({
        user_id: req.userId!,
        group_id: id,
        role: 'member',
      });

    if (joinError) {
      console.error('Join group error:', joinError);
      return res.status(500).json({ error: 'Failed to join group' });
    }

    // Return updated group
    const { data: updatedGroup, error: fetchError } = await supabaseAdmin
      .from('groups')
      .select(`
        *,
        group_members(
          id,
          role,
          joined_at,
          users(
            id,
            email,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(500).json({ error: 'Failed to fetch updated group' });
    }

    res.json({ group: updatedGroup });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leave group
router.delete('/:id/leave', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: member, error: memberError } = await supabaseAdmin
      .from('group_members')
      .select('id, role')
      .eq('group_id', id)
      .eq('user_id', req.userId!)
      .single();

    if (memberError || !member) {
      return res.status(404).json({ error: 'Not a member of this group' });
    }

    // Don't allow group creator to leave (they should transfer ownership or delete group)
    if (member.role === 'admin') {
      return res.status(400).json({ error: 'Group creator cannot leave. Transfer ownership or delete the group.' });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('group_members')
      .delete()
      .eq('id', member.id);

    if (deleteError) {
      console.error('Leave group error:', deleteError);
      return res.status(500).json({ error: 'Failed to leave group' });
    }

    res.json({ message: 'Left group successfully' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update group settings (admin only)
router.put('/:id/settings',
  [
    body('name').optional().notEmpty().trim(),
    body('description').optional().trim(),
    body('max_members').optional().isInt({ min: 2, max: 20 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updates = req.body;

      // Check if user is group admin
      const { data: member, error: memberError } = await supabaseAdmin
        .from('group_members')
        .select('role')
        .eq('group_id', id)
        .eq('user_id', req.userId!)
        .single();

      if (memberError || !member || member.role !== 'admin') {
        return res.status(403).json({ error: 'Only group admins can update settings' });
      }

      const { data: updatedGroup, error: updateError } = await supabaseAdmin
        .from('groups')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          group_members(
            id,
            role,
            joined_at,
            users(
              id,
              email,
              display_name,
              avatar_url
            )
          )
        `)
        .single();

      if (updateError) {
        console.error('Update group error:', updateError);
        return res.status(500).json({ error: 'Failed to update group' });
      }

      res.json({ group: updatedGroup });
    } catch (error) {
      console.error('Update group error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export { router as groupRoutes }; 