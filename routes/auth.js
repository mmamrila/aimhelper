/**
 * AimHelper Pro - Authentication Routes
 * User registration, login, password reset, and OAuth
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const DatabaseService = require('../services/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user exists with Google ID
            let user = await DatabaseService.prisma.user.findUnique({
                where: { googleId: profile.id }
            });

            if (user) {
                return done(null, user);
            }

            // Check if user exists with email
            user = await DatabaseService.prisma.user.findUnique({
                where: { email: profile.emails[0].value }
            });

            if (user) {
                // Link Google account to existing user
                user = await DatabaseService.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        googleId: profile.id,
                        emailVerified: true,
                        emailVerifiedAt: new Date()
                    }
                });
                return done(null, user);
            }

            // Create new user
            user = await DatabaseService.prisma.user.create({
                data: {
                    email: profile.emails[0].value,
                    username: profile.emails[0].value.split('@')[0],
                    googleId: profile.id,
                    emailVerified: true,
                    emailVerifiedAt: new Date(),
                    profile: {
                        create: {
                            displayName: profile.displayName
                        }
                    },
                    stats: {
                        create: {}
                    }
                }
            });

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));
}

// Email configuration
let emailTransporter = null;
if (process.env.SMTP_HOST) {
    emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

// Validation rules
const registerValidation = [
    body('email').isEmail().normalizeEmail(),
    body('username').isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
];

const loginValidation = [
    body('emailOrUsername').notEmpty(),
    body('password').notEmpty(),
];

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Register endpoint
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { email, username, password } = req.body;

    // Check if user already exists
    const existingUser = await DatabaseService.prisma.user.findFirst({
        where: {
            OR: [
                { email },
                { username }
            ]
        }
    });

    if (existingUser) {
        return res.status(409).json({
            error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
        });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await DatabaseService.prisma.user.create({
        data: {
            email,
            username,
            passwordHash,
            profile: {
                create: {
                    displayName: username
                }
            },
            stats: {
                create: {}
            }
        },
        select: {
            id: true,
            email: true,
            username: true,
            emailVerified: true,
            plan: true,
            createdAt: true
        }
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
        message: 'Registration successful',
        user,
        token
    });
}));

// Login endpoint
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { emailOrUsername, password } = req.body;

    // Find user by email or username
    const user = await DatabaseService.prisma.user.findFirst({
        where: {
            OR: [
                { email: emailOrUsername },
                { username: emailOrUsername }
            ]
        }
    });

    if (!user || !user.passwordHash) {
        return res.status(401).json({
            error: 'Invalid credentials'
        });
    }

    // Check if account is banned
    if (user.isBanned) {
        return res.status(403).json({
            error: 'Account is banned',
            bannedUntil: user.bannedUntil
        });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
        return res.status(401).json({
            error: 'Invalid credentials'
        });
    }

    // Update last login
    await DatabaseService.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
    });

    // Generate token
    const token = generateToken(user.id);

    res.json({
        message: 'Login successful',
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            plan: user.plan,
            emailVerified: user.emailVerified
        },
        token
    });
}));

// Logout endpoint
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
    // In a more sophisticated setup, you might blacklist the token
    res.json({ message: 'Logout successful' });
}));

// Forgot password endpoint
router.post('/forgot-password', asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            error: 'Email is required'
        });
    }

    const user = await DatabaseService.prisma.user.findUnique({
        where: { email }
    });

    // Always return success to prevent email enumeration
    if (!user) {
        return res.json({
            message: 'If an account with that email exists, a password reset link has been sent.'
        });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token (you might want to create a separate table for this)
    await DatabaseService.prisma.user.update({
        where: { id: user.id },
        data: {
            // Note: You'll need to add these fields to your User model
            // resetPasswordToken: resetToken,
            // resetPasswordExpiry: resetTokenExpiry
        }
    });

    // Send email if transporter is configured
    if (emailTransporter) {
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

        await emailTransporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: email,
            subject: 'AimHelper Pro - Password Reset',
            html: `
                <h2>Password Reset Request</h2>
                <p>You requested a password reset for your AimHelper Pro account.</p>
                <p>Click the link below to reset your password:</p>
                <a href="${resetUrl}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });
    }

    res.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
    });
}));

// Reset password endpoint
router.post('/reset-password', asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({
            error: 'Token and new password are required'
        });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({
            error: 'Password must be at least 8 characters long'
        });
    }

    // Find user with valid reset token
    // Note: This requires adding reset token fields to your User model
    const user = await DatabaseService.prisma.user.findFirst({
        where: {
            // resetPasswordToken: token,
            // resetPasswordExpiry: { gte: new Date() }
        }
    });

    if (!user) {
        return res.status(400).json({
            error: 'Invalid or expired reset token'
        });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await DatabaseService.prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash,
            // resetPasswordToken: null,
            // resetPasswordExpiry: null
        }
    });

    res.json({
        message: 'Password reset successful'
    });
}));

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    asyncHandler(async (req, res) => {
        const token = generateToken(req.user.id);

        // Redirect to frontend with token
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
    })
);

// Verify token endpoint
router.get('/verify', authMiddleware, asyncHandler(async (req, res) => {
    res.json({
        user: req.user,
        valid: true
    });
}));

// Refresh token endpoint
router.post('/refresh', authMiddleware, asyncHandler(async (req, res) => {
    const newToken = generateToken(req.user.id);

    res.json({
        token: newToken
    });
}));

module.exports = router;