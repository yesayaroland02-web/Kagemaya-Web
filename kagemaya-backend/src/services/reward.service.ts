import { prisma } from '../lib/prisma';

// =========================================================
// GET MY POINTS
// =========================================================

export const getMyPointsService = async (
  userId: string
) => {
  const transactions =
    await prisma.pointTransaction.findMany({
      where: {
        user_id: userId,
      },

      orderBy: {
        created_at: 'desc',
      },

      include: {
        transaction: {
          select: {
            id: true,
            final_price: true,
            created_at: true,
          },
        },
      },
    });

  // -------------------------------------------------------
  // Saldo poin
  //
  // remaining_amount merupakan saldo setelah transaksi.
  // Karena transaksi diurutkan terbaru -> terlama,
  // transaksi pertama adalah saldo terbaru.
  // -------------------------------------------------------

  const balance =
    transactions.length > 0
      ? transactions[0].remaining_amount
      : 0;

  return {
    balance,

    history: transactions.map((item) => ({
      id: item.id,

      amount: item.amount,

      remaining_amount:
        item.remaining_amount,

      type: item.type,

      expires_at:
        item.expires_at,

      created_at:
        item.created_at,

      transaction:
        item.transaction,
    })),
  };
};

// =========================================================
// GET MY ACTIVE COUPONS
// =========================================================

export const getMyCouponsService = async (
  userId: string
) => {
  const now = new Date();

  const coupons =
    await prisma.coupon.findMany({
      where: {
        user_id: userId,

        is_used: false,

        expires_at: {
          gte: now,
        },
      },

      orderBy: {
        expires_at: 'asc',
      },

      select: {
        id: true,
        discount_amount: true,
        expires_at: true,
        is_used: true,
        created_at: true,
      },
    });

  return coupons;
};