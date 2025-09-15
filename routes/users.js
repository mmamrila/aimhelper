/**
 * AimHelper Pro - User Management Routes
 * User profiles, settings, and account management
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const DatabaseService = require('../services/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware, requireEmailVerification } = require('../middleware/auth');

const router = express.Router();

// Get current user profile
router.get('/profile', authMiddleware, asyncHandler(async (req, res) => {
    const user = await DatabaseService.prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
            profile: true,
            stats: true,
            subscription: true,
            trainingResults: {
                orderBy: { createdAt: 'desc' },
                take: 10
            }
        }
    });

    if (!user) {
        return res.status(404).json({
            error: 'User not found'
        });
    }

    res.json({
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            plan: user.plan,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            profile: user.profile,
            stats: user.stats,
            subscription: user.subscription,
            recentResults: user.trainingResults
        }
    });
}));

// Update user profile
router.put('/profile', authMiddleware, [
    body('displayName').optional().isLength({ min: 1, max: 50 }),
    body('bio').optional().isLength({ max: 500 }),
    body('country').optional().isLength({ max: 50 }),
    body('timezone').optional().isLength({ max: 50 }),
    body('mainGame').optional().isLength({ max: 50 }),
    body('experience').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    body('mouseDPI').optional().isInt({ min: 100, max: 10000 }),
    body('mouseSensitivity').optional().isFloat({ min: 0.1, max: 10 }),
    body('windowsSens').optional().isInt({ min: 1, max: 11 }),
    body('mouseHz').optional().isInt({ min: 125, max: 8000 }),
    body('mouseModel').optional().isLength({ max: 100 }),
    body('mousepad').optional().isLength({ max: 100 }),
    body('resolution').optional().isLength({ max: 20 }),
    body('refreshRate').optional().isInt({ min: 30, max: 500 }),
    body('aspectRatio').optional().isLength({ max: 10 }),
    body('showStats').optional().isBoolean(),
    body('showProfile').optional().isBoolean(),
    body('allowFriends').optional().isBoolean()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const {
        displayName, bio, country, timezone, mainGame, experience,
        mouseDPI, mouseSensitivity, windowsSens, mouseHz, mouseModel, mousepad,
        resolution, refreshRate, aspectRatio, showStats, showProfile, allowFriends
    } = req.body;

    // Update or create profile
    const profile = await DatabaseService.prisma.userProfile.upsert({
        where: { userId: req.user.id },
        update: {
            displayName,
            bio,
            country,
            timezone,
            mainGame,
            experience,
            mouseDPI,
            mouseSensitivity,
            windowsSens,
            mouseHz,
            mouseModel,
            mousepad,
            resolution,
            refreshRate,
            aspectRatio,
            showStats,
            showProfile,
            allowFriends,
            updatedAt: new Date()
        },
        create: {
            userId: req.user.id,
            displayName,
            bio,
            country,
            timezone,
            mainGame,
            experience,
            mouseDPI,
            mouseSensitivity,
            windowsSens,
            mouseHz,
            mouseModel,
            mousepad,
            resolution,
            refreshRate,
            aspectRatio,
            showStats,
            showProfile,
            allowFriends
        }
    });

    res.json({
        message: 'Profile updated successfully',
        profile
    });
}));

// Change password
router.put('/password', authMiddleware, [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password hash
    const user = await DatabaseService.prisma.user.findUnique({
        where: { id: req.user.id },
        select: { passwordHash: true }
    });

    if (!user.passwordHash) {
        return res.status(400).json({
            error: 'Cannot change password for OAuth account'
        });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
        return res.status(401).json({
            error: 'Current password is incorrect'
        });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await DatabaseService.prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash: newPasswordHash }
    });

    res.json({
        message: 'Password changed successfully'
    });
}));

// Get user statistics
router.get('/stats', authMiddleware, asyncHandler(async (req, res) => {
    const stats = await DatabaseService.prisma.userStats.findUnique({
        where: { userId: req.user.id }
    });

    if (!stats) {
        // Create default stats if they don't exist
        const newStats = await DatabaseService.prisma.userStats.create({
            data: { userId: req.user.id }
        });
        return res.json({ stats: newStats });
    }

    res.json({ stats });
}));

// Get user analytics
router.get('/analytics', authMiddleware, asyncHandler(async (req, res) => {
    const { timeframe = '30d' } = req.query;

    const analytics = await DatabaseService.getUserAnalytics(req.user.id, timeframe);

    res.json({
        analytics,
        timeframe
    });
}));

// Delete account
router.delete('/account', authMiddleware, [
    body('password').notEmpty(),
    body('confirmation').equals('DELETE')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { password } = req.body;

    // Get user with password hash
    const user = await DatabaseService.prisma.user.findUnique({
        where: { id: req.user.id },
        select: { passwordHash: true }
    });

    // Verify password (if not OAuth user)
    if (user.passwordHash) {
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Password is incorrect'
            });
        }
    }

    // Delete user (cascade will handle related records)
    await DatabaseService.prisma.user.delete({
        where: { id: req.user.id }
    });

    res.json({
        message: 'Account deleted successfully'
    });
}));

// Get user by username (public profile)
router.get('/:username', asyncHandler(async (req, res) => {
    const { username } = req.params;

    const user = await DatabaseService.prisma.user.findUnique({
        where: { username },
        include: {
            profile: {
                select: {
                    displayName: true,
                    bio: true,
                    country: true,
                    mainGame: true,
                    experience: true,
                    showStats: true,
                    showProfile: true,
                    createdAt: true
                }
            },
            stats: {
                select: {
                    totalSessions: true,
                    totalPlayTime: true,
                    bestScore: true,
                    averageAccuracy: true,
                    precisionRating: true,
                    speedRating: true,
                    consistencyRating: true,
                    achievementPoints: true,
                    unlockedAchievements: true
                }
            }
        }
    });

    if (!user) {
        return res.status(404).json({
            error: 'User not found'
        });
    }

    if (!user.profile?.showProfile) {
        return res.status(403).json({
            error: 'Profile is private'
        });
    }

    // Return public profile data
    res.json({
        user: {
            username: user.username,
            plan: user.plan,
            createdAt: user.createdAt,
            profile: user.profile,
            stats: user.profile?.showStats ? user.stats : null
        }
    });
}));

// Update username
router.put('/username', authMiddleware, [
    body('username').isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
    body('password').notEmpty()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { username, password } = req.body;

    // Check if username is already taken
    const existingUser = await DatabaseService.prisma.user.findUnique({
        where: { username }
    });

    if (existingUser && existingUser.id !== req.user.id) {
        return res.status(409).json({
            error: 'Username already taken'
        });
    }

    // Get user with password hash
    const user = await DatabaseService.prisma.user.findUnique({
        where: { id: req.user.id },
        select: { passwordHash: true }
    });

    // Verify password (if not OAuth user)
    if (user.passwordHash) {
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Password is incorrect'
            });
        }
    }

    // Update username
    await DatabaseService.prisma.user.update({
        where: { id: req.user.id },
        data: { username }
    });

    res.json({
        message: 'Username updated successfully',
        username
    });
}));

module.exports = router;