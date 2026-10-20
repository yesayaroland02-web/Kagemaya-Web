import cron from 'node-cron';
import { autoExpireOldTransactionsService } from '../services/transaction.service';

/**
 * Inisialisasi Cron Job untuk Auto-Expire Transaksi.
 * Berjalan setiap 1 menit ('* * * * *') untuk memeriksa transaksi
 * yang telah melewati payment_deadline (2 jam) tanpa bukti bayar.
 */
export const initExpireTransactionCron = () => {
  console.log('⏰ [Scheduler] Memulai Background Cron Job Auto-Expire Transaksi (interval: 1 menit)...');

  cron.schedule('* * * * *', async () => {
    try {
      await autoExpireOldTransactionsService();
    } catch (error: any) {
      console.error('❌ [Scheduler Error] Kesalahan saat menjalankan auto-expire scheduler:', error.message);
    }
  });
};
