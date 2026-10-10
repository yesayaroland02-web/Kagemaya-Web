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

// Routes Integration
app.use('/api/auth', authRouter);
app.use('/api/events', eventRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/orders', orderRoutes);
app.use('/api/me', userRouter);
app.use(
  '/api/me',
  rewardRoutes
);

export default app;