
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class ReviewError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'ReviewError';
  }
}

// Membuat review setelah event selesai
export const createReviewService = async (
  eventId: string,
  customerId: string,
  rating: number,
  comment?: string | null
) => {
  // Validasi rating
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ReviewError('Rating harus antara 1 sampai 5.', 400);
  }

  // Periksa keberadaan event
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new ReviewError('Event tidak ditemukan.', 404);
  }

  // Event harus sudah selesai
  if (event.end_date.getTime() > Date.now()) {
    throw new ReviewError(
      'Review hanya dapat diberikan setelah event selesai.',
      403
    );
  }

  // Pengguna harus memiliki transaksi yang selesai
  const transaction = await prisma.transaction.findFirst({
    where: {
      event_id: eventId,
      customer_id: customerId,
      status: 'DONE',
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  if (!transaction) {
    throw new ReviewError(
      'Anda tidak memiliki transaksi selesai untuk event ini.',
      403
    );
  }

  // Cegah review ganda untuk satu event
  const existingReview = await prisma.review.findUnique({
    where: {
      customer_id_event_id: {
        customer_id: customerId,
        event_id: eventId,
      },
    },
  });

  if (existingReview) {
    throw new ReviewError(
      'Anda sudah memberikan review untuk event ini.',
      409
    );
  }

  // Simpan review
  try {
    return await prisma.review.create({
      data: {
        event_id: eventId,
        customer_id: customerId,
        transaction_id: transaction.id,
        rating,
        comment: comment?.trim() || null,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            profile_picture: true,
          },
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ReviewError(
        'Review untuk event ini sudah tersedia.',
        409
      );
    }
    throw error;
  }
};

// Mengambil semua review berdasarkan event
export const getEventReviewsService = async (
  eventId: string,
  page: number = 1,
  limit: number = 10
) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });

  if (!event) {
    throw new ReviewError('Event tidak ditemukan.', 404);
  }

  const where = { event_id: eventId };

  const [reviews, summary] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            profile_picture: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.aggregate({
      where,
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  const total = summary._count._all;

  return {
    reviews,
    summary: {
      total,
      average_rating:
        Math.round((summary._avg.rating ?? 0) * 10) / 10,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
