import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AppDataSource } from './config/database';
import routes from './routes';
import { errorMiddleware } from './middleware/error.middleware';
import { SchedulerService } from './services/scheduler.service';

const app = express();
const schedulerService = new SchedulerService();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:4200', 'http://localhost:3000'];

app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use(errorMiddleware);

// Initialize database and start server
const startServer = async () => {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected successfully');

        // Initialize habit reminder scheduler
        schedulerService.init();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📚 API available at http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('❌ Error starting server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
