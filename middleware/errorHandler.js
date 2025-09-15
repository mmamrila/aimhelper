/**
 * AimHelper Pro - Error Handling Middleware
 * Centralized error handling and logging
 */

const winston = require('winston');

const logger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Main error handler
const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || 'anonymous'
    });

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation failed',
            details: err.details || err.message,
            code: 'VALIDATION_ERROR'
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid data format',
            code: 'INVALID_FORMAT'
        });
    }

    if (err.code === 'P2002') { // Prisma unique constraint
        return res.status(409).json({
            error: 'Resource already exists',
            code: 'DUPLICATE_RESOURCE'
        });
    }

    if (err.code === 'P2025') { // Prisma record not found
        return res.status(404).json({
            error: 'Resource not found',
            code: 'NOT_FOUND'
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired',
            code: 'TOKEN_EXPIRED'
        });
    }

    // Handle rate limiting
    if (err.status === 429) {
        return res.status(429).json({
            error: 'Too many requests',
            code: 'RATE_LIMITED',
            retryAfter: err.retryAfter
        });
    }

    // Default error response
    const statusCode = err.statusCode || err.status || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

    res.status(statusCode).json({
        error: message,
        code: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

// 404 handler
const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: `Route ${req.method} ${req.path} not found`,
        code: 'ROUTE_NOT_FOUND'
    });
};

// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler
};