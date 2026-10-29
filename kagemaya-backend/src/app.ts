import express from 'express';
import cors from 'cors';
import path from 'path';

// Import Routers
import authRouter from './routes/auth.router';
import eventRouter from './routes/event.router';
import categoryRouter from './routes/category.router';
import orderRoutes from './routes/order.route';
import userRouter from './routes/user.router';
import rewardRoutes from './routes/reward.routes';
import transactionRouter from './routes/transaction.router';
import wishlistRouter from './routes/wishlist.router';
import followRouter from './routes/follow.router';
import discussionRouter from './routes/discussion.router';

// Import Background Jobs
import { initExpireTransactionCron } from './jobs/expireTransaction.job';

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (avatar, payment proof, banner) sebagai static
app.use(
  '/uploads',
  express.static(
    path.join(process.cwd(), 'uploads')
  )
);

// Root / Health Check
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Kagemaya Backend API is running 🚀',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      events: '/api/events',
      categories: '/api/categories',
      transactions: '/api/transactions',
      me: '/api/me',
      wishlists: '/api/wishlists',
      follows: '/api/follows',
      discussions: '/api/discussions',
    },
  });
});

// Routes Integration
app.use('/api/auth', authRouter);
app.use('/api/events', eventRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/orders', orderRoutes);
app.use('/api/me', userRouter);
app.use('/api/me', rewardRoutes);
app.use('/api/transactions', transactionRouter);

// CARD DAY 17 & DAY 18 APIs
app.use('/api/wishlists', wishlistRouter);
app.use('/api', followRouter); // Mounts /api/follows/:organizerId and /api/organizers/:id
app.use('/api', discussionRouter); // Mounts /api/events/:id/discussions and /api/discussions/:id/pin

// Initialize Background Cron Scheduler (Auto-Expire Transaksi)
initExpireTransactionCron();

export default app;
