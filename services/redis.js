/**
 * AimHelper Pro - Redis Service
 * Caching and session management
 */

const redis = require('redis');
const winston = require('winston');

class RedisService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            defaultMeta: { service: 'redis' },
        });
    }

    async initialize() {
        try {
            // Create Redis client with limited retry attempts
            this.client = redis.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                password: process.env.REDIS_PASSWORD || undefined,
                database: parseInt(process.env.REDIS_DB) || 0,
                socket: {
                    connectTimeout: 5000,
                    lazyConnect: true
                }
            });

            // Event handlers
            this.client.on('error', (err) => {
                this.logger.error('Redis error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                this.logger.info('Redis connected');
                this.isConnected = true;
            });

            this.client.on('ready', () => {
                this.logger.info('Redis ready');
            });

            this.client.on('end', () => {
                this.logger.info('Redis connection ended');
                this.isConnected = false;
            });

            // Try to connect to Redis with timeout
            const connectPromise = this.client.connect();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
            );

            await Promise.race([connectPromise, timeoutPromise]);
            return this.client;
        } catch (error) {
            this.logger.warn('Redis unavailable, continuing without cache:', error.message);
            this.client = null;
            this.isConnected = false;
            // Don't throw - allow server to continue without Redis
            return null;
        }
    }

    async close() {
        if (this.client && this.isConnected) {
            await this.client.disconnect();
            this.isConnected = false;
            this.logger.info('Redis connection closed');
        }
    }

    // Cache operations
    async get(key) {
        try {
            if (!this.isConnected) return null;
            return await this.client.get(key);
        } catch (error) {
            this.logger.error('Redis GET error:', error);
            return null;
        }
    }

    async set(key, value, ttl = 3600) {
        try {
            if (!this.isConnected) return false;
            await this.client.setEx(key, ttl, value);
            return true;
        } catch (error) {
            this.logger.error('Redis SET error:', error);
            return false;
        }
    }

    async del(key) {
        try {
            if (!this.isConnected) return false;
            await this.client.del(key);
            return true;
        } catch (error) {
            this.logger.error('Redis DEL error:', error);
            return false;
        }
    }

    async exists(key) {
        try {
            if (!this.isConnected) return false;
            return await this.client.exists(key);
        } catch (error) {
            this.logger.error('Redis EXISTS error:', error);
            return false;
        }
    }

    // Cache with JSON serialization
    async setJSON(key, data, ttl = 3600) {
        try {
            const serialized = JSON.stringify(data);
            return await this.set(key, serialized, ttl);
        } catch (error) {
            this.logger.error('Redis setJSON error:', error);
            return false;
        }
    }

    async getJSON(key) {
        try {
            const data = await this.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            this.logger.error('Redis getJSON error:', error);
            return null;
        }
    }

    // Rate limiting
    async checkRateLimit(key, limit, window) {
        try {
            if (!this.isConnected) return { allowed: true, remaining: limit };

            const current = await this.client.incr(key);

            if (current === 1) {
                await this.client.expire(key, window);
            }

            const ttl = await this.client.ttl(key);

            return {
                allowed: current <= limit,
                remaining: Math.max(0, limit - current),
                resetTime: ttl > 0 ? Date.now() + (ttl * 1000) : null
            };
        } catch (error) {
            this.logger.error('Redis rate limit error:', error);
            return { allowed: true, remaining: limit };
        }
    }

    // Leaderboard operations
    async addToLeaderboard(leaderboardKey, score, member) {
        try {
            if (!this.isConnected) return false;
            await this.client.zAdd(leaderboardKey, { score, value: member });
            return true;
        } catch (error) {
            this.logger.error('Redis leaderboard add error:', error);
            return false;
        }
    }

    async getLeaderboard(leaderboardKey, start = 0, end = -1) {
        try {
            if (!this.isConnected) return [];
            return await this.client.zRevRangeWithScores(leaderboardKey, start, end);
        } catch (error) {
            this.logger.error('Redis leaderboard get error:', error);
            return [];
        }
    }

    async getUserRank(leaderboardKey, member) {
        try {
            if (!this.isConnected) return null;
            return await this.client.zRevRank(leaderboardKey, member);
        } catch (error) {
            this.logger.error('Redis user rank error:', error);
            return null;
        }
    }

    // Session storage
    async storeSession(sessionId, sessionData, ttl = 86400) {
        const key = `session:${sessionId}`;
        return await this.setJSON(key, sessionData, ttl);
    }

    async getSession(sessionId) {
        const key = `session:${sessionId}`;
        return await this.getJSON(key);
    }

    async deleteSession(sessionId) {
        const key = `session:${sessionId}`;
        return await this.del(key);
    }

    // Health check
    async healthCheck() {
        try {
            if (!this.isConnected) {
                return { status: 'unhealthy', connected: false };
            }

            await this.client.ping();
            return { status: 'healthy', connected: true };
        } catch (error) {
            return { status: 'unhealthy', connected: false, error: error.message };
        }
    }
}

module.exports = new RedisService();