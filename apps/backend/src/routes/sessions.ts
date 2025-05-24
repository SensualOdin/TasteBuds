import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { supabaseAdmin } from '../config/supabase';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// Start swiping session
router.post('/start',
  [
    body('groupId').notEmpty(),
    body('locationLat').isFloat(),
    body('locationLng').isFloat(),
    body('searchRadius').optional().isInt({ min: 1000, max: 50000 }),
    body('priceRangeMin').optional().isInt({ min: 1, max: 4 }),
    body('priceRangeMax').optional().isInt({ min: 1, max: 4 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        groupId, 
        locationLat, 
        locationLng, 
        searchRadius = 5000,
        priceRangeMin = 1,
        priceRangeMax = 4
      } = req.body;

      // Verify user is member of group
      const { data: member, error: memberError } = await supabaseAdmin
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', req.userId!)
        .single();

      if (memberError || !member) {
        return res.status(403).json({ error: 'Not a member of this group' });
      }

      // Create session
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('sessions')
        .insert({
          group_id: groupId,
          created_by: req.userId!,
          status: 'active',
          location_lat: locationLat,
          location_lng: locationLng,
          search_radius: searchRadius,
          price_range_min: priceRangeMin,
          price_range_max: priceRangeMax,
          max_matches: 3,
          current_matches: 0,
        })
        .select(`
          *,
          groups(
            *,
            group_members(
              id,
              role,
              users(
                id,
                email,
                display_name
              )
            )
          )
        `)
        .single();

      if (sessionError) {
        console.error('Create session error:', sessionError);
        return res.status(500).json({ error: 'Failed to start session' });
      }

      res.status(201).json({ session });
    } catch (error) {
      console.error('Start session error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get restaurants for session
router.get('/:id/restaurants', async (req: AuthRequest, res: Response) => {
  try {
    const { id: sessionId } = req.params;

    // Get session and verify user is member
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select(`
        *,
        groups!inner(
          id,
          group_members!inner(
            user_id
          )
        )
      `)
      .eq('id', sessionId)
      .eq('groups.group_members.user_id', req.userId!)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found or access denied' });
    }

    // Get restaurants user hasn't swiped on yet
    const { data: swipedRestaurants, error: swipeError } = await supabaseAdmin
      .from('swipes')
      .select('restaurant_id')
      .eq('session_id', sessionId)
      .eq('user_id', req.userId!);

    const swipedIds = swipedRestaurants?.map(s => s.restaurant_id) || [];

    // Get restaurants in the area that user hasn't swiped on
    let restaurantsQuery = supabaseAdmin
      .from('restaurants')
      .select('*')
      .gte('price_level', session.price_range_min)
      .lte('price_level', session.price_range_max)
      .order('rating', { ascending: false })
      .limit(20);

    if (swipedIds.length > 0) {
      restaurantsQuery = restaurantsQuery.not('id', 'in', `(${swipedIds.join(',')})`);
    }

    const { data: restaurants, error: restaurantError } = await restaurantsQuery;

    if (restaurantError) {
      console.error('Get restaurants error:', restaurantError);
      return res.status(500).json({ error: 'Failed to fetch restaurants' });
    }

    res.json({ restaurants: restaurants || [] });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record swipe
router.post('/:id/swipe',
  [
    body('restaurantId').notEmpty(),
    body('direction').isIn(['left', 'right']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id: sessionId } = req.params;
      const { restaurantId, direction } = req.body;

      // Verify session exists and user has access
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('sessions')
        .select(`
          *,
          groups!inner(
            group_members!inner(
              user_id
            )
          )
        `)
        .eq('id', sessionId)
        .eq('groups.group_members.user_id', req.userId!)
        .single();

      if (sessionError || !session) {
        return res.status(404).json({ error: 'Session not found or access denied' });
      }

      // Record swipe
      const { data: swipe, error: swipeError } = await supabaseAdmin
        .from('swipes')
        .insert({
          user_id: req.userId!,
          session_id: sessionId,
          restaurant_id: restaurantId,
          direction,
        })
        .select()
        .single();

      if (swipeError) {
        console.error('Record swipe error:', swipeError);
        return res.status(500).json({ error: 'Failed to record swipe' });
      }

      // If it's a right swipe, check for potential matches
      if (direction === 'right') {
        // Get all group members
        const { data: groupMembers } = await supabaseAdmin
          .from('group_members')
          .select('user_id')
          .eq('group_id', session.group_id);

        if (groupMembers) {
          // Check if all members have swiped right on this restaurant
          const { data: rightSwipes } = await supabaseAdmin
            .from('swipes')
            .select('user_id')
            .eq('session_id', sessionId)
            .eq('restaurant_id', restaurantId)
            .eq('direction', 'right');

          const rightSwipeUserIds = rightSwipes?.map(s => s.user_id) || [];
          const allMemberIds = groupMembers.map(m => m.user_id);

          // Check if all members have swiped right
          const allSwipedRight = allMemberIds.every(memberId => 
            rightSwipeUserIds.includes(memberId)
          );

          if (allSwipedRight) {
            // Create match
            const { error: matchError } = await supabaseAdmin
              .from('matches')
              .insert({
                session_id: sessionId,
                restaurant_id: restaurantId,
              });

            if (!matchError) {
              // Update session match count
              await supabaseAdmin
                .from('sessions')
                .update({ 
                  current_matches: session.current_matches + 1 
                })
                .eq('id', sessionId);
            }
          }
        }
      }

      res.json({ swipe });
    } catch (error) {
      console.error('Record swipe error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get matches for session
router.get('/:id/matches', async (req: AuthRequest, res: Response) => {
  try {
    const { id: sessionId } = req.params;

    // Verify access
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select(`
        *,
        groups!inner(
          group_members!inner(
            user_id
          )
        )
      `)
      .eq('id', sessionId)
      .eq('groups.group_members.user_id', req.userId!)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found or access denied' });
    }

    const { data: matches, error: matchError } = await supabaseAdmin
      .from('matches')
      .select(`
        *,
        restaurants(*)
      `)
      .eq('session_id', sessionId)
      .order('matched_at', { ascending: false });

    if (matchError) {
      console.error('Get matches error:', matchError);
      return res.status(500).json({ error: 'Failed to fetch matches' });
    }

    res.json({ matches: matches || [] });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete session
router.post('/:id/complete', async (req: AuthRequest, res: Response) => {
  try {
    const { id: sessionId } = req.params;

    // Verify access and that user can complete (session creator or group admin)
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select(`
        *,
        groups!inner(
          group_members!inner(
            user_id,
            role
          )
        )
      `)
      .eq('id', sessionId)
      .eq('groups.group_members.user_id', req.userId!)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found or access denied' });
    }

    const userMember = session.groups.group_members.find((m: any) => m.user_id === req.userId);
    if (session.created_by !== req.userId && userMember?.role !== 'admin') {
      return res.status(403).json({ error: 'Only session creator or group admin can complete session' });
    }

    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({ status: 'completed' })
      .eq('id', sessionId)
      .select(`
        *,
        matches(
          *,
          restaurants(*)
        )
      `)
      .single();

    if (updateError) {
      console.error('Complete session error:', updateError);
      return res.status(500).json({ error: 'Failed to complete session' });
    }

    res.json({ session: updatedSession });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as sessionRoutes }; 