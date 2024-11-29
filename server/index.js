import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { expressjwt as jwt } from 'express-jwt';
import speakersRouter from './routes/speakers.js';
import talksRouter from './routes/talks.js';
import registrationsRouter from './routes/registrations.js';
import talkRegistrationsRouter from './routes/talk-registrations.js';
import authRouter from './routes/auth.js';
import eventsRouter, { initializeRouter as initializeEventsRouter } from './routes/events.js';
import { initializeDatabase, getDatabase } from './database/init.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize database and routers
async function initializeApp() {
  try {
    await initializeDatabase();
    const db = getDatabase();
    
    // Initialize routers with database connection
    initializeEventsRouter(db);
    
    // Middleware
    app.use(cookieParser()); // Add cookie-parser before other middleware
    app.use(cors({
      origin: 'http://localhost:4321',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    app.use(express.json());

    // JWT middleware
    const jwtMiddleware = jwt({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      algorithms: ['HS256'],
      getToken: (req) => {
        // Check cookies first
        if (req.cookies && req.cookies.adminToken) {
          return req.cookies.adminToken;
        }
        // Then check Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          return authHeader.split(' ')[1];
        }
        return null;
      }
    }).unless({ 
      path: [
        '/api/auth/login',
        '/api/registrations',
        { url: /^\/api\/talks(?!\/)/, methods: ['GET'] },
        { url: /^\/api\/speakers(?!\/)/, methods: ['GET'] }
      ]
    });

    // Apply JWT middleware to /api routes
    app.use('/api', jwtMiddleware);

    // Routes
    app.use('/api/auth', authRouter);
    app.use('/api/speakers', speakersRouter);
    app.use('/api/talks', talksRouter);
    app.use('/api/registrations', registrationsRouter);
    app.use('/api/talk-registrations', talkRegistrationsRouter);
    app.use('/api/events', eventsRouter);

    // Error handling middleware
    app.use((err, req, res, next) => {
      if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Invalid or missing token'
        });
      }
      console.error(err);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    });

    // Health check
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'healthy' });
    });

    // Start server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Start the application
initializeApp();