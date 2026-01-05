import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { entityRouter } from './routes/entity';
import { webhookRouter } from './routes/webhook';
import { imageRouter } from './routes/image';
import { articleRouter } from './routes/article';
import { profileRouter } from './routes/profile';
import { inviteRouter } from './routes/invite';

dotenv.config();

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Hedronal API is running' });
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for large entity data
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/entities', entityRouter);
app.use('/api/webhooks', webhookRouter);
app.use('/api/images', imageRouter);
app.use('/api/articles', articleRouter);
app.use('/api/profiles', profileRouter);
app.use('/api/invites', inviteRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Hedronal backend server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Supabase URL: ${process.env.SUPABASE_URL ? 'SET' : 'MISSING'}`);
  console.log(`Clerk Secret Key: ${process.env.CLERK_SECRET_KEY ? 'SET' : 'MISSING'}`);
});
