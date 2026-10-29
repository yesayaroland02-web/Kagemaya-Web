"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectTransactionService = exports.acceptTransactionService = exports.getOrganizerTransactionsService = exports.autoExpireOldTransactionsService = exports.cancelTransactionService = exports.rollbackTransactionCore = exports.uploadPaymentProofService = exports.getUserTransactionsService = exports.getTransactionByIdService = exports.createTransactionService = exports.calculateCheckoutPriceService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const cloudinary_1 = require("../config/cloudinary");
// =========================================================
// 1. CALCULATION ENGINE (DRY RUN / PREVIEW)
// Total Bayar = (Harga Tiket - Diskon Voucher - Diskon Kupon) - Poin
// =========================================================
const calculateCheckoutPriceService = async (userId, input) => {
    const { event_id, items, voucher_code, coupon_id, points_used = 0 } = input;
    if (!items || items.length === 0) {
        throw new Error('Pilih minimal satu tiket.');
    }
    // 1. Ambil data tiket
    const ticketIds = items.map((i) => i.ticket_type_id);
    const ticketTypes = await prisma_1.prisma.ticketType.findMany({
        where: {
            id: { in: ticketIds },
            event_id,
        },
    });
    if (ticketTypes.length !== ticketIds.length) {
        throw new Error('Beberapa tiket tidak valid untuk event ini.');
    }
    let total_price = 0;
    const itemSummaries = items.map((item) => {
        const tier = ticketTypes.find((t) => t.id === item.ticket_type_id);
        const subtotal = tier.price * item.quantity;
        total_price += subtotal;
        return {
            ticket_type_id: tier.id,
            name: tier.name,
            unit_price: tier.price,
            quantity: item.quantity,
            subtotal,
            available_quota: tier.available_quota,
        };
    });
    // 2. Kalkulasi Voucher Organizer
    let voucher_discount = 0;
    let applied_voucher = null;
    if (voucher_code && voucher_code.trim()) {
        const now = new Date();
        const voucher = await prisma_1.prisma.voucher.findFirst({
            where: {
                event_id,
                code: voucher_code.trim(),
                start_date: { lte: now },
                end_date: { gte: now },
            },
        });
        if (!voucher) {
            throw new Error('Kode voucher tidak valid atau telah kedaluwarsa.');
        }
        if (voucher.discount_type === client_1.DiscountType.PERCENT) {
            voucher_discount = Math.floor((total_price * voucher.discount_value) / 100);
        }
        else {
            voucher_discount = voucher.discount_value;
        }
        voucher_discount = Math.min(voucher_discount, total_price);
        applied_voucher = {
            id: voucher.id,
            code: voucher.code,
            discount_type: voucher.discount_type,
            discount_value: voucher.discount_value,
            discount_amount: voucher_discount,
        };
    }
    // 3. Kalkulasi Kupon Referral User
    let coupon_discount = 0;
    let applied_coupon = null;
    const remainingAfterVoucher = Math.max(0, total_price - voucher_discount);
    if (coupon_id && remainingAfterVoucher > 0) {
        const now = new Date();
        const coupon = await prisma_1.prisma.coupon.findFirst({
            where: {
                id: coupon_id,
                user_id: userId,
                is_used: false,
                expires_at: { gte: now },
            },
        });
        if (!coupon) {
            throw new Error('Kupon referral tidak valid, sudah dipakai, atau kedaluwarsa.');
        }
        coupon_discount = Math.min(coupon.discount_amount, remainingAfterVoucher);
        applied_coupon = {
            id: coupon.id,
            discount_amount: coupon_discount,
            expires_at: coupon.expires_at,
        };
    }
    // 4. Kalkulasi Poin Pengguna
    let applied_points = 0;
    const remainingAfterCoupon = Math.max(0, remainingAfterVoucher - coupon_discount);
    // Ambil saldo poin user
    const latestPointTx = await prisma_1.prisma.pointTransaction.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
    });
    const userPointBalance = latestPointTx ? latestPointTx.remaining_amount : 0;
    if (points_used > 0) {
        if (points_used > userPointBalance) {
            throw new Error(`Saldo poin Anda tidak mencukupi (Tersedia: ${userPointBalance} poin).`);
        }
        // Limit poin tidak boleh melebihi sisa bayar
        applied_points = Math.min(points_used, remainingAfterCoupon);
    }
    // 5. Total Bayar
    const final_price = Math.max(0, remainingAfterCoupon - applied_points);
    return {
        items: itemSummaries,
        total_price,
        voucher_discount,
        coupon_discount,
        points_used: applied_points,
        user_point_balance: userPointBalance,
        final_price,
        applied_voucher,
        applied_coupon,
    };
};
exports.calculateCheckoutPriceService = calculateCheckoutPriceService;
// =========================================================
// 2. CREATE TRANSACTION (SQL TRANSACTION + ROW LOCKING)
// =========================================================
const createTransactionService = async (userId, input) => {
    const { event_id, items, voucher_code, coupon_id, points_used = 0 } = input;
    if (!items || items.length === 0) {
        throw new Error('Pilih minimal satu tiket.');
    }
    return await prisma_1.prisma.$transaction(async (tx) => {
        // A. Row Lock & Verifikasi Tiket
        // Di PostgreSQL, kita bisa lock row tiket menggunakan raw query atau sequential update
        let total_price = 0;
        const processedItems = [];
        let totalSeatsRequested = 0;
        for (const item of items) {
            if (item.quantity <= 0) {
                throw new Error('Jumlah tiket harus lebih dari 0.');
            }
            // Ambil dan verifikasi data kuota tiket
            const ticket = await tx.ticketType.findFirst({
                where: {
                    id: item.ticket_type_id,
                    event_id,
                },
            });
            if (!ticket) {
                throw new Error(`Tiket ID ${item.ticket_type_id} tidak valid untuk event ini.`);
            }
            if (ticket.available_quota < item.quantity) {
                throw new Error(`Sisa kuota untuk tiket "${ticket.name}" tidak mencukupi (Tersedia: ${ticket.available_quota}).`);
            }
            // Kurangi kuota tiket secara atomik di dalam database transaction
            await tx.ticketType.update({
                where: { id: item.ticket_type_id },
                data: {
                    available_quota: {
                        decrement: item.quantity,
                    },
                },
            });
            const subtotal = ticket.price * item.quantity;
            total_price += subtotal;
            totalSeatsRequested += item.quantity;
            processedItems.push({
                ticket_type_id: item.ticket_type_id,
                quantity: item.quantity,
                unit_price: ticket.price,
                subtotal,
            });
        }
        // Kurangi available_seats pada Event jika ada
        const targetEvent = await tx.event.findUnique({ where: { id: event_id } });
        if (targetEvent && targetEvent.available_seats >= totalSeatsRequested) {
            await tx.event.update({
                where: { id: event_id },
                data: {
                    available_seats: {
                        decrement: totalSeatsRequested,
                    },
                },
            });
        }
        // B. Validasi & Penggunaan Voucher Organizer
        let voucher_discount = 0;
        let voucher_id = null;
        if (voucher_code && voucher_code.trim()) {
            const now = new Date();
            const voucher = await tx.voucher.findFirst({
                where: {
                    event_id,
                    code: voucher_code.trim(),
                    start_date: { lte: now },
                    end_date: { gte: now },
                },
            });
            if (!voucher) {
                throw new Error('Kode voucher tidak valid atau telah kedaluwarsa.');
            }
            if (voucher.discount_type === client_1.DiscountType.PERCENT) {
                voucher_discount = Math.floor((total_price * voucher.discount_value) / 100);
            }
            else {
                voucher_discount = voucher.discount_value;
            }
            voucher_discount = Math.min(voucher_discount, total_price);
            voucher_id = voucher.id;
            // Update used count voucher
            await tx.voucher.update({
                where: { id: voucher.id },
                data: {
                    used_count: { increment: 1 },
                },
            });
        }
        // C. Validasi & Penggunaan Kupon Referral
        let coupon_discount = 0;
        let applied_coupon_id = null;
        const remainingAfterVoucher = Math.max(0, total_price - voucher_discount);
        if (coupon_id && remainingAfterVoucher > 0) {
            const now = new Date();
            const coupon = await tx.coupon.findFirst({
                where: {
                    id: coupon_id,
                    user_id: userId,
                    is_used: false,
                    expires_at: { gte: now },
                },
            });
            if (!coupon) {
                throw new Error('Kupon referral tidak valid atau telah digunakan.');
            }
            coupon_discount = Math.min(coupon.discount_amount, remainingAfterVoucher);
            applied_coupon_id = coupon.id;
            // Kunci kupon agar tidak bisa dipakai lagi
            await tx.coupon.update({
                where: { id: coupon.id },
                data: { is_used: true },
            });
        }
        // D. Validasi & Penggunaan Poin
        let final_points_used = 0;
        const remainingAfterCoupon = Math.max(0, remainingAfterVoucher - coupon_discount);
        const latestPointTx = await tx.pointTransaction.findFirst({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
        });
        const currentBalance = latestPointTx ? latestPointTx.remaining_amount : 0;
        if (points_used > 0) {
            if (points_used > currentBalance) {
                throw new Error(`Saldo poin Anda tidak mencukupi (Saldo: ${currentBalance}).`);
            }
            final_points_used = Math.min(points_used, remainingAfterCoupon);
        }
        const final_price = Math.max(0, remainingAfterCoupon - final_points_used);
        // E. Deadline Pembayaran 2 Jam dari Sekarang
        const payment_deadline = new Date(Date.now() + 2 * 60 * 60 * 1000);
        // F. Simpan Transaksi dengan status WAITING_PAYMENT
        const transaction = await tx.transaction.create({
            data: {
                customer_id: userId,
                event_id,
                voucher_id,
                coupon_id: applied_coupon_id,
                total_price,
                voucher_discount,
                coupon_discount,
                points_used: final_points_used,
                final_price,
                status: client_1.TransactionStatus.WAITING_PAYMENT,
                payment_deadline,
                transaction_items: {
                    create: processedItems.map((item) => ({
                        ticket_type_id: item.ticket_type_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        subtotal: item.subtotal,
                    })),
                },
            },
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                        banner_url: true,
                        start_date: true,
                        end_date: true,
                        city: true,
                        location: true,
                    },
                },
                transaction_items: {
                    include: {
                        ticket_type: true,
                    },
                },
            },
        });
        // G. Catat transaksi pengurangan poin jika ada poin yang dipakai
        if (final_points_used > 0) {
            const newBalance = currentBalance - final_points_used;
            const pointsExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 3 bulan
            await tx.pointTransaction.create({
                data: {
                    user_id: userId,
                    transaction_id: transaction.id,
                    amount: final_points_used,
                    remaining_amount: newBalance,
                    type: client_1.PointTransactionType.SPEND,
                    expires_at: pointsExpiry,
                },
            });
        }
        return transaction;
    });
};
exports.createTransactionService = createTransactionService;
// =========================================================
// 3. GET TRANSACTION BY ID
// =========================================================
const getTransactionByIdService = async (transactionId, userId) => {
    const transaction = await prisma_1.prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
            event: {
                include: {
                    organizer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            organizer_profile: true,
                        },
                    },
                },
            },
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            voucher: true,
            coupon: true,
            transaction_items: {
                include: {
                    ticket_type: true,
                },
            },
        },
    });
    if (!transaction) {
        throw new Error('Transaksi tidak ditemukan.');
    }
    // Jika ada userId, pastikan user adalah pemilik atau organizer
    if (userId && transaction.customer_id !== userId && transaction.event.organizer_id !== userId) {
        throw new Error('Anda tidak memiliki akses ke transaksi ini.');
    }
    return transaction;
};
exports.getTransactionByIdService = getTransactionByIdService;
// =========================================================
// 4. GET USER TRANSACTION HISTORY (TABBED FILTERING)
// =========================================================
const getUserTransactionsService = async (userId, statusFilter, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    let whereClause = {
        customer_id: userId,
    };
    if (statusFilter && statusFilter !== 'ALL') {
        // Map status filter jika perlu
        if (Object.values(client_1.TransactionStatus).includes(statusFilter)) {
            whereClause.status = statusFilter;
        }
    }
    const [total, transactions] = await Promise.all([
        prisma_1.prisma.transaction.count({ where: whereClause }),
        prisma_1.prisma.transaction.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                        banner_url: true,
                        start_date: true,
                        end_date: true,
                        city: true,
                        location: true,
                    },
                },
                transaction_items: {
                    include: {
                        ticket_type: true,
                    },
                },
            },
        }),
    ]);
    return {
        transactions,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};
exports.getUserTransactionsService = getUserTransactionsService;
// =========================================================
// 5. UPLOAD PAYMENT PROOF
// =========================================================
const uploadPaymentProofService = async (transactionId, userId, fileBuffer) => {
    const transaction = await prisma_1.prisma.transaction.findUnique({
        where: { id: transactionId },
    });
    if (!transaction) {
        throw new Error('Transaksi tidak ditemukan.');
    }
    if (transaction.customer_id !== userId) {
        throw new Error('Anda tidak memiliki akses ke transaksi ini.');
    }
    if (transaction.status !== client_1.TransactionStatus.WAITING_PAYMENT) {
        throw new Error(`Bukti bayar tidak dapat diunggah untuk transaksi dengan status: ${transaction.status}.`);
    }
    const now = new Date();
    if (now > transaction.payment_deadline) {
        // Otomatis tandai expired jika sudah lewat waktu pembayaran
        await (0, exports.rollbackTransactionCore)(transactionId, 'Waktu pembayaran telah habis.');
        throw new Error('Waktu pembayaran telah kedaluwarsa (2 jam batas waktu terlampaui). Transaksi telah dibatalkan.');
    }
    // Upload gambar ke Cloudinary
    const secureUrl = await (0, cloudinary_1.uploadToCloudinary)(fileBuffer, 'kagemaya/payments');
    // Update status transaksi ke WAITING_CONFIRMATION
    const updatedTransaction = await prisma_1.prisma.transaction.update({
        where: { id: transactionId },
        data: {
            payment_proof_url: secureUrl,
            payment_proof_uploaded_at: now,
            status: client_1.TransactionStatus.WAITING_CONFIRMATION,
            admin_review_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 hari untuk admin
        },
        include: {
            event: true,
            transaction_items: {
                include: { ticket_type: true },
            },
        },
    });
    return updatedTransaction;
};
exports.uploadPaymentProofService = uploadPaymentProofService;
// =========================================================
// 6. CORE ROLLBACK LOGIC (RESTORE QUOTA, COUPON, POINTS, VOUCHER)
// =========================================================
const rollbackTransactionCore = async (transactionId, reason = 'Transaction rolled back') => {
    return await prisma_1.prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.findUnique({
            where: { id: transactionId },
            include: {
                transaction_items: true,
            },
        });
        if (!transaction) {
            return null;
        }
        // Jangan rollback jika transaksi sudah sukses (DONE)
        if (transaction.status === client_1.TransactionStatus.DONE) {
            throw new Error('Transaksi yang sudah selesai tidak dapat di-rollback.');
        }
        // 1. Kembalikan Kuota Tiket
        let totalRestoredSeats = 0;
        for (const item of transaction.transaction_items) {
            await tx.ticketType.update({
                where: { id: item.ticket_type_id },
                data: {
                    available_quota: {
                        increment: item.quantity,
                    },
                },
            });
            totalRestoredSeats += item.quantity;
        }
        // Kembalikan available_seats pada Event
        await tx.event.update({
            where: { id: transaction.event_id },
            data: {
                available_seats: {
                    increment: totalRestoredSeats,
                },
            },
        });
        // 2. Pulihkan Kupon Referral
        if (transaction.coupon_id) {
            await tx.coupon.update({
                where: { id: transaction.coupon_id },
                data: { is_used: false },
            });
        }
        // 3. Kembalikan Poin Pengguna
        if (transaction.points_used > 0) {
            const latestPointTx = await tx.pointTransaction.findFirst({
                where: { user_id: transaction.customer_id },
                orderBy: { created_at: 'desc' },
            });
            const currentBalance = latestPointTx ? latestPointTx.remaining_amount : 0;
            const newBalance = currentBalance + transaction.points_used;
            await tx.pointTransaction.create({
                data: {
                    user_id: transaction.customer_id,
                    transaction_id: transaction.id,
                    amount: transaction.points_used,
                    remaining_amount: newBalance,
                    type: client_1.PointTransactionType.REFUND,
                    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                },
            });
        }
        // 4. Kurangi used_count pada Voucher jika ada
        if (transaction.voucher_id) {
            await tx.voucher.update({
                where: { id: transaction.voucher_id },
                data: {
                    used_count: { decrement: 1 },
                },
            });
        }
        // 5. Ubah Status Transaksi
        const updated = await tx.transaction.update({
            where: { id: transactionId },
            data: {
                status: reason.toLowerCase().includes('expire')
                    ? client_1.TransactionStatus.EXPIRED
                    : client_1.TransactionStatus.CANCELED,
            },
        });
        return updated;
    });
};
exports.rollbackTransactionCore = rollbackTransactionCore;
// =========================================================
// 7. CANCEL TRANSACTION BY USER
// =========================================================
const cancelTransactionService = async (transactionId, userId) => {
    const transaction = await prisma_1.prisma.transaction.findUnique({
        where: { id: transactionId },
    });
    if (!transaction) {
        throw new Error('Transaksi tidak ditemukan.');
    }
    if (transaction.customer_id !== userId) {
        throw new Error('Anda tidak memiliki wewenang untuk membatalkan transaksi ini.');
    }
    if (transaction.status !== client_1.TransactionStatus.WAITING_PAYMENT) {
        throw new Error('Hanya transaksi yang menunggu pembayaran yang dapat dibatalkan.');
    }
    return await (0, exports.rollbackTransactionCore)(transactionId, 'Dibatalkan oleh pengguna.');
};
exports.cancelTransactionService = cancelTransactionService;
// =========================================================
// 8. AUTO-EXPIRE ENGINE (DIPANGGIL OLEH CRON SCHEDULER)
// =========================================================
const autoExpireOldTransactionsService = async () => {
    const now = new Date();
    // Cari transaksi yang masih WAITING_PAYMENT dan sudah melewati deadline
    const expiredTransactions = await prisma_1.prisma.transaction.findMany({
        where: {
            status: client_1.TransactionStatus.WAITING_PAYMENT,
            payment_deadline: {
                lt: now,
            },
        },
        select: {
            id: true,
        },
    });
    if (expiredTransactions.length === 0) {
        return { count: 0 };
    }
    console.log(`[Auto-Expire Cron] Menemukan ${expiredTransactions.length} transaksi yang kedaluwarsa. Memproses rollback...`);
    let processedCount = 0;
    for (const tx of expiredTransactions) {
        try {
            await (0, exports.rollbackTransactionCore)(tx.id, 'Auto-expired by cron scheduler (2-hour limit reached).');
            processedCount++;
        }
        catch (err) {
            console.error(`[Auto-Expire Cron] Gagal rollback transaksi ${tx.id}:`, err.message);
        }
    }
    console.log(`[Auto-Expire Cron] Selesai: Berhasil memproses ${processedCount} transaksi kedaluwarsa.`);
    return { count: processedCount };
};
exports.autoExpireOldTransactionsService = autoExpireOldTransactionsService;
// =========================================================
// 9. ORGANIZER: GET INCOMING TRANSACTIONS FOR MY EVENTS
// =========================================================
const getOrganizerTransactionsService = async (organizerId, statusFilter, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    // Filter hanya transaksi dari event yang dibuat oleh organizer ini
    const whereClause = {
        event: {
            organizer_id: organizerId,
        },
    };
    if (statusFilter && statusFilter !== 'ALL') {
        if (Object.values(client_1.TransactionStatus).includes(statusFilter)) {
            whereClause.status = statusFilter;
        }
    }
    const [total, transactions] = await Promise.all([
        prisma_1.prisma.transaction.count({ where: whereClause }),
        prisma_1.prisma.transaction.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile_picture: true,
                    },
                },
                event: {
                    select: {
                        id: true,
                        title: true,
                        city: true,
                        location: true,
                    },
                },
                transaction_items: {
                    include: {
                        ticket_type: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                            },
                        },
                    },
                },
            },
        }),
    ]);
    return {
        transactions,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};
exports.getOrganizerTransactionsService = getOrganizerTransactionsService;
// =========================================================
// 10. ORGANIZER: ACCEPT TRANSACTION (PATCH /:id/accept)
// =========================================================
const acceptTransactionService = async (transactionId, organizerId) => {
    const transaction = await prisma_1.prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
            event: true,
            customer: true,
        },
    });
    if (!transaction) {
        throw new Error('Transaksi tidak ditemukan.');
    }
    // Validasi Kepemilikan Event
    if (transaction.event.organizer_id !== organizerId) {
        throw new Error('Akses ditolak. Anda bukan penyelenggara event ini.');
    }
    // Validasi Status Saat Ini
    if (transaction.status !== client_1.TransactionStatus.WAITING_CONFIRMATION) {
        throw new Error(`Hanya transaksi berstatus WAITING_CONFIRMATION yang dapat diterima. Status saat ini: ${transaction.status}.`);
    }
    // Update Status menjadi DONE
    const updated = await prisma_1.prisma.transaction.update({
        where: { id: transactionId },
        data: {
            status: client_1.TransactionStatus.DONE,
            admin_review_deadline: null,
        },
    });
    return updated;
};
exports.acceptTransactionService = acceptTransactionService;
// =========================================================
// 11. ORGANIZER: REJECT TRANSACTION (PATCH /:id/reject)
// =========================================================
const rejectTransactionService = async (transactionId, organizerId, reason) => {
    if (!reason || reason.trim() === '') {
        throw new Error('Alasan penolakan bukti bayar wajib diisi.');
    }
    const transaction = await prisma_1.prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
            event: true,
            transaction_items: true,
        },
    });
    if (!transaction) {
        throw new Error('Transaksi tidak ditemukan.');
    }
    // Validasi Kepemilikan Event
    if (transaction.event.organizer_id !== organizerId) {
        throw new Error('Akses ditolak. Anda bukan penyelenggara event ini.');
    }
    if (transaction.status !== client_1.TransactionStatus.WAITING_CONFIRMATION) {
        throw new Error(`Hanya transaksi berstatus WAITING_CONFIRMATION yang dapat ditolak. Status saat ini: ${transaction.status}.`);
    }
    // Rollback Kuota Tiket, Voucher, Kupon, & Poin via Prisma Transaction
    return await prisma_1.prisma.$transaction(async (tx) => {
        // 1. Kembalikan Kuota Tiket
        let totalRestoredSeats = 0;
        for (const item of transaction.transaction_items) {
            await tx.ticketType.update({
                where: { id: item.ticket_type_id },
                data: {
                    available_quota: {
                        increment: item.quantity,
                    },
                },
            });
            totalRestoredSeats += item.quantity;
        }
        // Kembalikan available_seats pada Event
        await tx.event.update({
            where: { id: transaction.event_id },
            data: {
                available_seats: {
                    increment: totalRestoredSeats,
                },
            },
        });
        // 2. Pulihkan Kupon Referral jika dipakai
        if (transaction.coupon_id) {
            await tx.coupon.update({
                where: { id: transaction.coupon_id },
                data: { is_used: false },
            });
        }
        // 3. Kembalikan Poin Pengguna jika digunakan
        if (transaction.points_used > 0) {
            const latestPointTx = await tx.pointTransaction.findFirst({
                where: { user_id: transaction.customer_id },
                orderBy: { created_at: 'desc' },
            });
            const currentBalance = latestPointTx ? latestPointTx.remaining_amount : 0;
            const newBalance = currentBalance + transaction.points_used;
            await tx.pointTransaction.create({
                data: {
                    user_id: transaction.customer_id,
                    transaction_id: transaction.id,
                    amount: transaction.points_used,
                    remaining_amount: newBalance,
                    type: client_1.PointTransactionType.REFUND,
                    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 bulan
                },
            });
        }
        // 4. Kurangi used_count pada Voucher
        if (transaction.voucher_id) {
            await tx.voucher.update({
                where: { id: transaction.voucher_id },
                data: {
                    used_count: { decrement: 1 },
                },
            });
        }
        // 5. Ubah Status Transaksi ke REJECTED
        const updated = await tx.transaction.update({
            where: { id: transactionId },
            data: {
                status: client_1.TransactionStatus.REJECTED,
                admin_review_deadline: null,
            },
        });
        return updated;
    });
};
exports.rejectTransactionService = rejectTransactionService;
