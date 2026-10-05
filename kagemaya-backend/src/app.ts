import authRouter from './routes/auth.router';
import cors from 'cors';
import eventRouter from './routes/event.router'; // 1. Import eventRouter
import express from 'express';

const app = express();

// Pasang CORS agar frontend bisa fetch tanpa terblokir
app.use(cors());
app.use(express.json());
// Routes
app.use('/api/auth', authRouter);
app.use('/api/events', eventRouter); // 2. Mount route event
export default app;