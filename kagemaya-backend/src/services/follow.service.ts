import { prisma } from '../lib/prisma';

export const followOrganizerService = async (followerId: string, organizerId: string) => {
  if (followerId === organizerId) {
    throw new Error('Anda tidak dapat mengikuti akun Anda sendiri.');
  }

  // Check if organizer exists and is an ORGANIZER
  const organizer = await prisma.user.findUnique({
    where: { id: organizerId },
    select: { id: true, name: true, role: true },
  });

  if (!organizer) {
    throw new Error('Organizer tidak ditemukan.');
  }

  // Check if already followed
  const existing = await prisma.follow.findUnique({
    where: {
      follower_id_organizer_id: {
        follower_id: followerId,
        organizer_id: organizerId,
      },
    },
  });

  if (existing) {
    return { alreadyFollowing: true };
  }

  await prisma.follow.create({
    data: {
      follower_id: followerId,
      organizer_id: organizerId,
    },
  });

  const followersCount = await prisma.follow.count({
    where: { organizer_id: organizerId },
  });

  return { alreadyFollowing: false, followersCount };
};

export const unfollowOrganizerService = async (followerId: string, organizerId: string) => {
  const existing = await prisma.follow.findUnique({
    where: {
      follower_id_organizer_id: {
        follower_id: followerId,
        organizer_id: organizerId,
      },
    },
  });

  if (!existing) {
    throw new Error('Anda belum mengikuti organizer ini.');
  }

  await prisma.follow.delete({
    where: {
      follower_id_organizer_id: {
        follower_id: followerId,
        organizer_id: organizerId,
      },
    },
  });

  const followersCount = await prisma.follow.count({
    where: { organizer_id: organizerId },
  });

  return { followersCount };
};

export const checkFollowStatusService = async (followerId: string, organizerId: string) => {
  const [existing, followersCount] = await Promise.all([
    prisma.follow.findUnique({
      where: {
        follower_id_organizer_id: {
          follower_id: followerId,
          organizer_id: organizerId,
        },
      },
    }),
    prisma.follow.count({
      where: { organizer_id: organizerId },
    }),
  ]);

  return {
    is_following: !!existing,
    followers_count: followersCount,
  };
};

export const getOrganizerPublicProfileService = async (organizerId: string, currentUserId?: string) => {
  const organizer = await prisma.user.findUnique({
    where: { id: organizerId },
    select: {
      id: true,
      name: true,
      email: true,
      profile_picture: true,
      role: true,
      created_at: true,
      organizer_profile: {
        select: {
          organization_name: true,
          bio: true,
        },
      },
      _count: {
        select: {
          following: true, // followers of this organizer (UserOrganizers relation)
          events: true,
        },
      },
      events: {
        orderBy: { start_date: 'desc' },
        include: {
          category: true,
          ticket_types: {
            orderBy: { price: 'asc' },
            select: { price: true, available_quota: true },
          },
        },
      },
    },
  });

  if (!organizer) {
    throw new Error('Organizer tidak ditemukan');
  }

  let isFollowing = false;
  if (currentUserId) {
    const follow = await prisma.follow.findUnique({
      where: {
        follower_id_organizer_id: {
          follower_id: currentUserId,
          organizer_id: organizerId,
        },
      },
    });
    isFollowing = !!follow;
  }

  const eventsFormatted = organizer.events.map((ev) => {
    const prices = ev.ticket_types.map((t) => t.price);
    const startingPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const isSoldOut = ev.ticket_types.length > 0 && ev.ticket_types.every((t) => t.available_quota <= 0);
    const organizerName = organizer.organizer_profile?.organization_name?.trim() || organizer.name;

    return {
      id: ev.id,
      title: ev.title,
      description: ev.description,
      city: ev.city,
      location: ev.location,
      banner_url: ev.banner_url,
      start_date: ev.start_date,
      end_date: ev.end_date,
      category: ev.category,
      organizer_name: organizerName,
      starting_price: startingPrice,
      is_sold_out: isSoldOut,
    };
  });

  return {
    id: organizer.id,
    name: organizer.name,
    email: organizer.email,
    profile_picture: organizer.profile_picture,
    organization_name: organizer.organizer_profile?.organization_name || organizer.name,
    bio: organizer.organizer_profile?.bio || 'Kolektif kreatif seni dan pertunjukan visual sinematik.',
    created_at: organizer.created_at,
    followers_count: organizer._count.following,
    events_count: organizer._count.events,
    is_following: isFollowing,
    events: eventsFormatted,
  };
};

export const getOrganizerFollowersService = async (organizerId: string) => {
  const follows = await prisma.follow.findMany({
    where: { organizer_id: organizerId },
    orderBy: { created_at: 'desc' },
    include: {
      follower: {
        select: {
          id: true,
          name: true,
          email: true,
          profile_picture: true,
          role: true,
          created_at: true,
        },
      },
    },
  });

  return {
    total: follows.length,
    followers: follows.map((f) => ({
      followed_at: f.created_at,
      user: {
        id: f.follower.id,
        name: f.follower.name,
        email: f.follower.email,
        profile_picture: f.follower.profile_picture,
        role: f.follower.role,
        member_since: f.follower.created_at,
      },
    })),
  };
};
