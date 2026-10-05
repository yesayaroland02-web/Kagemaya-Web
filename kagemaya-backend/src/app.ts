import express from 'express';
import cors from 'cors';

// Import Routers
import authRouter from './routes/auth.router';
import eventRouter from './routes/event.router';
import categoryRouter from './routes/category.router'; // 1. Import categoryRouter

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes Integration
app.use('/api/auth', authRouter);
app.use('/api/events', eventRouter);
app.use('/api/categories', categoryRouter); // 2. Mount route categories

export default app;