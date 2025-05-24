import { Server, Socket } from 'socket.io';
import { supabaseAdmin } from '../config/supabase';

export const setupSessionHandlers = (io: Server, socket: Socket) => {
  socket.on('join_session', async ({ groupId }: { groupId: string }) => {
    try {
      // Verify user is member of group
      const { data: member, error: memberError } = await supabaseAdmin
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', socket.data.userId)
        .single();

      if (memberError || !member) {
        socket.emit('error', { message: 'Not a member of this group' });
        return;
      }

      // Join socket room
      socket.join(`group:${groupId}`);
      socket.data.groupId = groupId;
      
      // Get all members with user info
      const { data: allMembers, error: membersError } = await supabaseAdmin
        .from('group_members')
        .select(`
          id,
          users(
            id,
            display_name
          )
        `)
        .eq('group_id', groupId);

      if (membersError || !allMembers) {
        socket.emit('error', { message: 'Failed to get group members' });
        return;
      }
      
      io.to(`group:${groupId}`).emit('members_update', {
        total: allMembers.length,
        ready: allMembers.length, // Simplified - all joined are ready
        members: allMembers.map((m: any) => ({
          id: m.users.id,
          name: m.users.display_name,
          isReady: true,
        })),
      });

      // For simplicity, we'll consider joining as being ready to start
      // In a real app, you might want a separate ready status
      if (allMembers.length >= 2) {
        io.to(`group:${groupId}`).emit('ready_to_start', {
          memberCount: allMembers.length,
        });
      }
    } catch (error) {
      console.error('Join session error:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  });

  socket.on('leave_session', async () => {
    try {
      const groupId = socket.data.groupId;
      if (!groupId) return;

      socket.leave(`group:${groupId}`);
      socket.data.groupId = undefined;

      // Notify others that user left
      socket.to(`group:${groupId}`).emit('member_left', {
        userId: socket.data.userId,
      });
    } catch (error) {
      console.error('Leave session error:', error);
    }
  });

  socket.on('swipe', async ({ restaurantId, direction, sessionId }: { 
    restaurantId: string; 
    direction: string; 
    sessionId: string; 
  }) => {
    try {
      const userId = socket.data.userId;
      const groupId = socket.data.groupId;

      if (!groupId || !sessionId) {
        socket.emit('error', { message: 'Not in an active session' });
        return;
      }

      // Record swipe
      const { data: swipe, error: swipeError } = await supabaseAdmin
        .from('swipes')
        .insert({
          user_id: userId,
          session_id: sessionId,
          restaurant_id: restaurantId,
          direction,
        })
        .select()
        .single();

      if (swipeError) {
        socket.emit('error', { message: 'Failed to record swipe' });
        return;
      }

      // Check for matches if right swipe
      if (direction === 'right') {
        // Get all right swipes for this restaurant in this session
        const { data: rightSwipes } = await supabaseAdmin
          .from('swipes')
          .select(`
            user_id,
            users(
              id,
              display_name
            )
          `)
          .eq('session_id', sessionId)
          .eq('restaurant_id', restaurantId)
          .eq('direction', 'right');

        // Get group member count
        const { count: memberCount } = await supabaseAdmin
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', groupId);

        // Check if everyone swiped right
        if (rightSwipes && memberCount && rightSwipes.length === memberCount) {
          // Everyone swiped right - it's a match!
          const { data: match, error: matchError } = await supabaseAdmin
            .from('matches')
            .insert({
              session_id: sessionId,
              restaurant_id: restaurantId,
            })
            .select(`
              *,
              restaurants(*)
            `)
            .single();

          if (!matchError && match) {
            io.to(`group:${groupId}`).emit('match_found', {
              restaurant: match.restaurants,
              swipedBy: rightSwipes.map((s: any) => s.users),
            });

            // Check if we have 3 matches
            const { count: matchCount } = await supabaseAdmin
              .from('matches')
              .select('*', { count: 'exact', head: true })
              .eq('session_id', sessionId);

            if (matchCount && matchCount >= 3) {
              // Complete session
              await supabaseAdmin
                .from('sessions')
                .update({
                  status: 'completed',
                })
                .eq('id', sessionId);

              // Get all matches for results
              const { data: allMatches } = await supabaseAdmin
                .from('matches')
                .select(`
                  *,
                  restaurants(*)
                `)
                .eq('session_id', sessionId);

              io.to(`group:${groupId}`).emit('session_complete', {
                matches: allMatches || [],
              });
            }
          }
        }
      }

      // Broadcast swipe to group (for progress tracking)
      socket.to(`group:${groupId}`).emit('user_swiped', {
        userId,
        restaurantId,
        direction,
      });

    } catch (error) {
      console.error('Swipe error:', error);
      socket.emit('error', { message: 'Failed to record swipe' });
    }
  });

  socket.on('disconnect', async () => {
    try {
      const groupId = socket.data.groupId;
      if (!groupId) return;

      // Notify others that user disconnected
      socket.to(`group:${groupId}`).emit('member_disconnected', {
        userId: socket.data.userId,
      });
    } catch (error) {
      console.error('Disconnect cleanup error:', error);
    }
  });
}; 