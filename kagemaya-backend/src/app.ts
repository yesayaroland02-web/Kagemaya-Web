import express from 'express';
import cors from 'cors'; // 1. Import cors
import authRouter from './routes/auth.router';

const app = express();

// 2. Pasang CORS Middleware (Wajib di paling atas sebelum route)
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5500'],
    credentials: true,
  })
);

// Middleware parsing body JSON (WAJIB ADA)
app.use(express.json());

// Main Route Mounting
app.use('/api/auth', authRouter);

export default app;