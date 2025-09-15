/**
 * AimHelper Pro - Analytics Routes
 * Performance analytics, insights, and data visualization endpoints
 */

const express = require('express');
const { query, validationResult } = require('express-validator');

const DatabaseService = require('../services/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware, requirePlan } = require('../middleware/auth');

const router = express.Router();

// Get user analytics dashboard
router.get('/dashboard', authMiddleware, [
    query('timeframe').optional().isIn(['7d', '30d', '90d', '1y']),
    query('testMode').optional().isIn(['gridshot', 'flick', 'tracking', 'switching'])
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { timeframe = '30d', testMode } = req.query;

    // Get user analytics
    const analytics = await DatabaseService.getUserAnalytics(req.user.id, timeframe);

    // Get time-series data for charts
    const timeFilter = DatabaseService.getTimeFilter(timeframe);
    const where = {
        userId: req.user.id,
        ...(testMode && { testMode }),
        ...(timeFilter && { createdAt: { gte: timeFilter } })
    };

    const results = await DatabaseService.prisma.trainingResult.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        select: {
            score: true,
            accuracy: true,
            averageReactionTime: true,
            consistency: true,
            testMode: true,
            difficulty: true,
            createdAt: true
        }
    });

    // Group data by date for time series
    const dailyStats = {};
    results.forEach(result => {
        const date = result.createdAt.toISOString().split('T')[0];
        if (!dailyStats[date]) {
            dailyStats[date] = {
                scores: [],
                accuracies: [],
                reactionTimes: [],
                consistencies: [],
                sessions: 0
            };
        }
        dailyStats[date].scores.push(result.score);
        dailyStats[date].accuracies.push(result.accuracy);
        dailyStats[date].reactionTimes.push(result.averageReactionTime);
        dailyStats[date].consistencies.push(result.consistency);
        dailyStats[date].sessions++;
    });

    // Calculate daily averages
    const timeSeriesData = Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        averageScore: Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length),
        averageAccuracy: Math.round((stats.accuracies.reduce((a, b) => a + b, 0) / stats.accuracies.length) * 100) / 100,
        averageReactionTime: Math.round(stats.reactionTimes.reduce((a, b) => a + b, 0) / stats.reactionTimes.length),
        averageConsistency: Math.round((stats.consistencies.reduce((a, b) => a + b, 0) / stats.consistencies.length) * 100) / 100,
        sessions: stats.sessions
    }));

    // Get performance by test mode
    const testModePerformance = {};
    ['gridshot', 'flick', 'tracking', 'switching'].forEach(mode => {
        const modeResults = results.filter(r => r.testMode === mode);
        if (modeResults.length > 0) {
            testModePerformance[mode] = DatabaseService.calculateAnalytics(modeResults);
        }
    });

    res.json({
        analytics: {
            ...analytics,
            timeSeriesData,
            testModePerformance,
            totalDataPoints: results.length
        },
        filters: { timeframe, testMode }
    });
}));

// Get detailed performance insights
router.get('/insights', authMiddleware, requirePlan('pro'), [
    query('timeframe').optional().isIn(['7d', '30d', '90d']),
    query('testMode').optional().isIn(['gridshot', 'flick', 'tracking', 'switching'])
], asyncHandler(async (req, res) => {
    const { timeframe = '30d', testMode } = req.query;

    const timeFilter = DatabaseService.getTimeFilter(timeframe);
    const where = {
        userId: req.user.id,
        ...(testMode && { testMode }),
        ...(timeFilter && { createdAt: { gte: timeFilter } })
    };

    const results = await DatabaseService.prisma.trainingResult.findMany({
        where,
        orderBy: { createdAt: 'asc' }
    });

    if (results.length < 5) {
        return res.json({
            insights: [],
            message: 'Complete at least 5 tests to unlock detailed insights'
        });
    }

    const insights = [];

    // Performance trend analysis
    const recentResults = results.slice(-10);
    const earlierResults = results.slice(0, Math.min(10, results.length - 10));

    if (earlierResults.length > 0) {
        const recentAvg = recentResults.reduce((sum, r) => sum + r.score, 0) / recentResults.length;
        const earlierAvg = earlierResults.reduce((sum, r) => sum + r.score, 0) / earlierResults.length;
        const improvement = ((recentAvg - earlierAvg) / earlierAvg) * 100;

        insights.push({
            type: 'trend',
            title: improvement > 5 ? 'Strong Improvement Trend' : improvement < -5 ? 'Performance Decline' : 'Stable Performance',
            description: `Your recent scores are ${Math.abs(improvement).toFixed(1)}% ${improvement > 0 ? 'higher' : 'lower'} than earlier in the period.`,
            value: improvement,
            severity: improvement > 5 ? 'positive' : improvement < -5 ? 'negative' : 'neutral'
        });
    }

    // Consistency analysis
    const scores = results.map(r => r.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    const consistencyScore = Math.max(0, 100 - (stdDev / avgScore) * 100);

    insights.push({
        type: 'consistency',
        title: consistencyScore > 80 ? 'Excellent Consistency' : consistencyScore > 60 ? 'Good Consistency' : 'Room for Consistency Improvement',
        description: `Your performance consistency score is ${consistencyScore.toFixed(1)}%. ${consistencyScore > 80 ? 'You maintain very stable performance across sessions.' : 'Focus on maintaining steady performance between sessions.'}`,
        value: consistencyScore,
        severity: consistencyScore > 80 ? 'positive' : consistencyScore > 60 ? 'neutral' : 'negative'
    });

    // Time-of-day analysis
    const hourlyPerformance = {};
    results.forEach(result => {
        const hour = result.createdAt.getHours();
        if (!hourlyPerformance[hour]) {
            hourlyPerformance[hour] = [];
        }
        hourlyPerformance[hour].push(result.score);
    });

    const hourlyAverages = Object.entries(hourlyPerformance)
        .map(([hour, scores]) => ({
            hour: parseInt(hour),
            average: scores.reduce((a, b) => a + b, 0) / scores.length,
            sessions: scores.length
        }))
        .filter(entry => entry.sessions >= 2);

    if (hourlyAverages.length > 0) {
        const bestHour = hourlyAverages.reduce((best, current) =>
            current.average > best.average ? current : best
        );

        insights.push({
            type: 'timing',
            title: 'Optimal Performance Time',
            description: `You perform best around ${bestHour.hour}:00 with an average score of ${Math.round(bestHour.average)}.`,
            value: bestHour.hour,
            severity: 'neutral'
        });
    }

    // Accuracy vs Speed analysis
    const highAccuracyResults = results.filter(r => r.accuracy > 85);
    const lowAccuracyResults = results.filter(r => r.accuracy < 70);

    if (highAccuracyResults.length > 0 && lowAccuracyResults.length > 0) {
        const highAccuracyAvgReaction = highAccuracyResults.reduce((sum, r) => sum + r.averageReactionTime, 0) / highAccuracyResults.length;
        const lowAccuracyAvgReaction = lowAccuracyResults.reduce((sum, r) => sum + r.averageReactionTime, 0) / lowAccuracyResults.length;

        if (highAccuracyAvgReaction > lowAccuracyAvgReaction * 1.2) {
            insights.push({
                type: 'accuracy_speed',
                title: 'Speed vs Accuracy Trade-off',
                description: 'You achieve higher accuracy when taking more time. Consider finding the optimal balance between speed and precision.',
                value: (highAccuracyAvgReaction - lowAccuracyAvgReaction),
                severity: 'neutral'
            });
        }
    }

    res.json({
        insights,
        dataPoints: results.length,
        timeframe
    });
}));

// Get heatmap data for aim patterns
router.get('/heatmap', authMiddleware, requirePlan('pro'), [
    query('testMode').optional().isIn(['gridshot', 'flick', 'tracking', 'switching']),
    query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
    const { testMode, limit = 50 } = req.query;

    const where = {
        userId: req.user.id,
        ...(testMode && { testMode }),
        hitPositions: { not: null }
    };

    const results = await DatabaseService.prisma.trainingResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        select: {
            hitPositions: true,
            missPositions: true,
            testMode: true,
            createdAt: true
        }
    });

    // Parse and aggregate position data
    const hitData = [];
    const missData = [];

    results.forEach(result => {
        try {
            if (result.hitPositions) {
                const hits = JSON.parse(result.hitPositions);
                hitData.push(...hits);
            }
            if (result.missPositions) {
                const misses = JSON.parse(result.missPositions);
                missData.push(...misses);
            }
        } catch (error) {
            // Skip invalid JSON data
        }
    });

    res.json({
        heatmapData: {
            hits: hitData,
            misses: missData,
            totalHits: hitData.length,
            totalMisses: missData.length
        },
        sessions: results.length,
        testMode
    });
}));

// Get performance comparison with global averages
router.get('/comparison', authMiddleware, [
    query('timeframe').optional().isIn(['30d', '90d', '1y']),
    query('testMode').optional().isIn(['gridshot', 'flick', 'tracking', 'switching'])
], asyncHandler(async (req, res) => {
    const { timeframe = '30d', testMode } = req.query;

    // Get user analytics
    const userAnalytics = await DatabaseService.getUserAnalytics(req.user.id, timeframe);

    // Get global analytics for comparison
    const globalAnalytics = await DatabaseService.getGlobalAnalytics(timeframe);

    // Calculate percentiles
    const timeFilter = DatabaseService.getTimeFilter(timeframe);
    const where = {
        ...(testMode && { testMode }),
        ...(timeFilter && { createdAt: { gte: timeFilter } })
    };

    const allScores = await DatabaseService.prisma.trainingResult.findMany({
        where,
        select: { score: true, accuracy: true, averageReactionTime: true },
        orderBy: { score: 'desc' }
    });

    const userBestScore = await DatabaseService.prisma.trainingResult.findFirst({
        where: {
            userId: req.user.id,
            ...(testMode && { testMode }),
            ...(timeFilter && { createdAt: { gte: timeFilter } })
        },
        orderBy: { score: 'desc' },
        select: { score: true }
    });

    let scorePercentile = 0;
    if (userBestScore && allScores.length > 0) {
        const higherScores = allScores.filter(s => s.score > userBestScore.score).length;
        scorePercentile = Math.round(((allScores.length - higherScores) / allScores.length) * 100);
    }

    res.json({
        comparison: {
            user: {
                averageScore: userAnalytics.averageScore,
                averageAccuracy: userAnalytics.averageAccuracy,
                totalSessions: userAnalytics.totalSessions,
                bestScore: userAnalytics.bestScore,
                improvement: userAnalytics.improvement
            },
            global: {
                averageScore: globalAnalytics.averageAccuracy * 100, // Assuming this maps to score
                averageAccuracy: globalAnalytics.averageAccuracy,
                totalSessions: globalAnalytics.totalSessions,
                totalUsers: globalAnalytics.totalUsers
            },
            percentiles: {
                scorePercentile,
                message: `You score better than ${scorePercentile}% of players`
            }
        },
        timeframe,
        testMode
    });
}));

// Get improvement recommendations
router.get('/recommendations', authMiddleware, asyncHandler(async (req, res) => {
    const userStats = await DatabaseService.prisma.userStats.findUnique({
        where: { userId: req.user.id }
    });

    const recentResults = await DatabaseService.prisma.trainingResult.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    const recommendations = [];

    if (!userStats || userStats.totalSessions < 5) {
        recommendations.push({
            type: 'getting_started',
            title: 'Complete More Sessions',
            description: 'Complete at least 5 training sessions to unlock personalized recommendations.',
            priority: 'high',
            action: 'Start training now'
        });
    } else {
        // Analyze performance patterns
        if (userStats.averageAccuracy < 70) {
            recommendations.push({
                type: 'accuracy',
                title: 'Focus on Accuracy',
                description: 'Your accuracy is below 70%. Try reducing mouse sensitivity or practicing slower, more deliberate movements.',
                priority: 'high',
                action: 'Practice Grid Shot on easy difficulty'
            });
        }

        const recentScores = recentResults.map(r => r.score);
        const avgRecentScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

        if (avgRecentScore < userStats.bestScore * 0.8) {
            recommendations.push({
                type: 'consistency',
                title: 'Improve Consistency',
                description: 'Your recent scores are significantly lower than your best. Focus on maintaining consistent performance.',
                priority: 'medium',
                action: 'Warm up before each session'
            });
        }

        // Test mode specific recommendations
        const testModeStats = {};
        recentResults.forEach(result => {
            if (!testModeStats[result.testMode]) {
                testModeStats[result.testMode] = [];
            }
            testModeStats[result.testMode].push(result.score);
        });

        const weakestMode = Object.entries(testModeStats)
            .map(([mode, scores]) => ({
                mode,
                average: scores.reduce((a, b) => a + b, 0) / scores.length
            }))
            .sort((a, b) => a.average - b.average)[0];

        if (weakestMode) {
            recommendations.push({
                type: 'skill_area',
                title: `Improve ${weakestMode.mode} Performance`,
                description: `Your ${weakestMode.mode} scores are lower than other test modes. Focus on this area for balanced improvement.`,
                priority: 'medium',
                action: `Practice ${weakestMode.mode} tests`
            });
        }
    }

    res.json({
        recommendations,
        userLevel: userStats?.totalSessions || 0 < 10 ? 'beginner' :
                   userStats?.totalSessions < 50 ? 'intermediate' : 'advanced',
        totalSessions: userStats?.totalSessions || 0
    });
}));

module.exports = router;