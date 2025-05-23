import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma';

export const setupSessionHandlers = (io: Server, socket: Socket) => {
  socket.on('join_session', async ({ groupId }: { groupId: string }) => {
    try {
      // Verify user is member of group
      const member = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: socket.data.userId,
            groupId: groupId,
          },
        },
      });

      if (!member) {
        socket.emit('error', { message: 'Not a member of this group' });
        return;
      }

      // Join socket room
      socket.join(`group:${groupId}`);
      socket.data.groupId = groupId;
      
      // Update member ready status
      await prisma.groupMember.update({
        where: { id: member.id },
        data: { isReady: true },
      });

      // Check if all members are ready
      const allMembers = await prisma.groupMember.findMany({
        where: { groupId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const readyMembers = allMembers.filter((m: any) => m.isReady);
      
      io.to(`group:${groupId}`).emit('members_update', {
        total: allMembers.length,
        ready: readyMembers.length,
        members: allMembers.map((m: any) => ({
          id: m.user.id,
          name: m.user.name,
          isReady: m.isReady,
        })),
      });

      if (readyMembers.length === allMembers.length && allMembers.length >= 2) {
        // Start session
        const session = await prisma.session.create({
          data: { groupId },
        });

        // Update group session status
        await prisma.group.update({
          where: { id: groupId },
          data: { sessionActive: true },
        });

        io.to(`group:${groupId}`).emit('session_started', {
          sessionId: session.id,
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

      // Update member ready status
      const member = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: socket.data.userId,
            groupId: groupId,
          },
        },
      });

      if (member) {
        await prisma.groupMember.update({
          where: { id: member.id },
          data: { isReady: false },
        });
      }

      socket.leave(`group:${groupId}`);
      socket.data.groupId = undefined;

      // Notify others
      const allMembers = await prisma.groupMember.findMany({
        where: { groupId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const readyMembers = allMembers.filter((m: any) => m.isReady);

      io.to(`group:${groupId}`).emit('members_update', {
        total: allMembers.length,
        ready: readyMembers.length,
        members: allMembers.map((m: any) => ({
          id: m.user.id,
          name: m.user.name,
          isReady: m.isReady,
        })),
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
      const swipe = await prisma.swipe.create({
        data: {
          userId,
          sessionId,
          restaurantId,
          direction,
        },
      });

      // Check for matches if right or superlike
      if (direction === 'right' || direction === 'superlike') {
        const allSwipes = await prisma.swipe.findMany({
          where: {
            sessionId,
            restaurantId,
            direction: { in: ['right', 'superlike'] },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        const groupMembers = await prisma.groupMember.count({
          where: { groupId },
        });

        // Check if everyone swiped right
        if (allSwipes.length === groupMembers) {
          // Everyone swiped right - it's a match!
          const match = await prisma.match.create({
            data: {
              sessionId,
              restaurantId,
            },
            include: {
              restaurant: true,
            },
          });

          io.to(`group:${groupId}`).emit('match_found', {
            restaurant: match.restaurant,
            swipedBy: allSwipes.map((s: any) => s.user),
          });

          // Check if we have 3 matches
          const matchCount = await prisma.match.count({
            where: { sessionId },
          });

          if (matchCount >= 3) {
            // Complete session
            await prisma.session.update({
              where: { id: sessionId },
              data: {
                status: 'completed',
                completedAt: new Date(),
              },
            });

            // Update group session status
            await prisma.group.update({
              where: { id: groupId },
              data: { sessionActive: false },
            });

            // Get all matches for results
            const allMatches = await prisma.match.findMany({
              where: { sessionId },
              include: {
                restaurant: true,
              },
            });

            io.to(`group:${groupId}`).emit('session_complete', {
              matches: allMatches,
            });
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

      // Update member ready status on disconnect
      const member = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: socket.data.userId,
            groupId: groupId,
          },
        },
      });

      if (member) {
        await prisma.groupMember.update({
          where: { id: member.id },
          data: { isReady: false },
        });

        // Notify others
        const allMembers = await prisma.groupMember.findMany({
          where: { groupId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        const readyMembers = allMembers.filter((m: any) => m.isReady);

        socket.to(`group:${groupId}`).emit('members_update', {
          total: allMembers.length,
          ready: readyMembers.length,
          members: allMembers.map((m: any) => ({
            id: m.user.id,
            name: m.user.name,
            isReady: m.isReady,
          })),
        });
      }
    } catch (error) {
      console.error('Disconnect cleanup error:', error);
    }
  });
}; 