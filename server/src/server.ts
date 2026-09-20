import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
const port = process.env.PORT || 8080;

// Security Middlewares
app.use(helmet());

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS 
  ? process.env.CORS_ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173']; // Default Vite port

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(pinoHttp({ logger }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Auth Middleware
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const adminToken = process.env.ADMIN_TOKEN;
    if (adminToken) {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
    }
  }
  next();
};

app.use(authMiddleware);

// Validation Middleware
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request data', details: error.issues || (error as any).errors });
        return;
      }
      res.status(400).json({ error: 'Invalid request data' });
    }
  };
};

import apiRoutes from './api/routes';

app.use('/api', apiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  });
}

export default app;
