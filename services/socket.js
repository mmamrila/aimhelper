/**
 * AimHelper Pro - Socket.IO Service
 * Real-time features and multiplayer sessions
 */

const jwt = require('jsonwebtoken');
const DatabaseService = require('./database');

class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map();
        this.activeRooms = new Map();
    }

    initialize(io) {
        this.io = io;

        // Authentication middleware for socket connections
        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

                if (token) {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const user = await DatabaseService.getUserById(decoded.userId);

                    if (user && user.isActive && !user.isBanned) {
                        socket.userId = user.id;
                        socket.username = user.username;
                        socket.plan = user.plan;
                    }
                }

                next();
            } catch (error) {
                // Allow connection even without valid token (for public features)
                next();
            }
        });

        // Connection handling
        io.on('connection', (socket) => {
            this.handleConnection(socket);
        });

        console.log('Socket.IO service initialized');
    }

    handleConnection(socket) {
        console.log(`Socket connected: ${socket.id}${socket.userId ? ` (User: ${socket.username})` : ' (Anonymous)'}`);

        // Store connected user
        if (socket.userId) {
            this.connectedUsers.set(socket.userId, {
                socketId: socket.id,
                username: socket.username,
                plan: socket.plan,
                connectedAt: new Date()
            });

            // Join user's personal room for notifications
            socket.join(`user:${socket.userId}`);

            // Emit user status to friends (if implemented)
            socket.broadcast.emit('user:online', {
                userId: socket.userId,
                username: socket.username
            });
        }

        // Real-time leaderboard updates
        socket.on('join:leaderboard', (data) => {
            const { testMode, difficulty } = data || {};
            const roomName = `leaderboard:${testMode || 'global'}:${difficulty || 'all'}`;
            socket.join(roomName);
            console.log(`User ${socket.username || 'Anonymous'} joined leaderboard room: ${roomName}`);
        });

        socket.on('leave:leaderboard', (data) => {
            const { testMode, difficulty } = data || {};
            const roomName = `leaderboard:${testMode || 'global'}:${difficulty || 'all'}`;
            socket.leave(roomName);
        });

        // Training session events
        socket.on('training:start', (data) => {
            if (!socket.userId) return;

            console.log(`User ${socket.username} started training: ${data.testMode}`);

            // Broadcast to leaderboard rooms if this might affect rankings
            const roomName = `leaderboard:${data.testMode}:${data.difficulty}`;
            socket.to(roomName).emit('training:user_active', {
                username: socket.username,
                testMode: data.testMode,
                difficulty: data.difficulty
            });
        });

        socket.on('training:complete', async (data) => {
            if (!socket.userId) return;

            try {
                console.log(`User ${socket.username} completed training: ${data.score} points`);

                // Check if this score would appear on leaderboards
                const isHighScore = data.score > 5000; // Threshold for "notable" scores

                if (isHighScore) {
                    // Broadcast to relevant leaderboard rooms
                    const globalRoom = 'leaderboard:global:all';
                    const testModeRoom = `leaderboard:${data.testMode}:all`;
                    const specificRoom = `leaderboard:${data.testMode}:${data.difficulty}`;

                    const scoreUpdate = {
                        username: socket.username,
                        score: data.score,
                        accuracy: data.accuracy,
                        testMode: data.testMode,
                        difficulty: data.difficulty,
                        timestamp: new Date()
                    };

                    this.io.to(globalRoom).emit('leaderboard:new_score', scoreUpdate);
                    this.io.to(testModeRoom).emit('leaderboard:new_score', scoreUpdate);
                    this.io.to(specificRoom).emit('leaderboard:new_score', scoreUpdate);
                }

                // Send achievement notifications if any were unlocked
                if (data.achievements && data.achievements.length > 0) {
                    socket.emit('achievements:unlocked', data.achievements);
                }

            } catch (error) {
                console.error('Error handling training completion:', error);
            }
        });

        // Multiplayer session management
        socket.on('multiplayer:create_session', async (data) => {
            if (!socket.userId) return;

            try {
                const session = await DatabaseService.createMultiplayerSession(socket.userId, data);

                const roomName = `session:${session.id}`;
                socket.join(roomName);

                this.activeRooms.set(session.id, {
                    hostId: socket.userId,
                    participants: new Map([[socket.userId, socket.id]]),
                    sessionData: session
                });

                socket.emit('multiplayer:session_created', {
                    sessionId: session.id,
                    roomName
                });

                console.log(`User ${socket.username} created multiplayer session: ${session.id}`);

            } catch (error) {
                socket.emit('multiplayer:error', { message: 'Failed to create session' });
            }
        });

        socket.on('multiplayer:join_session', async (data) => {
            if (!socket.userId) return;

            try {
                const { sessionId } = data;
                await DatabaseService.joinMultiplayerSession(sessionId, socket.userId);

                const roomName = `session:${sessionId}`;
                socket.join(roomName);

                // Update active rooms
                if (this.activeRooms.has(sessionId)) {
                    const room = this.activeRooms.get(sessionId);
                    room.participants.set(socket.userId, socket.id);
                }

                // Notify other participants
                socket.to(roomName).emit('multiplayer:user_joined', {
                    userId: socket.userId,
                    username: socket.username
                });

                socket.emit('multiplayer:joined_session', { sessionId });

                console.log(`User ${socket.username} joined multiplayer session: ${sessionId}`);

            } catch (error) {
                socket.emit('multiplayer:error', { message: error.message });
            }
        });

        socket.on('multiplayer:ready', (data) => {
            const { sessionId } = data;
            const roomName = `session:${sessionId}`;

            socket.to(roomName).emit('multiplayer:user_ready', {
                userId: socket.userId,
                username: socket.username
            });
        });

        socket.on('multiplayer:start_countdown', (data) => {
            if (!socket.userId) return;

            const { sessionId } = data;
            const roomName = `session:${sessionId}`;

            // Verify user is session host
            const room = this.activeRooms.get(sessionId);
            if (room && room.hostId === socket.userId) {
                this.io.to(roomName).emit('multiplayer:countdown_started', {
                    countdown: 3,
                    startTime: Date.now() + 3000
                });

                // Start the actual session after countdown
                setTimeout(() => {
                    this.io.to(roomName).emit('multiplayer:session_started');
                }, 3000);
            }
        });

        // Chat functionality for multiplayer
        socket.on('multiplayer:chat_message', (data) => {
            if (!socket.userId) return;

            const { sessionId, message } = data;
            const roomName = `session:${sessionId}`;

            const chatMessage = {
                userId: socket.userId,
                username: socket.username,
                message: message.substring(0, 200), // Limit message length
                timestamp: new Date()
            };

            this.io.to(roomName).emit('multiplayer:chat_message', chatMessage);
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}${socket.userId ? ` (User: ${socket.username})` : ' (Anonymous)'}`);

            if (socket.userId) {
                // Remove from connected users
                this.connectedUsers.delete(socket.userId);

                // Notify friends of offline status
                socket.broadcast.emit('user:offline', {
                    userId: socket.userId,
                    username: socket.username
                });

                // Handle multiplayer session cleanup
                for (const [sessionId, room] of this.activeRooms.entries()) {
                    if (room.participants.has(socket.userId)) {
                        room.participants.delete(socket.userId);

                        // Notify other participants
                        const roomName = `session:${sessionId}`;
                        socket.to(roomName).emit('multiplayer:user_left', {
                            userId: socket.userId,
                            username: socket.username
                        });

                        // Clean up empty rooms
                        if (room.participants.size === 0) {
                            this.activeRooms.delete(sessionId);
                        }
                    }
                }
            }
        });

        // Ping/pong for connection health
        socket.on('ping', () => {
            socket.emit('pong');
        });
    }

    // Utility methods for external use
    broadcastToLeaderboard(testMode, difficulty, event, data) {
        const roomName = `leaderboard:${testMode || 'global'}:${difficulty || 'all'}`;
        if (this.io) {
            this.io.to(roomName).emit(event, data);
        }
    }

    sendToUser(userId, event, data) {
        const roomName = `user:${userId}`;
        if (this.io) {
            this.io.to(roomName).emit(event, data);
        }
    }

    broadcastGlobal(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }

    getConnectedUsers() {
        return Array.from(this.connectedUsers.values());
    }

    getActiveRooms() {
        return Array.from(this.activeRooms.entries()).map(([id, room]) => ({
            sessionId: id,
            hostId: room.hostId,
            participantCount: room.participants.size,
            sessionData: room.sessionData
        }));
    }
}

module.exports = new SocketService();