/**
 * AimHelper Pro - Database Service
 * Comprehensive database operations and connection management
 */

const { PrismaClient } = require('@prisma/client');
const winston = require('winston');

class DatabaseService {
    constructor() {
        this.prisma = null;
        this.isConnected = false;
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            defaultMeta: { service: 'database' },
        });
    }

    async initialize() {
        try {
            this.prisma = new PrismaClient({
                log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
                errorFormat: 'pretty',
            });

            // Test connection
            await this.prisma.$connect();
            this.isConnected = true;

            this.logger.info('Database connection established successfully');
            return this.prisma;
        } catch (error) {
            this.logger.error('Failed to connect to database:', error);
            throw error;
        }
    }

    async close() {
        if (this.prisma) {
            await this.prisma.$disconnect();
            this.isConnected = false;
            this.logger.info('Database connection closed');
        }
    }

    // User operations
    async createUser(userData) {
        try {
            const user = await this.prisma.user.create({
                data: {
                    ...userData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    plan: true,
                    profile: true,
                    createdAt: true
                }
            });

            this.logger.info(`User created: ${user.email}`);
            return user;
        } catch (error) {
            this.logger.error('Error creating user:', error);
            throw error;
        }
    }

    async getUserByEmail(email) {
        try {
            return await this.prisma.user.findUnique({
                where: { email },
                include: {
                    profile: true,
                    subscription: true,
                    trainingResults: {
                        orderBy: { createdAt: 'desc' },
                        take: 10
                    }
                }
            });
        } catch (error) {
            this.logger.error('Error fetching user by email:', error);
            throw error;
        }
    }

    async getUserById(id) {
        try {
            return await this.prisma.user.findUnique({
                where: { id },
                include: {
                    profile: true,
                    subscription: true
                }
            });
        } catch (error) {
            this.logger.error('Error fetching user by ID:', error);
            throw error;
        }
    }

    async updateUser(id, userData) {
        try {
            return await this.prisma.user.update({
                where: { id },
                data: {
                    ...userData,
                    updatedAt: new Date()
                },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    plan: true,
                    profile: true,
                    updatedAt: true
                }
            });
        } catch (error) {
            this.logger.error('Error updating user:', error);
            throw error;
        }
    }

    // Training results operations
    async saveTrainingResult(userId, resultData) {
        try {
            const result = await this.prisma.trainingResult.create({
                data: {
                    userId,
                    ...resultData,
                    createdAt: new Date()
                }
            });

            // Update user statistics
            await this.updateUserStats(userId, resultData);

            this.logger.info(`Training result saved for user ${userId}`);
            return result;
        } catch (error) {
            this.logger.error('Error saving training result:', error);
            throw error;
        }
    }

    async getTrainingResults(userId, limit = 50, offset = 0) {
        try {
            return await this.prisma.trainingResult.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
                include: {
                    user: {
                        select: {
                            username: true,
                            profile: {
                                select: {
                                    displayName: true
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            this.logger.error('Error fetching training results:', error);
            throw error;
        }
    }

    async getLeaderboard(testMode = null, timeframe = '24h', limit = 100) {
        try {
            const timeFilter = this.getTimeFilter(timeframe);

            const where = {
                ...(testMode && { testMode }),
                ...(timeFilter && { createdAt: { gte: timeFilter } })
            };

            return await this.prisma.trainingResult.findMany({
                where,
                orderBy: { score: 'desc' },
                take: limit,
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
        } catch (error) {
            this.logger.error('Error fetching leaderboard:', error);
            throw error;
        }
    }

    // Analytics operations
    async getUserAnalytics(userId, timeframe = '30d') {
        try {
            const timeFilter = this.getTimeFilter(timeframe);

            const results = await this.prisma.trainingResult.findMany({
                where: {
                    userId,
                    ...(timeFilter && { createdAt: { gte: timeFilter } })
                },
                orderBy: { createdAt: 'asc' }
            });

            // Calculate analytics
            const analytics = this.calculateAnalytics(results);

            return analytics;
        } catch (error) {
            this.logger.error('Error calculating user analytics:', error);
            throw error;
        }
    }

    async getGlobalAnalytics(timeframe = '24h') {
        try {
            const timeFilter = this.getTimeFilter(timeframe);

            const [totalUsers, totalSessions, averageAccuracy, topScores] = await Promise.all([
                this.prisma.user.count(),
                this.prisma.trainingResult.count({
                    where: timeFilter ? { createdAt: { gte: timeFilter } } : {}
                }),
                this.prisma.trainingResult.aggregate({
                    where: timeFilter ? { createdAt: { gte: timeFilter } } : {},
                    _avg: { accuracy: true }
                }),
                this.prisma.trainingResult.findMany({
                    where: timeFilter ? { createdAt: { gte: timeFilter } } : {},
                    orderBy: { score: 'desc' },
                    take: 10,
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
                })
            ]);

            return {
                totalUsers,
                totalSessions,
                averageAccuracy: averageAccuracy._avg.accuracy || 0,
                topScores,
                timeframe
            };
        } catch (error) {
            this.logger.error('Error calculating global analytics:', error);
            throw error;
        }
    }

    // Subscription operations
    async createSubscription(userId, subscriptionData) {
        try {
            return await this.prisma.subscription.create({
                data: {
                    userId,
                    ...subscriptionData,
                    createdAt: new Date()
                }
            });
        } catch (error) {
            this.logger.error('Error creating subscription:', error);
            throw error;
        }
    }

    async updateSubscription(userId, subscriptionData) {
        try {
            return await this.prisma.subscription.upsert({
                where: { userId },
                update: {
                    ...subscriptionData,
                    updatedAt: new Date()
                },
                create: {
                    userId,
                    ...subscriptionData,
                    createdAt: new Date()
                }
            });
        } catch (error) {
            this.logger.error('Error updating subscription:', error);
            throw error;
        }
    }

    // Multiplayer session operations
    async createMultiplayerSession(hostId, sessionData) {
        try {
            return await this.prisma.multiplayerSession.create({
                data: {
                    hostId,
                    ...sessionData,
                    status: 'waiting',
                    createdAt: new Date()
                }
            });
        } catch (error) {
            this.logger.error('Error creating multiplayer session:', error);
            throw error;
        }
    }

    async joinMultiplayerSession(sessionId, userId) {
        try {
            const session = await this.prisma.multiplayerSession.findUnique({
                where: { id: sessionId },
                include: { participants: true }
            });

            if (!session) {
                throw new Error('Session not found');
            }

            if (session.participants.length >= session.maxPlayers) {
                throw new Error('Session is full');
            }

            return await this.prisma.multiplayerParticipant.create({
                data: {
                    sessionId,
                    userId,
                    joinedAt: new Date()
                }
            });
        } catch (error) {
            this.logger.error('Error joining multiplayer session:', error);
            throw error;
        }
    }

    // Helper methods
    getTimeFilter(timeframe) {
        const now = new Date();

        switch (timeframe) {
            case '1h':
                return new Date(now - 60 * 60 * 1000);
            case '24h':
                return new Date(now - 24 * 60 * 60 * 1000);
            case '7d':
                return new Date(now - 7 * 24 * 60 * 60 * 1000);
            case '30d':
                return new Date(now - 30 * 24 * 60 * 60 * 1000);
            case '90d':
                return new Date(now - 90 * 24 * 60 * 60 * 1000);
            default:
                return null;
        }
    }

    calculateAnalytics(results) {
        if (!results || results.length === 0) {
            return {
                totalSessions: 0,
                averageAccuracy: 0,
                averageScore: 0,
                bestScore: 0,
                improvement: 0,
                consistencyScore: 0
            };
        }

        const totalSessions = results.length;
        const scores = results.map(r => r.score || 0);
        const accuracies = results.map(r => r.accuracy || 0);

        const averageScore = scores.reduce((a, b) => a + b, 0) / totalSessions;
        const averageAccuracy = accuracies.reduce((a, b) => a + b, 0) / totalSessions;
        const bestScore = Math.max(...scores);

        // Calculate improvement (comparing first half to second half)
        const halfPoint = Math.floor(totalSessions / 2);
        const firstHalf = scores.slice(0, halfPoint);
        const secondHalf = scores.slice(halfPoint);

        const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const improvement = secondHalfAvg - firstHalfAvg;

        // Calculate consistency (inverse of standard deviation)
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / totalSessions;
        const standardDeviation = Math.sqrt(variance);
        const consistencyScore = Math.max(0, 100 - (standardDeviation / averageScore) * 100);

        return {
            totalSessions,
            averageAccuracy: Math.round(averageAccuracy * 100) / 100,
            averageScore: Math.round(averageScore),
            bestScore: Math.round(bestScore),
            improvement: Math.round(improvement),
            consistencyScore: Math.round(consistencyScore * 100) / 100
        };
    }

    async updateUserStats(userId, resultData) {
        try {
            const currentStats = await this.prisma.userStats.findUnique({
                where: { userId }
            });

            const newStats = {
                totalSessions: (currentStats?.totalSessions || 0) + 1,
                totalPlayTime: (currentStats?.totalPlayTime || 0) + (resultData.duration || 0),
                bestScore: Math.max(currentStats?.bestScore || 0, resultData.score || 0),
                totalShots: (currentStats?.totalShots || 0) + (resultData.totalShots || 0),
                totalHits: (currentStats?.totalHits || 0) + (resultData.totalHits || 0),
                updatedAt: new Date()
            };

            await this.prisma.userStats.upsert({
                where: { userId },
                update: newStats,
                create: {
                    userId,
                    ...newStats,
                    createdAt: new Date()
                }
            });
        } catch (error) {
            this.logger.error('Error updating user stats:', error);
        }
    }

    // Health check
    async healthCheck() {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return { status: 'healthy', connected: this.isConnected };
        } catch (error) {
            return { status: 'unhealthy', connected: false, error: error.message };
        }
    }
}

module.exports = new DatabaseService();