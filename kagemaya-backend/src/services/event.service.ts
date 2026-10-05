import { prisma } from '../lib/prisma';

interface GetEventsParams {
  search?: string;
  category?: string;
  city?: string;
  page?: number;
  limit?: number;
}

export const getEventsService = async (params: GetEventsParams) => {
  const { search, category, city, page = 1, limit = 8 } = params;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  // 1. Bangun filter klausa WHERE dinamis
  const where: any = {};

  // Filter Search (Judul atau Deskripsi)
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Filter Kategori (berdasarkan slug kategori, mis. 'film-4d')
  if (category && category !== 'all') {
    where.category = {
      slug: category,
    };
  }

  // Filter Kota (mis. 'Jakarta', 'Bandung')
  if (city) {
    where.city = {
      contains: city,
      mode: 'insensitive',
    };
  }

  // 2. Eksekusi query data & total data secara paralel
  const [total, events] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { start_date: 'asc' }, // Urutkan dari event terdekat
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        organizer: {
          select: {
            id: true,
            name: true,
            organizer_profile: {
              select: { organization_name: true },
            },
          },
        },
        ticket_types: {
          select: {
            id: true,
            name: true,
            price: true,
            available_quota: true,
          },
        },
      },
    }),
  ]);

  // 3. Format data agar memudahkan frontend (hitung harga tiket termurah)
  const formattedEvents = events.map((ev) => {
    const prices = ev.ticket_types.map((t) => t.price);
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const isSoldOut = ev.ticket_types.every((t) => t.available_quota <= 0);

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
      organizer_name: ev.organizer.organizer_profile?.organization_name || ev.organizer.name,
      starting_price: lowestPrice,
      is_sold_out: isSoldOut,
    };
  });

  return {
    events: formattedEvents,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

export const getCategoriesService = async () => {
  return await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });
};