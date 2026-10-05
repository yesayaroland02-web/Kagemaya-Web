import { prisma } from '../lib/prisma';

interface GetEventsParams {
  search?: string;
  category?: string;
  city?: string;
  date?: string;
  price?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export const getEventsService = async (params: GetEventsParams) => {
  const { search, category, city, date, price, sort, page = 1, limit = 6 } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  // 1. Filter Search (Judul / Kota)
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
    ];
  }

  // 2. Filter Kategori
  if (category && category !== 'all' && category !== 'Semua Kategori') {
    where.category = { slug: category };
  }

  // 3. Filter Kota
  if (city && city !== 'Semua Kota') {
    where.city = { equals: city, mode: 'insensitive' };
  }

  // 4. Filter Tanggal (Menangani "Akhir pekan" / "weekend", "Hari ini", "Minggu ini", dll)
  const now = new Date();
  if (date === 'today' || date === 'Hari ini') {
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    where.start_date = { gte: now, lte: endOfDay };
  } else if (date === 'weekend' || date === 'Akhir pekan') {
    // Menghitung hari Sabtu & Minggu terdekat
    const dayOfWeek = now.getDay();
    const distanceToSaturday = (6 - dayOfWeek + 7) % 7;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + distanceToSaturday);
    saturday.setHours(0, 0, 0, 0);

    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    sunday.setHours(23, 59, 59, 999);

    where.start_date = { gte: saturday, lte: sunday };
  } else if (date === 'this_week' || date === 'Minggu ini') {
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    where.start_date = { gte: now, lte: nextWeek };
  } else if (date === 'this_month' || date === 'Bulan ini') {
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    where.start_date = { gte: now, lte: endOfMonth };
  } else if (date === 'next_month' || date === 'Bulan depan') {
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
    where.start_date = { gte: startOfNextMonth, lte: endOfNextMonth };
  }

  // 5. Filter Harga (Menangani "Gratis" / "free")
  if (price === 'free' || price === 'Gratis') {
    where.starting_price = 0;
  } else if (price === 'under_100k' || price === '< Rp100.000') {
    where.starting_price = { lt: 100000 };
  } else if (price === '100k_500k' || price === 'Rp100.000 - Rp500.000') {
    where.starting_price = { gte: 100000, lte: 500000 };
  } else if (price === 'over_500k' || price === '> Rp500.000') {
    where.starting_price = { gt: 500000 };
  }

  // 6. Pengurutan (Menangani "Paling Populer" / "popular", "Terbaru", dll)
  let orderBy: any = { created_at: 'desc' };

  if (sort === 'popular' || sort === 'Paling Populer') {
    // Urutkan berdasarkan ketersediaan kursi / transaksi atau fallback ke created_at
    orderBy = { available_seats: 'asc' };
  } else if (sort === 'oldest' || sort === 'Terlama') {
    orderBy = { created_at: 'asc' };
  } else if (sort === 'price_asc' || sort === 'Harga Termurah') {
    orderBy = { starting_price: 'asc' };
  } else if (sort === 'price_desc' || sort === 'Harga Tertinggi') {
    orderBy = { starting_price: 'desc' };
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { category: true },
    }),
    prisma.event.count({ where }),
  ]);

  return {
    events,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCategoriesService = async () => {
  return await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
};

export const getEventByIdService = async (id: string) => {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
          profile_picture: true,
          organizer_profile: {
            select: {
              organization_name: true,
              bio: true,
            },
          },
          _count: {
            select: {
              events: true,
              following: true,
            },
          },
        },
      },
      ticket_types: {
        orderBy: { price: 'asc' },
        select: {
          id: true,
          name: true,
          price: true,
          quota: true,
          available_quota: true,
        },
      },
      vouchers: {
        where: {
          end_date: { gte: new Date() },
        },
        select: {
          id: true,
          code: true,
          discount_type: true,
          discount_value: true,
          start_date: true,
          end_date: true,
        },
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          created_at: true,
          customer: {
            select: {
              id: true,
              name: true,
              profile_picture: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      },
    },
  });

  if (!event) {
    throw new Error('Event tidak ditemukan');
  }

  const totalReviews = event.reviews.length;
  const avgRating = totalReviews > 0
    ? Number((event.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
    : 0;

  const prices = event.ticket_types.map((t) => t.price);
  const startingPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const isSoldOut = event.ticket_types.every((t) => t.available_quota <= 0);

  return {
    ...event,
    starting_price: startingPrice,
    is_sold_out: isSoldOut,
    review_stats: {
      total_reviews: totalReviews,
      average_rating: avgRating,
    },
  };
};

// Fungsi untuk mengecek kuota tiket secara presisi sebelum checkout
export const validateTicketStockService = async (ticketTypeId: string, requestedQty: number) => {
  const ticket = await prisma.ticketType.findUnique({
    where: { id: ticketTypeId },
    select: {
      id: true,
      name: true,
      price: true,
      quota: true,
      available_quota: true,
      event: {
        select: {
          id: true,
          title: true,
          start_date: true,
        },
      },
    },
  });

  if (!ticket) {
    throw new Error('Jenis tiket tidak ditemukan');
  }

  // 1. Cek apakah tiket sudah habis (Sold Out)
  if (ticket.available_quota <= 0) {
    return {
      is_available: false,
      reason: 'SOLD_OUT',
      message: `Tiket "${ticket.name}" telah habis terjual.`,
      ticket,
    };
  }

  // 2. Cek apakah jumlah tiket yang diminta melebihi sisa kuota
  if (requestedQty > ticket.available_quota) {
    return {
      is_available: false,
      reason: 'INSUFFICIENT_QUOTA',
      message: `Hanya tersisa ${ticket.available_quota} tiket untuk jenis "${ticket.name}".`,
      remaining_quota: ticket.available_quota,
      ticket,
    };
  }

  // 3. Tiket tersedia secara valid
  return {
    is_available: true,
    reason: 'AVAILABLE',
    message: 'Ketersediaan kuota tiket valid.',
    remaining_quota: ticket.available_quota,
    ticket,
  };
};