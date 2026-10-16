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

  // 2. Filter Kategori (Mendukung ID, Slug, maupun Nama Kategori)
  if (category && category !== 'all' && category !== 'Semua Kategori') {
    where.category = {
      OR: [
        { slug: { equals: category, mode: 'insensitive' } },
        { name: { equals: category, mode: 'insensitive' } },
        { id: category },
      ],
    };
  }

  // 3. Filter Kota
  if (city && city !== 'all' && city !== 'Semua Kota') {
    where.city = { equals: city, mode: 'insensitive' };
  }

  // 4. Filter Tanggal
  const now = new Date();
  if (date && date !== 'all' && date !== 'Kapan saja') {
    if (date === 'today' || date === 'Hari ini') {
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      where.start_date = { gte: now, lte: endOfDay };
    } else if (date === 'weekend' || date === 'Akhir pekan') {
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
  }

  // 5. Filter Harga (Disesuaikan dengan Label UI Frontend)
  if (price && price !== 'all' && price !== 'Semua harga') {
    if (price === 'free' || price === 'Gratis') {
      where.starting_price = 0;
    } else if (price === 'under_100k' || price === '< Rp100.000') {
      where.starting_price = { lt: 100000 };
    } else if (price === '100k_200k' || price === 'Rp100.000 - Rp200.000') {
      where.starting_price = { gte: 100000, lte: 200000 };
    } else if (price === '100k_500k' || price === 'Rp100.000 - Rp500.000') {
      where.starting_price = { gte: 100000, lte: 500000 };
    } else if (price === 'over_500k' || price === '> Rp500.000') {
      where.starting_price = { gt: 500000 };
    }
  }

  // 6. Pengurutan (Ordering)
  let orderBy: any = { created_at: 'desc' };

  if (sort === 'popular' || sort === 'Paling Populer') {
    orderBy = { available_seats: 'asc' };
  } else if (sort === 'oldest' || sort === 'Terlama') {
    orderBy = { created_at: 'asc' };
  } else if (sort === 'price_asc' || sort === 'Harga Terendah' || sort === 'Harga Termurah') {
    orderBy = { starting_price: 'asc' };
  } else if (sort === 'price_desc' || sort === 'Harga Tertinggi') {
    orderBy = { starting_price: 'desc' };
  } else if (sort === 'newest' || sort === 'Terbaru') {
    orderBy = { created_at: 'desc' };
  }

  const [events, total] = await Promise.all([
  prisma.event.findMany({
    where,
    skip,
    take: limit,
    orderBy,
    include: {
      category: true,
      ticket_types: {
        orderBy: {
          price: 'asc',
        },
        select: {
          price: true,
        },
      },
    },
  }),
  prisma.event.count({ where }),
]);

const eventsWithStartingPrice = events.map((event) => {
  const prices = event.ticket_types.map((ticket) => Number(ticket.price));

  const startingPrice =
    prices.length > 0 ? Math.min(...prices) : null;

  return {
    ...event,
    starting_price: startingPrice,
    ticket_types: undefined,
  };
});

return {
  events: eventsWithStartingPrice,
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

export interface CreateEventInput {
  organizer_id: string;
  category_id: string;
  title: string;
  description: string;
  city: string;
  location: string;
  banner_url?: string | null;
  start_date: string | Date;
  end_date: string | Date;
  tickets: Array<{
    name: string;
    price: number;
    quota: number;
  }>;
}

export const createEventService = async (input: CreateEventInput) => {
  const {
    organizer_id,
    category_id,
    title,
    description,
    city,
    location,
    banner_url,
    start_date,
    end_date,
    tickets,
  } = input;

  const startDateObj = new Date(start_date);
  const endDateObj = new Date(end_date);

  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    throw new Error('Format tanggal mulai atau tanggal selesai tidak valid');
  }

  if (startDateObj >= endDateObj) {
    throw new Error('Tanggal selesai harus lebih lambat dari tanggal mulai');
  }

  // Cari kategori berdasarkan id, slug, atau nama
  let category = await prisma.category.findUnique({
    where: { id: category_id },
  });

  if (!category) {
    category = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: category_id },
          { name: category_id },
        ],
      },
    });
  }

  if (!category) {
    throw new Error('Kategori event tidak ditemukan');
  }

  // Hitung total kuota untuk invariant PRD Section 8.4:
  // available_seats = sum(ticket_types.quota)
  const totalAvailableSeats = tickets.reduce((sum, t) => sum + Number(t.quota), 0);

  // Jalankan dalam prisma transaction untuk konsistensi data
  const createdEvent = await prisma.$transaction(async (tx) => {
    const event = await tx.event.create({
      data: {
        organizer_id,
        category_id: category.id,
        title,
        description,
        city,
        location,
        banner_url: banner_url || null,
        start_date: startDateObj,
        end_date: endDateObj,
        available_seats: totalAvailableSeats,
        ticket_types: {
          create: tickets.map((t) => ({
            name: t.name,
            price: Number(t.price),
            quota: Number(t.quota),
            available_quota: Number(t.quota),
          })),
        },
      },
      include: {
        category: true,
        ticket_types: {
          orderBy: { price: 'asc' },
        },
      },
    });

    return event;
  });

  return createdEvent;
};

export interface UpdateEventInput {
  title?: string;
  category_id?: string;
  city?: string;
  location?: string;
  description?: string;
  start_date?: string | Date;
  end_date?: string | Date;
  banner_url?: string | null;
  tickets?: Array<{
    name: string;
    price: number;
    quota: number;
  }>;
}

export const updateEventService = async (
  eventId: string,
  organizerId: string,
  input: UpdateEventInput
) => {
  const existingEvent = await prisma.event.findUnique({
    where: { id: eventId },
    include: { ticket_types: true },
  });

  if (!existingEvent) {
    throw new Error('Event tidak ditemukan');
  }

  if (existingEvent.organizer_id !== organizerId) {
    throw new Error('Akses ditolak. Anda bukan penyelenggara event ini.');
  }

  let finalCategoryId = existingEvent.category_id;
  if (input.category_id && input.category_id !== existingEvent.category_id) {
    let category = await prisma.category.findUnique({
      where: { id: input.category_id },
    });
    if (!category) {
      category = await prisma.category.findFirst({
        where: {
          OR: [
            { slug: input.category_id },
            { name: input.category_id },
          ],
        },
      });
    }
    if (category) {
      finalCategoryId = category.id;
    }
  }

  const startDateObj = input.start_date
    ? new Date(input.start_date)
    : existingEvent.start_date;
  const endDateObj = input.end_date
    ? new Date(input.end_date)
    : existingEvent.end_date;

  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    throw new Error('Format tanggal mulai atau selesai tidak valid');
  }

  if (startDateObj >= endDateObj) {
    throw new Error('Tanggal selesai harus lebih lambat dari tanggal mulai');
  }

  return await prisma.$transaction(async (tx) => {
    let newAvailableSeats = existingEvent.available_seats;

    if (input.tickets && Array.isArray(input.tickets) && input.tickets.length > 0) {
      // Re-calculate PRD Section 8.4 invariant: available_seats = sum(quota)
      newAvailableSeats = input.tickets.reduce(
        (sum, t) => sum + Number(t.quota),
        0
      );

      // Re-create updated ticket tiers
      await tx.ticketType.deleteMany({
        where: { event_id: eventId },
      });

      await tx.ticketType.createMany({
        data: input.tickets.map((t) => ({
          event_id: eventId,
          name: t.name,
          price: Number(t.price),
          quota: Number(t.quota),
          available_quota: Number(t.quota),
        })),
      });
    }

    const updatedEvent = await tx.event.update({
      where: { id: eventId },
      data: {
        title: input.title ?? existingEvent.title,
        description: input.description ?? existingEvent.description,
        city: input.city ?? existingEvent.city,
        location: input.location ?? existingEvent.location,
        category_id: finalCategoryId,
        banner_url:
          input.banner_url !== undefined
            ? input.banner_url
            : existingEvent.banner_url,
        start_date: startDateObj,
        end_date: endDateObj,
        available_seats: newAvailableSeats,
      },
      include: {
        category: true,
        ticket_types: {
          orderBy: { price: 'asc' },
        },
      },
    });

    return updatedEvent;
  });
};

export interface CreateVoucherInput {
  code: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  start_date?: string | Date;
  end_date: string | Date;
}

export const createEventVoucherService = async (
  eventId: string,
  organizerId: string,
  input: CreateVoucherInput
) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error('Event tidak ditemukan');
  }

  if (event.organizer_id !== organizerId) {
    throw new Error('Akses ditolak. Anda bukan penyelenggara event ini.');
  }

  const cleanCode = input.code.trim().toUpperCase().replace(/\s+/g, '');
  if (!cleanCode) {
    throw new Error('Kode voucher wajib diisi');
  }

  // Check duplicate voucher code for this event
  const existingVoucher = await prisma.voucher.findFirst({
    where: {
      event_id: eventId,
      code: cleanCode,
    },
  });

  if (existingVoucher) {
    throw new Error(`Kode voucher "${cleanCode}" sudah digunakan untuk event ini.`);
  }

  const discountType =
    input.discount_type.toUpperCase() === 'FIXED' ? 'FIXED' : 'PERCENT';
  const discountValue = Number(input.discount_value);

  if (isNaN(discountValue) || discountValue <= 0) {
    throw new Error('Besaran diskon harus lebih dari 0');
  }

  if (discountType === 'PERCENT' && discountValue > 100) {
    throw new Error('Diskon persentase tidak boleh lebih dari 100%');
  }

  const startDateObj = input.start_date ? new Date(input.start_date) : new Date();
  const endDateObj = new Date(input.end_date);

  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    throw new Error('Format tanggal voucher tidak valid');
  }

  if (startDateObj >= endDateObj) {
    throw new Error('Masa berlaku voucher (tanggal selesai) harus lebih lambat dari tanggal mulai');
  }

  const voucher = await prisma.voucher.create({
    data: {
      event_id: eventId,
      code: cleanCode,
      discount_type: discountType as any,
      discount_value: discountValue,
      start_date: startDateObj,
      end_date: endDateObj,
    },
  });

  return voucher;
};

export const getEventVouchersService = async (
  eventId: string,
  organizerId: string
) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error('Event tidak ditemukan');
  }

  if (event.organizer_id !== organizerId) {
    throw new Error('Akses ditolak. Anda bukan penyelenggara event ini.');
  }

  return await prisma.voucher.findMany({
    where: { event_id: eventId },
    orderBy: { created_at: 'desc' },
  });
};

export const getMyOrganizerEventsService = async (organizerId: string) => {
  const events = await prisma.event.findMany({
    where: { organizer_id: organizerId },
    orderBy: { created_at: 'desc' },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
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
        select: {
          id: true,
          code: true,
          discount_type: true,
          discount_value: true,
          used_count: true,
          start_date: true,
          end_date: true,
        },
      },
      _count: {
        select: {
          transactions: true,
          reviews: true,
        },
      },
    },
  });

  return events.map((event) => {
    const prices = event.ticket_types.map((t) => t.price);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    return {
      ...event,
      starting_price: minPrice,
      status: 'PUBLISHED',
    };
  });
};
