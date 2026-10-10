"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyCouponsService = exports.getMyPointsService = void 0;
const prisma_1 = require("../lib/prisma");
// =========================================================
// GET MY POINTS
// =========================================================
const getMyPointsService = async (userId) => {
    const transactions = await prisma_1.prisma.pointTransaction.findMany({
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
    const balance = transactions.length > 0
        ? transactions[0].remaining_amount
        : 0;
    return {
        balance,
        history: transactions.map((item) => ({
            id: item.id,
            amount: item.amount,
            remaining_amount: item.remaining_amount,
            type: item.type,
            expires_at: item.expires_at,
            created_at: item.created_at,
            transaction: item.transaction,
        })),
    };
};
exports.getMyPointsService = getMyPointsService;
// =========================================================
// GET MY ACTIVE COUPONS
// =========================================================
const getMyCouponsService = async (userId) => {
    const now = new Date();
    const coupons = await prisma_1.prisma.coupon.findMany({
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
exports.getMyCouponsService = getMyCouponsService;
