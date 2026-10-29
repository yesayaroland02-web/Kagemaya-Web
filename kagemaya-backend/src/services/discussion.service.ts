import { prisma } from '../lib/prisma';

export const getDiscussionsByEventService = async (eventId: string) => {
  // Check if event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      organizer_id: true,
    },
  });

  if (!event) {
    throw new Error('Event tidak ditemukan');
  }

  // Fetch top-level discussions (parent_id is null) with nested replies
  const discussions = await prisma.eventDiscussion.findMany({
    where: {
      event_id: eventId,
      parent_id: null,
      deleted_at: null,
    },
    orderBy: [
      { is_pinned: 'desc' },
      { created_at: 'desc' },
    ],
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          profile_picture: true,
          organizer_profile: {
            select: {
              organization_name: true,
            },
          },
        },
      },
      replies: {
        where: { deleted_at: null },
        orderBy: { created_at: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              profile_picture: true,
              organizer_profile: {
                select: {
                  organization_name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Map to structure friendly for UI
  return discussions.map((disc) => {
    const isOwner = disc.user_id === event.organizer_id || disc.user.role === 'ORGANIZER';
    return {
      id: disc.id,
      event_id: disc.event_id,
      content: disc.content,
      is_pinned: disc.is_pinned,
      created_at: disc.created_at,
      updated_at: disc.updated_at,
      is_organizer: isOwner,
      user: {
        id: disc.user.id,
        name: disc.user.organizer_profile?.organization_name || disc.user.name,
        role: disc.user.role,
        profile_picture: disc.user.profile_picture,
      },
      replies: disc.replies.map((reply) => {
        const isReplyOwner = reply.user_id === event.organizer_id || reply.user.role === 'ORGANIZER';
        return {
          id: reply.id,
          event_id: reply.event_id,
          parent_id: reply.parent_id,
          content: reply.content,
          is_pinned: reply.is_pinned,
          created_at: reply.created_at,
          updated_at: reply.updated_at,
          is_organizer: isReplyOwner,
          user: {
            id: reply.user.id,
            name: reply.user.organizer_profile?.organization_name || reply.user.name,
            role: reply.user.role,
            profile_picture: reply.user.profile_picture,
          },
        };
      }),
    };
  });
};

export const createDiscussionService = async (
  eventId: string,
  userId: string,
  content: string,
  parentId?: string
) => {
  if (!content || !content.trim()) {
    throw new Error('Konten pertanyaan atau balasan tidak boleh kosong.');
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, organizer_id: true },
  });

  if (!event) {
    throw new Error('Event tidak ditemukan');
  }

  if (parentId) {
    const parentDiscussion = await prisma.eventDiscussion.findUnique({
      where: { id: parentId },
    });
    if (!parentDiscussion || parentDiscussion.event_id !== eventId) {
      throw new Error('Diskusi induk tidak ditemukan.');
    }
  }

  const newDiscussion = await prisma.eventDiscussion.create({
    data: {
      event_id: eventId,
      user_id: userId,
      content: content.trim(),
      parent_id: parentId || null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          profile_picture: true,
          organizer_profile: {
            select: {
              organization_name: true,
            },
          },
        },
      },
    },
  });

  const isOwner = newDiscussion.user_id === event.organizer_id || newDiscussion.user.role === 'ORGANIZER';

  return {
    id: newDiscussion.id,
    event_id: newDiscussion.event_id,
    parent_id: newDiscussion.parent_id,
    content: newDiscussion.content,
    is_pinned: newDiscussion.is_pinned,
    created_at: newDiscussion.created_at,
    updated_at: newDiscussion.updated_at,
    is_organizer: isOwner,
    user: {
      id: newDiscussion.user.id,
      name: newDiscussion.user.organizer_profile?.organization_name || newDiscussion.user.name,
      role: newDiscussion.user.role,
      profile_picture: newDiscussion.user.profile_picture,
    },
    replies: [],
  };
};

export const togglePinDiscussionService = async (
  discussionId: string,
  requesterId: string
) => {
  const discussion = await prisma.eventDiscussion.findUnique({
    where: { id: discussionId },
    include: {
      event: {
        select: {
          id: true,
          organizer_id: true,
        },
      },
    },
  });

  if (!discussion) {
    throw new Error('Diskusi tidak ditemukan');
  }

  // Only the event organizer can pin/unpin
  if (discussion.event.organizer_id !== requesterId) {
    throw new Error('Hanya penyelenggara (Organizer) acara ini yang dapat menyematkan jawaban/diskusi.');
  }

  const updated = await prisma.eventDiscussion.update({
    where: { id: discussionId },
    data: {
      is_pinned: !discussion.is_pinned,
    },
  });

  return updated;
};
