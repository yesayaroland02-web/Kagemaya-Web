"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initExpireTransactionCron = void 0;
const node_cron_1 = require("node-cron");
const transaction_service_1 = require("../services/transaction.service");
/**
 * Inisialisasi Cron Job untuk Auto-Expire Transaksi.
 * Berjalan setiap 1 menit ('* * * * *') untuk memeriksa transaksi
 * yang telah melewati payment_deadline (2 jam) tanpa bukti bayar.
 */
const initExpireTransactionCron = () => {
    console.log('⏰ [Scheduler] Memulai Background Cron Job Auto-Expire Transaksi (interval: 1 menit)...');
    (0, node_cron_1.schedule)('* * * * *', async () => {
        try {
            await (0, transaction_service_1.autoExpireOldTransactionsService)();
        }
        catch (error) {
            console.error('❌ [Scheduler Error] Kesalahan saat menjalankan auto-expire scheduler:', error.message);
        }
    });
};
exports.initExpireTransactionCron = initExpireTransactionCron;
