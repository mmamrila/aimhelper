/**
 * AimHelper Pro - Rate Limiting Configuration
 * Configure rate limiting for different endpoints
 */

const rateLimit = require('express-rate-limit');

// General API rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: 15 * 60 * 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: 15 * 60 * 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

// Training data submission rate limiting
const trainingLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit to 10 training results per minute
    message: {
        error: 'Too many training results submitted, please slow down.',
        retryAfter: 1 * 60 * 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Leaderboard request limiting (public endpoint)
const leaderboardLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Allow more frequent leaderboard requests
    message: {
        error: 'Too many leaderboard requests, please try again later.',
        retryAfter: 1 * 60 * 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Password reset limiting
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Only 3 password reset attempts per hour per IP
    message: {
        error: 'Too many password reset attempts, please try again later.',
        retryAfter: 60 * 60 * 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    apiLimiter,
    authLimiter,
    trainingLimiter,
    leaderboardLimiter,
    passwordResetLimiter
};