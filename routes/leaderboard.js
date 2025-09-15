/**
 * AimHelper Pro - Leaderboard Routes
 * Global leaderboards, rankings, and competitive features
 */

const express = require('express');
const { query, validationResult } = require('express-validator');

const DatabaseService = require('../services/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get global leaderboard
router.get('/', [
    query('testMode').optional().isIn(['gridshot', 'flick', 'tracking', 'switching']),
    query('difficulty').optional().isIn(['easy', 'medium', 'hard', 'extreme']),
    query('timeframe').optional().isIn(['24h', '7d', '30d', 'all']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
], optionalAuth, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const {
        testMode,
        difficulty,
        timeframe = '30d',
        limit = 50,
        offset = 0
    } = req.query;

    const leaderboard = await DatabaseService.getLeaderboard(
        testMode,
        timeframe,
        parseInt(limit),
        parseInt(offset)
    );

    // Add ranking information
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
        rank: parseInt(offset) + index + 1,
        user: {
            username: entry.user.username,
            displayName: entry.user.profile?.displayName || entry.user.username,
            country: entry.user.profile?.country || null,
            plan: entry.user.plan
        },
        score: entry.score,
        accuracy: Math.round(entry.accuracy * 100) / 100,
        testMode: entry.testMode,
        difficulty: entry.difficulty,
        createdAt: entry.createdAt,
        isCurrentUser: req.user ? entry.userId === req.user.id : false
    }));

    res.json({
        leaderboard: rankedLeaderboard,
        filters: {
            testMode,
            difficulty,
            timeframe
        },
        pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: leaderboard.length === parseInt(limit)
        }
    });
}));

// Get user's ranking
router.get('/rank/:username', [
    query('testMode').optional().isIn(['gridshot', 'flick', 'tracking', 'switching']),
    query('timeframe').optional().isIn(['24h', '7d', '30d', 'all'])
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { username } = req.params;
    const { testMode, timeframe = '30d' } = req.query;

    // Find the user
    const user = await DatabaseService.prisma.user.findUnique({
        where: { username },
        select: { id: true, username: true }
    });

    if (!user) {
        return res.status(404).json({
            error: 'User not found'
        });
    }

    const timeFilter = DatabaseService.getTimeFilter(timeframe);
    const where = {
        ...(testMode && { testMode }),
        ...(timeFilter && { createdAt: { gte: timeFilter } })
    };

    // Get user's best score in the specified criteria
    const userBest = await DatabaseService.prisma.trainingResult.findFirst({
        where: {
            ...where,
            userId: user.id
        },
        orderBy: { score: 'desc' },
        select: {
            score: true,
            accuracy: true,
            testMode: true,
            difficulty: true,
            createdAt: true
        }
    });

    if (!userBest) {
        return res.json({
            user: { username: user.username },
            rank: null,
            message: 'No scores found for the specified criteria'
        });
    }

    // Count how many users have a higher score
    const higherScores = await DatabaseService.prisma.trainingResult.count({
        where: {
            ...where,
            score: { gt: userBest.score }
        }
    });

    const rank = higherScores + 1;

    // Get total participants
    const totalParticipants = await DatabaseService.prisma.trainingResult.groupBy({
        by: ['userId'],
        where,
        _count: { userId: true }
    });

    res.json({
        user: { username: user.username },
        rank,
        totalParticipants: totalParticipants.length,
        percentile: Math.round((1 - (rank - 1) / totalParticipants.length) * 100),
        bestScore: userBest,
        filters: { testMode, timeframe }
    });
}));

// Get leaderboard by test mode
router.get('/testmode/:testMode', [
    query('difficulty').optional().isIn(['easy', 'medium', 'hard', 'extreme']),
    query('timeframe').optional().isIn(['24h', '7d', '30d', 'all']),
    query('limit').optional().isInt({ min: 1, max: 100 })
], optionalAuth, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { testMode } = req.params;
    const { difficulty, timeframe = '30d', limit = 50 } = req.query;

    if (!['gridshot', 'flick', 'tracking', 'switching'].includes(testMode)) {
        return res.status(400).json({
            error: 'Invalid test mode'
        });
    }

    const leaderboard = await DatabaseService.getLeaderboard(
        testMode,
        timeframe,
        parseInt(limit)
    );

    // Filter by difficulty if specified
    const filteredLeaderboard = difficulty
        ? leaderboard.filter(entry => entry.difficulty === difficulty)
        : leaderboard;

    const rankedLeaderboard = filteredLeaderboard.map((entry, index) => ({
        rank: index + 1,
        user: {
            username: entry.user.username,
            displayName: entry.user.profile?.displayName || entry.user.username,
            country: entry.user.profile?.country || null,
            plan: entry.user.plan
        },
        score: entry.score,
        accuracy: Math.round(entry.accuracy * 100) / 100,
        difficulty: entry.difficulty,
        createdAt: entry.createdAt,
        isCurrentUser: req.user ? entry.userId === req.user.id : false
    }));

    res.json({
        testMode,
        leaderboard: rankedLeaderboard,
        filters: { difficulty, timeframe }
    });
}));

// Get country leaderboard
router.get('/country/:country', [
    query('testMode').optional().isIn(['gridshot', 'flick', 'tracking', 'switching']),
    query('timeframe').optional().isIn(['24h', '7d', '30d', 'all']),
    query('limit').optional().isInt({ min: 1, max: 100 })
], optionalAuth, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { country } = req.params;
    const { testMode, timeframe = '30d', limit = 50 } = req.query;

    const timeFilter = DatabaseService.getTimeFilter(timeframe);
    const where = {
        ...(testMode && { testMode }),
        ...(timeFilter && { createdAt: { gte: timeFilter } }),
        user: {
            profile: {
                country: { equals: country, mode: 'insensitive' }
            }
        }
    };

    const results = await DatabaseService.prisma.trainingResult.findMany({
        where,
        orderBy: { score: 'desc' },
        take: parseInt(limit),
        include: {
            user: {
                select: {
                    username: true,
                    plan: true,
                    profile: {
                        select: {
                            displayName: true,
                            country: true
                        }
                    }
                }
            }
        }
    });

    const rankedLeaderboard = results.map((entry, index) => ({
        rank: index + 1,
        user: {
            username: entry.user.username,
            displayName: entry.user.profile?.displayName || entry.user.username,
            country: entry.user.profile?.country,
            plan: entry.user.plan
        },
        score: entry.score,
        accuracy: Math.round(entry.accuracy * 100) / 100,
        testMode: entry.testMode,
        difficulty: entry.difficulty,
        createdAt: entry.createdAt,
        isCurrentUser: req.user ? entry.userId === req.user.id : false
    }));

    res.json({
        country,
        leaderboard: rankedLeaderboard,
        filters: { testMode, timeframe }
    });
}));

// Get top performers (hall of fame)
router.get('/hall-of-fame', optionalAuth, asyncHandler(async (req, res) => {
    // Get top performers for each test mode
    const testModes = ['gridshot', 'flick', 'tracking', 'switching'];

    const hallOfFame = await Promise.all(
        testModes.map(async (testMode) => {
            const topScore = await DatabaseService.prisma.trainingResult.findFirst({
                where: { testMode },
                orderBy: { score: 'desc' },
                include: {
                    user: {
                        select: {
                            username: true,
                            plan: true,
                            profile: {
                                select: {
                                    displayName: true,
                                    country: true
                                }
                            }
                        }
                    }
                }
            });

            return {
                testMode,
                record: topScore ? {
                    user: {
                        username: topScore.user.username,
                        displayName: topScore.user.profile?.displayName || topScore.user.username,
                        country: topScore.user.profile?.country,
                        plan: topScore.user.plan
                    },
                    score: topScore.score,
                    accuracy: Math.round(topScore.accuracy * 100) / 100,
                    difficulty: topScore.difficulty,
                    createdAt: topScore.createdAt,
                    isCurrentUser: req.user ? topScore.userId === req.user.id : false
                } : null
            };
        })
    );

    // Get overall statistics
    const stats = await DatabaseService.prisma.trainingResult.aggregate({
        _count: { id: true },
        _avg: { score: true, accuracy: true }
    });

    const totalUsers = await DatabaseService.prisma.user.count();

    res.json({
        hallOfFame: hallOfFame.filter(entry => entry.record !== null),
        globalStats: {
            totalResults: stats._count.id,
            totalUsers,
            averageScore: Math.round(stats._avg.score || 0),
            averageAccuracy: Math.round((stats._avg.accuracy || 0) * 100) / 100
        }
    });
}));

// Get recent high scores
router.get('/recent-highlights', [
    query('hours').optional().isInt({ min: 1, max: 168 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
], optionalAuth, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { hours = 24, limit = 20 } = req.query;

    const timeFilter = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);

    // Get recent high scores (top 10% of all scores)
    const recentHighScores = await DatabaseService.prisma.trainingResult.findMany({
        where: {
            createdAt: { gte: timeFilter },
            score: { gte: 5000 } // Threshold for "high score"
        },
        orderBy: { score: 'desc' },
        take: parseInt(limit),
        include: {
            user: {
                select: {
                    username: true,
                    plan: true,
                    profile: {
                        select: {
                            displayName: true,
                            country: true
                        }
                    }
                }
            }
        }
    });

    const highlights = recentHighScores.map(entry => ({
        user: {
            username: entry.user.username,
            displayName: entry.user.profile?.displayName || entry.user.username,
            country: entry.user.profile?.country,
            plan: entry.user.plan
        },
        score: entry.score,
        accuracy: Math.round(entry.accuracy * 100) / 100,
        testMode: entry.testMode,
        difficulty: entry.difficulty,
        createdAt: entry.createdAt,
        isCurrentUser: req.user ? entry.userId === req.user.id : false
    }));

    res.json({
        highlights,
        timeframe: `${hours} hours`,
        total: highlights.length
    });
}));

module.exports = router;