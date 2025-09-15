/**
 * AimHelper Pro - Authentication Middleware
 * JWT-based authentication and authorization
 */

const jwt = require('jsonwebtoken');
const DatabaseService = require('../services/database');

// JWT Authentication Middleware
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'Access denied. No token provided.',
                code: 'NO_TOKEN'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await DatabaseService.getUserById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                error: 'Invalid token. User not found.',
                code: 'USER_NOT_FOUND'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                error: 'Account deactivated.',
                code: 'ACCOUNT_DEACTIVATED'
            });
        }

        if (user.isBanned) {
            return res.status(403).json({
                error: 'Account banned.',
                code: 'ACCOUNT_BANNED',
                bannedUntil: user.bannedUntil
            });
        }

        // Add user to request object
        req.user = {
            id: user.id,
            email: user.email,
            username: user.username,
            plan: user.plan,
            emailVerified: user.emailVerified
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token.',
                code: 'INVALID_TOKEN'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired.',
                code: 'TOKEN_EXPIRED'
            });
        }

        console.error('Auth middleware error:', error);
        res.status(500).json({
            error: 'Internal server error during authentication.',
            code: 'AUTH_ERROR'
        });
    }
};

// Optional Authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await DatabaseService.getUserById(decoded.userId);

            if (user && user.isActive && !user.isBanned) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    plan: user.plan,
                    emailVerified: user.emailVerified
                };
            }
        }

        next();
    } catch (error) {
        // Continue without authentication if token is invalid
        next();
    }
};

// Plan-based authorization middleware
const requirePlan = (requiredPlan) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required.',
                code: 'AUTH_REQUIRED'
            });
        }

        const planHierarchy = { free: 0, pro: 1, team: 2 };
        const userPlanLevel = planHierarchy[req.user.plan] || 0;
        const requiredPlanLevel = planHierarchy[requiredPlan] || 0;

        if (userPlanLevel < requiredPlanLevel) {
            return res.status(403).json({
                error: `${requiredPlan} plan required.`,
                code: 'PLAN_REQUIRED',
                required: requiredPlan,
                current: req.user.plan
            });
        }

        next();
    };
};

// Email verification requirement
const requireEmailVerification = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required.',
            code: 'AUTH_REQUIRED'
        });
    }

    if (!req.user.emailVerified) {
        return res.status(403).json({
            error: 'Email verification required.',
            code: 'EMAIL_VERIFICATION_REQUIRED'
        });
    }

    next();
};

module.exports = {
    authMiddleware,
    optionalAuth,
    requirePlan,
    requireEmailVerification
};