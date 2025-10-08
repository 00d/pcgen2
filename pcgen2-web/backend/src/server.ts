import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import authRoutes from './routes/auth';
import characterRoutes from './routes/characters';
import gameRulesRoutes from './routes/gameRules';
import equipmentRoutes from './routes/equipment';
import levelingRoutes from './routes/leveling';
import spellRoutes from './routes/spells';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/game-rules', gameRulesRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/leveling', levelingRoutes);
app.use('/api/spells', spellRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
async function startServer() {
  try {
    logger.info('Connecting to database...');
    await connectDatabase();
    logger.info('Database connected');

    logger.info('Initializing Redis...');
    await initializeRedis();
    logger.info('Redis initialized');

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
