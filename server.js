/**
 * AimHelper Pro - Production Server
 * High-performance Express.js server with comprehensive features
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const winston = require('winston');
const expressWinston = require('express-winston');

// Import route handlers
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const trainingRoutes = require('./routes/training');
const analyticsRoutes = require('./routes/analytics');
const leaderboardRoutes = require('./routes/leaderboard');
const paymentRoutes = require('./routes/payments');

// Import middleware
const { authMiddleware } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const rateLimitConfig = require('./config/rateLimit');

// Import services
const DatabaseService = require('./services/database');
const RedisService = require('./services/redis');
const SocketService = require('./services/socket');

// Configuration
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
    cors: {
        origin: IS_PRODUCTION ? process.env.CLIENT_URL : `http://localhost:${PORT}`,
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Configure Winston logger
const logger = winston.createLogger({
    level: IS_PRODUCTION ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        IS_PRODUCTION ? winston.format.json() : winston.format.simple()
    ),
    defaultMeta: { service: 'aimhelper-api' },
    transports: [
        // Always include console transport for visibility
        new winston.transports.Console({
            format: IS_PRODUCTION ?
                winston.format.combine(winston.format.timestamp(), winston.format.json()) :
                winston.format.simple()
        })
    ],
});

// Add file transports with error handling
try {
    logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        handleExceptions: true
    }));
    logger.add(new winston.transports.File({
        filename: 'logs/combined.log',
        handleExceptions: true
    }));
} catch (error) {
    console.log('Warning: Could not initialize file logging, continuing with console only');
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", "ws:", "wss:"],
            workerSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
    origin: IS_PRODUCTION ? process.env.CLIENT_URL : [`http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression and parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true,
    colorize: false,
    ignoreRoute: function (req, res) {
        return false;
    }
}));

if (!IS_PRODUCTION) {
    app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: IS_PRODUCTION ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: 15 * 60 * 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// Serve static files
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: IS_PRODUCTION ? '1y' : '0',
    etag: true,
    lastModified: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/training', authMiddleware, trainingRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);

// API status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        api: 'AimHelper Pro API',
        version: '1.0.0',
        status: 'operational',
        features: {
            authentication: true,
            realTimeLeaderboards: true,
            analyticsTracking: true,
            paymentProcessing: true,
            multiplayerSessions: true
        },
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            training: '/api/training',
            analytics: '/api/analytics',
            leaderboard: '/api/leaderboard',
            payments: '/api/payments'
        }
    });
});

// Page routes - serve specific HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/converter', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'converter.html'));
});

app.get('/how-it-works', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'how-it-works.html'));
});

app.get('/pricing', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pricing.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/sensitivity-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sensitivity-test.html'));
});

app.get('/flick-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'flick-test.html'));
});

app.get('/consistency-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'consistency-test.html'));
});

app.get('/apex-tracking-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'apex-tracking-test.html'));
});

app.get('/valorant-crosshair-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'valorant-crosshair-test.html'));
});

app.get('/test-interface', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test-interface.html'));
});

app.get('/results', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Catch-all handler for unmatched routes
app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }

    // Redirect unknown routes to homepage
    res.redirect('/');
});

// Error handling middleware
app.use(expressWinston.errorLogger({
    winstonInstance: logger,
    meta: true,
    msg: "HTTP {{req.method}} {{req.url}} - {{res.statusCode}} - {{err.message}}"
}));

app.use(errorHandler);

// Initialize services
async function initializeServices() {
    try {
        // Initialize database
        await DatabaseService.initialize();
        logger.info('Database service initialized');

        // Initialize Redis (optional, fallback to memory if not available)
        try {
            await RedisService.initialize();
            console.log('📢 Redis is optional - app works fine without it for basic functionality');
            logger.info('Redis service initialized');
        } catch (error) {
            logger.warn('Redis service unavailable, falling back to in-memory cache');
        }

        // Initialize Socket.IO service
        SocketService.initialize(io);
        logger.info('Socket.IO service initialized');

        logger.info('All services initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize services:', error);
        process.exit(1);
    }
}

// Graceful shutdown
function gracefulShutdown(signal) {
    logger.info(`Received ${signal}, shutting down gracefully`);

    server.close(() => {
        logger.info('HTTP server closed');

        // Close database connections
        DatabaseService.close().then(() => {
            logger.info('Database connections closed');
            process.exit(0);
        }).catch((error) => {
            logger.error('Error closing database connections:', error);
            process.exit(1);
        });
    });

    // Force close after 10 seconds
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
}

// Handle process termination
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection:', reason);
    console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    console.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Start server
async function startServer() {
    try {
        await initializeServices();

        server.listen(PORT, () => {
            logger.info(`🚀 AimHelper Pro server running on port ${PORT}`);
            logger.info(`📊 Environment: ${NODE_ENV}`);
            logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
            logger.info(`🔗 API status: http://localhost:${PORT}/api/status`);

            if (!IS_PRODUCTION) {
                logger.info(`🎯 Frontend: http://localhost:${PORT}`);
                logger.info(`📡 Socket.IO ready for real-time connections`);
            }
        });

        // Log server startup metrics
        const memUsage = process.memoryUsage();
        logger.info('Server startup metrics:', {
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
            external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Export for testing
module.exports = { app, server, io };

// Start the server if this file is run directly
if (require.main === module) {
    startServer();
}