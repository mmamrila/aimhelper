/**
 * AimHelper Pro - Training Routes
 * Test results, session management, and training data
 */

const express = require('express');
const { body, validationResult } = require('express-validator');

const DatabaseService = require('../services/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Submit training result
router.post('/results', authMiddleware, [
    body('testMode').isIn(['gridshot', 'flick', 'tracking', 'switching']),
    body('difficulty').isIn(['easy', 'medium', 'hard', 'extreme']),
    body('duration').isInt({ min: 10, max: 300 }),
    body('targetSize').isIn(['large', 'medium', 'small', 'tiny']),
    body('score').isInt({ min: 0 }),
    body('accuracy').isFloat({ min: 0, max: 100 }),
    body('totalShots').isInt({ min: 0 }),
    body('totalHits').isInt({ min: 0 }),
    body('totalMisses').isInt({ min: 0 }),
    body('averageReactionTime').isFloat({ min: 0 }),
    body('killsPerSecond').isFloat({ min: 0 }),
    body('consistency').isFloat({ min: 0, max: 100 }),
    body('streakBest').isInt({ min: 0 })
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const {
        testMode, difficulty, duration, targetSize, score, accuracy,
        totalShots, totalHits, totalMisses, averageReactionTime,
        killsPerSecond, consistency, streakBest, flickDistance,
        trackingAccuracy, switchSpeed, hitPositions, missPositions,
        timingData, deviceInfo, sessionId
    } = req.body;

    // Validate shot counts
    if (totalShots !== totalHits + totalMisses) {
        return res.status(400).json({
            error: 'Shot count mismatch: totalShots must equal totalHits + totalMisses'
        });
    }

    // Save training result
    const result = await DatabaseService.saveTrainingResult(req.user.id, {
        testMode,
        difficulty,
        duration,
        targetSize,
        score,
        accuracy,
        totalShots,
        totalHits,
        totalMisses,
        averageReactionTime,
        killsPerSecond,
        consistency,
        streakBest,
        flickDistance: flickDistance ? JSON.stringify(flickDistance) : null,
        trackingAccuracy,
        switchSpeed: switchSpeed ? JSON.stringify(switchSpeed) : null,
        hitPositions: hitPositions ? JSON.stringify(hitPositions) : null,
        missPositions: missPositions ? JSON.stringify(missPositions) : null,
        timingData: timingData ? JSON.stringify(timingData) : null,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
        sessionId
    });

    res.status(201).json({
        message: 'Training result saved successfully',
        result: {
            id: result.id,
            score: result.score,
            accuracy: result.accuracy,
            createdAt: result.createdAt
        }
    });
}));

// Get user's training results
router.get('/results', authMiddleware, asyncHandler(async (req, res) => {
    const {
        limit = 50,
        offset = 0,
        testMode,
        difficulty,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const where = {
        userId: req.user.id,
        ...(testMode && { testMode }),
        ...(difficulty && { difficulty })
    };

    const orderBy = {
        [sortBy]: sortOrder
    };

    const results = await DatabaseService.prisma.trainingResult.findMany({
        where,
        orderBy,
        take: parseInt(limit),
        skip: parseInt(offset),
        select: {
            id: true,
            testMode: true,
            difficulty: true,
            duration: true,
            targetSize: true,
            score: true,
            accuracy: true,
            totalShots: true,
            totalHits: true,
            totalMisses: true,
            averageReactionTime: true,
            killsPerSecond: true,
            consistency: true,
            streakBest: true,
            createdAt: true
        }
    });

    const totalCount = await DatabaseService.prisma.trainingResult.count({
        where
    });

    res.json({
        results,
        pagination: {
            total: totalCount,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: parseInt(offset) + parseInt(limit) < totalCount
        }
    });
}));

// Get specific training result
router.get('/results/:id', authMiddleware, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await DatabaseService.prisma.trainingResult.findFirst({
        where: {
            id,
            userId: req.user.id
        },
        include: {
            session: {
                select: {
                    name: true,
                    participants: {
                        include: {
                            user: {
                                select: {
                                    username: true,
                                    profile: {
                                        select: { displayName: true }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!result) {
        return res.status(404).json({
            error: 'Training result not found'
        });
    }

    // Parse JSON fields
    const parsedResult = {
        ...result,
        flickDistance: result.flickDistance ? JSON.parse(result.flickDistance) : null,
        switchSpeed: result.switchSpeed ? JSON.parse(result.switchSpeed) : null,
        hitPositions: result.hitPositions ? JSON.parse(result.hitPositions) : null,
        missPositions: result.missPositions ? JSON.parse(result.missPositions) : null,
        timingData: result.timingData ? JSON.parse(result.timingData) : null,
        deviceInfo: result.deviceInfo ? JSON.parse(result.deviceInfo) : null
    };

    res.json({ result: parsedResult });
}));

// Delete training result
router.delete('/results/:id', authMiddleware, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await DatabaseService.prisma.trainingResult.findFirst({
        where: {
            id,
            userId: req.user.id
        }
    });

    if (!result) {
        return res.status(404).json({
            error: 'Training result not found'
        });
    }

    await DatabaseService.prisma.trainingResult.delete({
        where: { id }
    });

    res.json({
        message: 'Training result deleted successfully'
    });
}));

// Get training statistics
router.get('/stats', authMiddleware, asyncHandler(async (req, res) => {
    const { timeframe = '30d', testMode } = req.query;

    const timeFilter = DatabaseService.getTimeFilter(timeframe);
    const where = {
        userId: req.user.id,
        ...(testMode && { testMode }),
        ...(timeFilter && { createdAt: { gte: timeFilter } })
    };

    const [results, aggregates] = await Promise.all([
        DatabaseService.prisma.trainingResult.findMany({
            where,
            orderBy: { createdAt: 'asc' },
            select: {
                score: true,
                accuracy: true,
                averageReactionTime: true,
                consistency: true,
                createdAt: true,
                testMode: true
            }
        }),
        DatabaseService.prisma.trainingResult.aggregate({
            where,
            _count: { id: true },
            _avg: {
                score: true,
                accuracy: true,
                averageReactionTime: true,
                consistency: true
            },
            _max: {
                score: true,
                accuracy: true,
                consistency: true
            },
            _min: {
                averageReactionTime: true
            }
        })
    ]);

    // Calculate additional statistics
    const analytics = DatabaseService.calculateAnalytics(results);

    // Group by test mode
    const byTestMode = results.reduce((acc, result) => {
        if (!acc[result.testMode]) {
            acc[result.testMode] = [];
        }
        acc[result.testMode].push(result);
        return acc;
    }, {});

    const testModeStats = Object.entries(byTestMode).map(([mode, modeResults]) => ({
        testMode: mode,
        count: modeResults.length,
        ...DatabaseService.calculateAnalytics(modeResults)
    }));

    res.json({
        statistics: {
            ...analytics,
            aggregates: {
                totalSessions: aggregates._count.id,
                averageScore: Math.round(aggregates._avg.score || 0),
                averageAccuracy: Math.round((aggregates._avg.accuracy || 0) * 100) / 100,
                averageReactionTime: Math.round(aggregates._avg.averageReactionTime || 0),
                averageConsistency: Math.round((aggregates._avg.consistency || 0) * 100) / 100,
                bestScore: aggregates._max.score || 0,
                bestAccuracy: Math.round((aggregates._max.accuracy || 0) * 100) / 100,
                bestConsistency: Math.round((aggregates._max.consistency || 0) * 100) / 100,
                bestReactionTime: Math.round(aggregates._min.averageReactionTime || 0)
            },
            byTestMode: testModeStats
        },
        timeframe
    });
}));

// Get personal best scores
router.get('/personal-bests', authMiddleware, asyncHandler(async (req, res) => {
    const { testMode } = req.query;

    const where = {
        userId: req.user.id,
        ...(testMode && { testMode })
    };

    // Get best scores for each test mode and difficulty combination
    const personalBests = await DatabaseService.prisma.trainingResult.groupBy({
        by: ['testMode', 'difficulty'],
        where,
        _max: {
            score: true,
            accuracy: true,
            consistency: true
        },
        _min: {
            averageReactionTime: true
        }
    });

    // Get the actual records for these bests
    const bestRecords = await Promise.all(
        personalBests.map(async (pb) => {
            const record = await DatabaseService.prisma.trainingResult.findFirst({
                where: {
                    userId: req.user.id,
                    testMode: pb.testMode,
                    difficulty: pb.difficulty,
                    score: pb._max.score
                },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    testMode: true,
                    difficulty: true,
                    score: true,
                    accuracy: true,
                    averageReactionTime: true,
                    consistency: true,
                    createdAt: true
                }
            });

            return {
                ...record,
                category: `${pb.testMode}_${pb.difficulty}`,
                bests: {
                    score: pb._max.score,
                    accuracy: pb._max.accuracy,
                    consistency: pb._max.consistency,
                    reactionTime: pb._min.averageReactionTime
                }
            };
        })
    );

    res.json({
        personalBests: bestRecords.filter(record => record !== null)
    });
}));

// Export training data
router.get('/export', authMiddleware, asyncHandler(async (req, res) => {
    const { format = 'json', timeframe } = req.query;

    const timeFilter = DatabaseService.getTimeFilter(timeframe);
    const where = {
        userId: req.user.id,
        ...(timeFilter && { createdAt: { gte: timeFilter } })
    };

    const results = await DatabaseService.prisma.trainingResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    username: true,
                    profile: {
                        select: {
                            displayName: true,
                            mouseDPI: true,
                            mouseSensitivity: true
                        }
                    }
                }
            }
        }
    });

    if (format === 'csv') {
        // Convert to CSV format
        const csvHeaders = [
            'Date', 'Test Mode', 'Difficulty', 'Duration', 'Score', 'Accuracy',
            'Total Shots', 'Total Hits', 'Reaction Time', 'Consistency'
        ].join(',');

        const csvRows = results.map(result => [
            result.createdAt.toISOString(),
            result.testMode,
            result.difficulty,
            result.duration,
            result.score,
            result.accuracy,
            result.totalShots,
            result.totalHits,
            result.averageReactionTime,
            result.consistency
        ].join(','));

        const csvContent = [csvHeaders, ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="aimhelper-training-data-${Date.now()}.csv"`);
        res.send(csvContent);
    } else {
        // JSON format
        res.json({
            exportedAt: new Date().toISOString(),
            totalRecords: results.length,
            timeframe,
            data: results
        });
    }
}));

module.exports = router;