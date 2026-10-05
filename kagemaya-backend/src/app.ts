import express from 'express';
import authRouter from './routes/auth.router'; // Sesuaikan path jika berbeda

const app = express();

// Middleware parsing body JSON (WAJIB ADA)
app.use(express.json());

// Main Route Mounting
app.use('/api/auth', authRouter);

export default app;