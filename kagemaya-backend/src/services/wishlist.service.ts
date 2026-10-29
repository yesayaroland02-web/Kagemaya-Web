import { prisma } from '../lib/prisma';

export const addWishlistService = async (customerId: string, eventId: string) => {
  // Check if event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true },
  });

  if (!event) {
    throw new Error('Event tidak ditemukan');
  }

  // Upsert or find existing
  const existing = await prisma.wishlist.findUnique({
    where: {
      customer_id_event_id: {
        customer_id: customerId,
        event_id: eventId,
      },
    },
  });

  if (existing) {
    return { wishlist: existing, alreadyExists: true };
  }

  const wishlist = await prisma.wishlist.create({
    data: {
      customer_id: customerId,
      event_id: eventId,
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          city: true,
          start_date: true,
          banner_url: true,
        },
      },
    },
  });

  return { wishlist, alreadyExists: false };
};

export const removeWishlistService = async (customerId: string, eventId: string) => {
  const existing = await prisma.wishlist.findUnique({
    where: {
      customer_id_event_id: {
        customer_id: customerId,
        event_id: eventId,
      },
    },
  });

  if (!existing) {
    throw new Error('Event belum ada di dalam wishlist Anda.');
  }

  await prisma.wishlist.delete({
    where: {
      customer_id_event_id: {
        customer_id: customerId,
        event_id: eventId,
      },
    },
  });

  return true;
};

export const getUserWishlistsService = async (customerId: string) => {
  const wishlists = await prisma.wishlist.findMany({
    where: { customer_id: customerId },
    orderBy: { created_at: 'desc' },
    include: {
      event: {
        include: {
          category: true,
          organizer: {
            select: {
              name: true,
              organizer_profile: {
                select: {
                  organization_name: true,
                },
              },
            },
          },
          ticket_types: {
            orderBy: { price: 'asc' },
            select: { price: true, available_quota: true },
          },
        },
      },
    },
  });

  return wishlists.map((w) => {
    const prices = w.event.ticket_types.map((t) => t.price);
    const startingPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const isSoldOut = w.event.ticket_types.length > 0 && w.event.ticket_types.every((t) => t.available_quota <= 0);
    const organizerName =
      w.event.organizer.organizer_profile?.organization_name?.trim() || w.event.organizer.name;

    return {
      id: w.id,
      created_at: w.created_at,
      event: {
        id: w.event.id,
        title: w.event.title,
        description: w.event.description,
        city: w.event.city,
        location: w.event.location,
        banner_url: w.event.banner_url,
        start_date: w.event.start_date,
        end_date: w.event.end_date,
        category: w.event.category,
        organizer_name: organizerName,
        starting_price: startingPrice,
        is_sold_out: isSoldOut,
      },
    };
  });
};

export const checkWishlistStatusService = async (customerId: string, eventId: string) => {
  const existing = await prisma.wishlist.findUnique({
    where: {
      customer_id_event_id: {
        customer_id: customerId,
        event_id: eventId,
      },
    },
  });

  return { is_wishlisted: !!existing };
};
