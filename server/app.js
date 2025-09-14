const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const { v4: uuidv4 } = require('uuid');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Game-specific optimization profiles
const gameProfiles = {
  'valorant': {
    name: 'Valorant',
    optimalRange: { min: 20, max: 40 }, // cm/360
    testWeights: { accuracy: 0.5, reaction: 0.3, consistency: 0.2 },
    dpiRecommendation: { min: 400, max: 1600 },
    description: 'Tactical shooter requiring high precision and micro-adjustments',
    mousepadSize: 'Large (45cm+) recommended for crosshair placement',
    testDuration: { gridShot: 45, flickTest: 25, consistency: 30 }
  },
  'csgo': {
    name: 'CS:GO', 
    optimalRange: { min: 25, max: 50 },
    testWeights: { accuracy: 0.6, reaction: 0.2, consistency: 0.2 },
    dpiRecommendation: { min: 400, max: 800 },
    description: 'Competitive FPS focused on precision aiming and crosshair placement',
    mousepadSize: 'Extra Large (60cm+) for low sensitivity precision',
    testDuration: { gridShot: 60, flickTest: 30, consistency: 40 }
  },
  'apex': {
    name: 'Apex Legends',
    optimalRange: { min: 15, max: 30 },
    testWeights: { accuracy: 0.4, reaction: 0.4, consistency: 0.2 },
    dpiRecommendation: { min: 800, max: 1600 },
    description: 'Fast-paced BR requiring quick target acquisition and tracking',
    mousepadSize: 'Large (45cm) for balanced aim and movement',
    testDuration: { gridShot: 45, flickTest: 35, consistency: 25 }
  },
  'overwatch': {
    name: 'Overwatch 2',
    optimalRange: { min: 18, max: 35 },
    testWeights: { accuracy: 0.35, reaction: 0.35, consistency: 0.3 },
    dpiRecommendation: { min: 800, max: 1600 },
    description: 'Hero shooter with diverse aim requirements and fast gameplay',
    mousepadSize: 'Large (45cm) for versatile hero switching',
    testDuration: { gridShot: 50, flickTest: 30, consistency: 30 }
  },
  'cod': {
    name: 'Call of Duty',
    optimalRange: { min: 12, max: 25 },
    testWeights: { accuracy: 0.3, reaction: 0.5, consistency: 0.2 },
    dpiRecommendation: { min: 800, max: 2400 },
    description: 'Fast-paced arcade shooter prioritizing quick reflexes',
    mousepadSize: 'Medium to Large (35-45cm) for aggressive gameplay',
    testDuration: { gridShot: 40, flickTest: 40, consistency: 20 }
  },
  'rainbow6': {
    name: 'Rainbow Six Siege',
    optimalRange: { min: 22, max: 45 },
    testWeights: { accuracy: 0.55, reaction: 0.25, consistency: 0.2 },
    dpiRecommendation: { min: 400, max: 800 },
    description: 'Tactical FPS requiring precise angle holding and peeking',
    mousepadSize: 'Large (45cm+) for precise angle adjustments',
    testDuration: { gridShot: 55, flickTest: 25, consistency: 35 }
  },
  'fortnite': {
    name: 'Fortnite',
    optimalRange: { min: 10, max: 20 },
    testWeights: { accuracy: 0.3, reaction: 0.4, consistency: 0.3 },
    dpiRecommendation: { min: 800, max: 2400 },
    description: 'Building-focused BR requiring fast 360° movement and tracking',
    mousepadSize: 'Medium (35cm) sufficient for high sensitivity gameplay',
    testDuration: { gridShot: 35, flickTest: 45, consistency: 20 }
  },
  'marvelrivals': {
    name: 'Marvel Rivals',
    optimalRange: { min: 16, max: 32 },
    testWeights: { accuracy: 0.4, reaction: 0.35, consistency: 0.25 },
    dpiRecommendation: { min: 800, max: 1600 },
    description: 'Hero-based tactical shooter with diverse abilities and fast-paced team fights',
    mousepadSize: 'Large (45cm) for versatile hero gameplay and ability combos',
    testDuration: { gridShot: 45, flickTest: 35, consistency: 25 }
  },
  'other': {
    name: 'Other FPS',
    optimalRange: { min: 20, max: 40 },
    testWeights: { accuracy: 0.4, reaction: 0.3, consistency: 0.3 },
    dpiRecommendation: { min: 400, max: 1600 },
    description: 'General FPS gaming with balanced requirements',
    mousepadSize: 'Large (45cm) for versatile gameplay',
    testDuration: { gridShot: 45, flickTest: 30, consistency: 30 }
  }
};

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());

// Session configuration
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    table: 'sessions'
  }),
  secret: process.env.SESSION_SECRET || 'aimhelper-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    db.get('SELECT * FROM users WHERE google_id = ?', [profile.id], async (err, user) => {
      if (err) {
        return done(err);
      }

      if (user) {
        // User exists, update last login
        db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
        return done(null, user);
      }

      // Check if user exists with this email
      db.get('SELECT * FROM users WHERE email = ?', [profile.emails[0].value], async (err, existingUser) => {
        if (err) {
          return done(err);
        }

        if (existingUser) {
          // Link Google account to existing user
          db.run('UPDATE users SET google_id = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [profile.id, existingUser.id], (err) => {
            if (err) return done(err);
            return done(null, existingUser);
          });
        } else {
          // Create new user
          const stmt = db.prepare(`
            INSERT INTO users (email, username, google_id, profile_picture)
            VALUES (?, ?, ?, ?)
          `);
          stmt.run(
            profile.emails[0].value,
            profile.displayName || profile.emails[0].value.split('@')[0],
            profile.id,
            profile.photos[0]?.value || null,
            function(err) {
              if (err) {
                return done(err);
              }

              const newUser = {
                id: this.lastID,
                email: profile.emails[0].value,
                username: profile.displayName || profile.emails[0].value.split('@')[0],
                google_id: profile.id,
                profile_picture: profile.photos[0]?.value || null
              };

              return done(null, newUser);
            }
          );
          stmt.finalize();
        }
      });
    });
  } catch (error) {
    return done(error);
  }
}));

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    done(err, user);
  });
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Email configuration
const transporter = nodemailer.createTransporter({
  // For development, use Ethereal (fake SMTP)
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
    pass: process.env.SMTP_PASS || 'ethereal.password'
  }
});

// Authentication middleware
const requireAuth = (req, res, next) => {
  console.log('Auth check - Session:', req.session);
  console.log('Auth check - User ID:', req.session?.userId);
  
  if (req.session && req.session.userId) {
    req.userId = req.session.userId; // Ensure userId is available
    return next();
  } else {
    console.log('Authentication failed - no valid session');
    return res.status(401).json({ error: 'Authentication required' });
  }
};

// Optional auth middleware (doesn't block if not authenticated)
const optionalAuth = (req, res, next) => {
  req.isAuthenticated = req.session && req.session.userId;
  req.userId = req.session ? req.session.userId : null;
  next();
};

const db = new sqlite3.Database('./sensitivity_data.db');

db.serialize(() => {
  // Users table for authentication
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    google_id TEXT UNIQUE,
    profile_picture TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_verified BOOLEAN DEFAULT 0
  )`);

  // Add Google OAuth columns to existing users table if they don't exist
  db.run(`ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE`, (err) => {
    // Ignore error if column already exists
  });

  db.run(`ALTER TABLE users ADD COLUMN profile_picture TEXT`, (err) => {
    // Ignore error if column already exists
  });

  // Make password_hash optional for OAuth users
  db.run(`ALTER TABLE users DROP CONSTRAINT users_password_hash_NOT_NULL`, (err) => {
    // This might not work on all SQLite versions, but we handle it in the strategy
  });

  // Password reset tokens table
  db.run(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Test results linked to user IDs
  db.run(`CREATE TABLE IF NOT EXISTS test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    test_type TEXT,
    dpi INTEGER,
    in_game_sensitivity REAL,
    cm_per_360 REAL,
    accuracy_percentage REAL,
    reaction_time_ms INTEGER,
    consistency_score REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Enhanced user profiles
  db.run(`CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    display_name TEXT,
    preferred_game TEXT,
    current_dpi INTEGER,
    current_sensitivity REAL,
    monitor_resolution TEXT,
    mouse_model TEXT,
    mousepad_size TEXT,
    gaming_experience TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Optimization results with more detail
  db.run(`CREATE TABLE IF NOT EXISTS optimization_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    recommended_dpi INTEGER,
    recommended_sensitivity REAL,
    recommended_cm_per_360 REAL,
    confidence_score REAL,
    improvement_prediction REAL,
    mousepad_recommendation TEXT,
    reasoning TEXT,
    test_session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // User sessions for analytics
  db.run(`CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_end DATETIME,
    tests_completed INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
});

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  const { email, username, password } = req.body;
  
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  
  try {
    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (user) {
        return res.status(400).json({ error: 'User with this email or username already exists' });
      }
      
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Insert new user
      const stmt = db.prepare(`INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)`);
      stmt.run(email, username, passwordHash, function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create user' });
        }
        
        // Create session
        req.session.userId = this.lastID;
        req.session.username = username;
        
        res.json({ 
          id: this.lastID,
          username: username,
          email: email,
          message: 'User created successfully' 
        });
      });
      stmt.finalize();
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { emailOrUsername, password } = req.body;
  
  if (!emailOrUsername || !password) {
    return res.status(400).json({ error: 'Email/username and password are required' });
  }
  
  // Find user by email or username
  db.get('SELECT * FROM users WHERE email = ? OR username = ?', [emailOrUsername, emailOrUsername], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    try {
      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Update last login
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
      
      // Create session
      req.session.userId = user.id;
      req.session.username = user.username;
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        message: 'Login successful'
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error during login' });
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Google OAuth routes
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }),
  (req, res) => {
    // Successful authentication, redirect to app
    res.redirect('/app');
  }
);

// Password reset request
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Find user by email
    db.get('SELECT id, email, username FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Always return success to prevent email enumeration attacks
      if (!user) {
        return res.json({ message: 'If an account with that email exists, we have sent password reset instructions.' });
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      // Store reset token in database
      db.run(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, resetToken, expiresAt.toISOString()],
        async function(err) {
          if (err) {
            console.error('Error storing reset token:', err);
            return res.status(500).json({ error: 'Failed to generate reset token' });
          }

          // Send password reset email
          try {
            const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;

            const mailOptions = {
              from: process.env.FROM_EMAIL || 'noreply@aimhelperpro.com',
              to: user.email,
              subject: 'Reset Your AimHelper Pro Password',
              html: `
                <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0D1117; color: #F0F6FC; border-radius: 12px; overflow: hidden;">
                  <div style="background: linear-gradient(135deg, #1A73E8 0%, #34A853 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; color: white;">🎯 AimHelper Pro</h1>
                    <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Password Reset Request</p>
                  </div>
                  <div style="padding: 40px 30px;">
                    <h2 style="color: #F0F6FC; margin: 0 0 20px 0;">Reset Your Password</h2>
                    <p style="color: #8B949E; line-height: 1.6; margin-bottom: 30px;">
                      Hi <strong style="color: #F0F6FC;">${user.username}</strong>,<br><br>
                      We received a request to reset your password for your AimHelper Pro account.
                      Click the button below to create a new password.
                    </p>
                    <div style="text-align: center; margin: 40px 0;">
                      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #1A73E8 0%, #34A853 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
                    </div>
                    <p style="color: #8B949E; font-size: 14px; line-height: 1.6;">
                      This link will expire in 1 hour for security reasons.<br><br>
                      If you didn't request this password reset, you can safely ignore this email.
                      Your password will remain unchanged.
                    </p>
                    <hr style="border: none; height: 1px; background: #21262D; margin: 30px 0;">
                    <p style="color: #6E7681; font-size: 12px; text-align: center;">
                      AimHelper Pro - Precision Aim Training<br>
                      If the button doesn't work, copy and paste this link: ${resetUrl}
                    </p>
                  </div>
                </div>
              `
            };

            // For development, log the reset URL instead of sending email
            if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST) {
              console.log('\n🔐 PASSWORD RESET LINK (Development Mode):');
              console.log(`📧 Email: ${user.email}`);
              console.log(`🔗 Reset URL: ${resetUrl}`);
              console.log('⏰ Expires in 1 hour\n');

              return res.json({
                message: 'If an account with that email exists, we have sent password reset instructions.',
                devNote: 'Check console for reset link (development mode)'
              });
            }

            await transporter.sendMail(mailOptions);
            res.json({ message: 'If an account with that email exists, we have sent password reset instructions.' });

          } catch (emailError) {
            console.error('Error sending email:', emailError);
            res.status(500).json({ error: 'Failed to send password reset email' });
          }
        }
      );
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Server error during password reset request' });
  }
});

// Username recovery
app.post('/api/auth/forgot-username', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Find user by email
    db.get('SELECT username, email FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Always return success to prevent email enumeration attacks
      if (!user) {
        return res.json({ message: 'If an account with that email exists, we have sent the username.' });
      }

      // Send username recovery email
      try {
        const mailOptions = {
          from: process.env.FROM_EMAIL || 'noreply@aimhelperpro.com',
          to: user.email,
          subject: 'Your AimHelper Pro Username',
          html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0D1117; color: #F0F6FC; border-radius: 12px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #1A73E8 0%, #34A853 100%); padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; color: white;">🎯 AimHelper Pro</h1>
                <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Username Recovery</p>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #F0F6FC; margin: 0 0 20px 0;">Your Username</h2>
                <p style="color: #8B949E; line-height: 1.6; margin-bottom: 20px;">
                  You requested your username for your AimHelper Pro account.
                </p>
                <div style="background: #161B22; border: 1px solid #30363D; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                  <p style="color: #8B949E; margin: 0 0 10px 0; font-size: 14px;">Your username is:</p>
                  <p style="color: #F0F6FC; font-size: 24px; font-weight: 600; margin: 0;">${user.username}</p>
                </div>
                <p style="color: #8B949E; font-size: 14px; line-height: 1.6; text-align: center;">
                  You can now use this username to sign in to your account.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${req.protocol}://${req.get('host')}/login" style="display: inline-block; background: linear-gradient(135deg, #1A73E8 0%, #34A853 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Sign In Now</a>
                </div>
                <hr style="border: none; height: 1px; background: #21262D; margin: 30px 0;">
                <p style="color: #6E7681; font-size: 12px; text-align: center;">
                  AimHelper Pro - Precision Aim Training
                </p>
              </div>
            </div>
          `
        };

        // For development, log the username instead of sending email
        if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST) {
          console.log('\n👤 USERNAME RECOVERY (Development Mode):');
          console.log(`📧 Email: ${user.email}`);
          console.log(`👤 Username: ${user.username}\n`);

          return res.json({
            message: 'If an account with that email exists, we have sent the username.',
            devNote: 'Check console for username (development mode)'
          });
        }

        await transporter.sendMail(mailOptions);
        res.json({ message: 'If an account with that email exists, we have sent the username.' });

      } catch (emailError) {
        console.error('Error sending email:', emailError);
        res.status(500).json({ error: 'Failed to send username recovery email' });
      }
    });

  } catch (error) {
    console.error('Username recovery error:', error);
    res.status(500).json({ error: 'Server error during username recovery' });
  }
});

// Reset password with token
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Find valid, unused token
    db.get(
      `SELECT prt.*, u.id as user_id, u.email, u.username
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = ? AND prt.used = 0 AND prt.expires_at > datetime('now')`,
      [token],
      async (err, tokenData) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!tokenData) {
          return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        try {
          // Hash new password
          const saltRounds = 10;
          const passwordHash = await bcrypt.hash(newPassword, saltRounds);

          // Update password
          db.run(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [passwordHash, tokenData.user_id],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to update password' });
              }

              // Mark token as used
              db.run(
                'UPDATE password_reset_tokens SET used = 1 WHERE id = ?',
                [tokenData.id],
                (err) => {
                  if (err) {
                    console.error('Failed to mark token as used:', err);
                  }
                }
              );

              res.json({ message: 'Password has been reset successfully' });
            }
          );

        } catch (hashError) {
          console.error('Password hashing error:', hashError);
          res.status(500).json({ error: 'Failed to process new password' });
        }
      }
    );

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Server error during password reset' });
  }
});

app.get('/api/auth/me', optionalAuth, (req, res) => {
  if (!req.isAuthenticated) {
    return res.json({ authenticated: false });
  }
  
  db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at
      }
    });
  });
});

// User Profile Routes
app.get('/api/user-profile', requireAuth, (req, res) => {
  db.get('SELECT * FROM user_profiles WHERE user_id = ?', [req.userId], (err, profile) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!profile) {
      return res.json({}); // Return empty object if no profile exists
    }
    
    res.json(profile);
  });
});

app.post('/api/user-profile', requireAuth, (req, res) => {
  console.log('Profile save request received:', req.body);
  console.log('User ID from session:', req.userId);
  
  const { displayName, preferredGame, currentDpi, currentSensitivity, monitorResolution, mouseModel } = req.body;
  
  // Validate required fields
  if (!displayName || !preferredGame) {
    console.log('Validation failed - missing required fields');
    return res.status(400).json({ error: 'Display name and preferred game are required' });
  }
  
  // Update or insert profile
  db.get('SELECT id FROM user_profiles WHERE user_id = ?', [req.userId], (err, existing) => {
    if (err) {
      console.error('Database error checking existing profile:', err);
      return res.status(500).json({ error: 'Database error checking existing profile' });
    }
    
    console.log('Existing profile check result:', existing);
    
    if (existing) {
      // Update existing profile
      const stmt = db.prepare(`UPDATE user_profiles SET 
        display_name = ?, preferred_game = ?, current_dpi = ?, current_sensitivity = ?,
        monitor_resolution = ?, mouse_model = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?`);
      
      stmt.run(displayName, preferredGame, currentDpi, currentSensitivity, 
               monitorResolution, mouseModel, req.userId, function(err) {
        if (err) {
          console.error('Failed to update profile:', err);
          return res.status(500).json({ error: 'Failed to update profile: ' + err.message });
        }
        console.log('Profile updated successfully');
        res.json({ message: 'Profile updated successfully' });
      });
      stmt.finalize();
    } else {
      // Create new profile
      const stmt = db.prepare(`INSERT INTO user_profiles 
        (user_id, display_name, preferred_game, current_dpi, current_sensitivity, monitor_resolution, mouse_model)
        VALUES (?, ?, ?, ?, ?, ?, ?)`);
      
      stmt.run(req.userId, displayName, preferredGame, currentDpi, currentSensitivity,
               monitorResolution, mouseModel, function(err) {
        if (err) {
          console.error('Failed to create profile:', err);
          return res.status(500).json({ error: 'Failed to create profile: ' + err.message });
        }
        console.log('Profile created successfully with ID:', this.lastID);
        res.json({ id: this.lastID, message: 'Profile created successfully' });
      });
      stmt.finalize();
    }
  });
});

// API Routes
app.post('/api/test-result', optionalAuth, (req, res) => {
  const { testType, dpi, inGameSensitivity, cmPer360, accuracyPercentage, reactionTimeMs, consistencyScore } = req.body;
  
  // Use authenticated user ID or allow anonymous submissions with null user_id
  const userId = req.isAuthenticated ? req.userId : null;
  
  const stmt = db.prepare(`INSERT INTO test_results 
    (user_id, test_type, dpi, in_game_sensitivity, cm_per_360, accuracy_percentage, reaction_time_ms, consistency_score) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  
  stmt.run(userId, testType, dpi, inGameSensitivity, cmPer360, accuracyPercentage, reactionTimeMs, consistencyScore, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Test result saved successfully' });
  });
  
  stmt.finalize();
});

app.get('/api/user-results', optionalAuth, (req, res) => {
  // Get results for authenticated user or from session storage for anonymous users
  if (!req.isAuthenticated) {
    return res.json({ results: [], message: 'No user authenticated' });
  }
  
  db.all(`SELECT * FROM test_results WHERE user_id = ? ORDER BY timestamp DESC`, [req.userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ results: rows });
  });
});

app.post('/api/optimize-sensitivity', optionalAuth, async (req, res) => {
  // Get user's game preference for game-specific optimization
  let userGame = 'other'; // default
  
  if (req.isAuthenticated) {
    // Get user's preferred game from profile
    try {
      const profile = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM user_profiles WHERE user_id = ?', [req.userId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (profile && profile.preferred_game) {
        userGame = profile.preferred_game;
      }
    } catch (error) {
      console.log('Could not fetch user profile for game preference:', error);
    }
  } else if (req.body.preferredGame) {
    userGame = req.body.preferredGame;
  }

  // Get game-specific profile
  const gameProfile = gameProfiles[userGame] || gameProfiles['other'];
  
  // For authenticated users, use their stored results
  // For anonymous users, expect test results in request body
  let query, params;
  
  if (req.isAuthenticated) {
    query = `SELECT * FROM test_results WHERE user_id = ?`;
    params = [req.userId];
  } else {
    // For anonymous users, we'll work with session-based results passed in request
    const { testResults } = req.body;
    if (!testResults || testResults.length === 0) {
      return res.status(400).json({ error: 'No test data found for optimization' });
    }
    
    // Get user's preferred DPI from their most recent test
    const userPreferredDPI = testResults[testResults.length - 1].dpi;
    const optimization = calculateOptimalSensitivity(testResults, userPreferredDPI, gameProfile);
    
    // Add game-specific equipment recommendations
    optimization.mousepadRecommendation = generateGameSpecificMousepadRecommendation(optimization.cmPer360, gameProfile);
    optimization.gameProfile = {
      name: gameProfile.name,
      description: gameProfile.description,
      optimalRange: gameProfile.optimalRange
    };
    
    return res.json(optimization);
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (rows.length === 0) {
      res.status(400).json({ error: 'No test data found for optimization' });
      return;
    }
    
    // Get user's preferred DPI from their most recent test
    const userPreferredDPI = rows[rows.length - 1].dpi;
    const optimization = calculateOptimalSensitivity(rows, userPreferredDPI, gameProfile);
    
    // Add game-specific equipment recommendations and reasoning
    optimization.mousepadRecommendation = generateGameSpecificMousepadRecommendation(optimization.cmPer360, gameProfile);
    optimization.reasoning = generateGameSpecificReasoning(rows, optimization, gameProfile);
    optimization.gameProfile = {
      name: gameProfile.name,
      description: gameProfile.description,
      optimalRange: gameProfile.optimalRange
    };
    
    const stmt = db.prepare(`INSERT INTO optimization_results 
      (user_id, recommended_dpi, recommended_sensitivity, recommended_cm_per_360, confidence_score, 
       mousepad_recommendation, reasoning, test_session_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    
    stmt.run(req.userId, optimization.dpi, optimization.sensitivity, optimization.cmPer360, 
             optimization.confidence, optimization.mousepadRecommendation, optimization.reasoning, 
             Date.now().toString(), function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(optimization);
    });
    
    stmt.finalize();
  });
});

function calculateOptimalSensitivity(testResults, userPreferredDPI, gameProfile = null) {
  // Use default weights if no game profile provided
  const weights = gameProfile?.testWeights || { accuracy: 0.4, reaction: 0.3, consistency: 0.3 };
  const optimalRange = gameProfile?.optimalRange || { min: 20, max: 40 };
  
  // ALWAYS use the user's exact preferred DPI - do not modify it
  const userDPI = userPreferredDPI;
  
  const weightedResults = testResults.map(result => {
    const combinedScore = (result.accuracy_percentage * weights.accuracy) + 
                         ((1000 - Math.min(result.reaction_time_ms, 1000)) / 1000 * 100 * weights.reaction) + 
                         (result.consistency_score * weights.consistency);
    
    return {
      ...result,
      combinedScore
    };
  });
  
  weightedResults.sort((a, b) => b.combinedScore - a.combinedScore);
  
  const topResults = weightedResults.slice(0, Math.min(5, weightedResults.length));
  
  // Calculate optimal cm/360 from best performing tests
  const avgCmPer360 = topResults.reduce((sum, r) => sum + r.cm_per_360, 0) / topResults.length;
  
  // Calculate optimal sensitivity based on user's EXACT preferred DPI and optimal cm/360
  // Formula: sensitivity = 360 / (DPI * (cm/360 / 2.54))
  const optimalSensitivity = 360 / (userDPI * (avgCmPer360 / 2.54));
  
  const confidence = Math.min(100, (topResults.length / testResults.length) * 100);
  
  return {
    dpi: userDPI,  // ALWAYS keep user's exact input DPI - never change it
    sensitivity: Math.round(optimalSensitivity * 100) / 100,
    cmPer360: Math.round(avgCmPer360 * 100) / 100,
    confidence: Math.round(confidence),
    topPerformanceScore: Math.round(topResults[0].combinedScore)
  };
}

function generateGameSpecificMousepadRecommendation(cmPer360, gameProfile) {
  // Use game-specific mousepad recommendation if available
  if (gameProfile && gameProfile.mousepadSize) {
    return {
      size: gameProfile.mousepadSize,
      reasoning: `For ${gameProfile.name}: ${gameProfile.description}. With your ${cmPer360.toFixed(1)}cm/360° setting, ${gameProfile.mousepadSize.toLowerCase()} provides optimal space for ${gameProfile.name}'s gameplay requirements.`,
      gameSpecific: true,
      products: getGameSpecificMousepadProducts(gameProfile.name, cmPer360)
    };
  }
  
  // Fall back to generic recommendation
  return generateMousepadRecommendation(cmPer360);
}

function generateGameSpecificReasoning(testResults, optimization, gameProfile) {
  let reasoning = `Based on your ${testResults.length} test results for ${gameProfile.name}:\n\n`;
  
  reasoning += `🎮 **Game-Specific Analysis for ${gameProfile.name}**\n`;
  reasoning += `${gameProfile.description}\n\n`;
  
  reasoning += `📊 **Optimized for ${gameProfile.name}'s Requirements:**\n`;
  reasoning += `• Target Range: ${gameProfile.optimalRange.min}-${gameProfile.optimalRange.max} cm/360°\n`;
  reasoning += `• Your Optimized Setting: ${optimization.cmPer360.toFixed(1)} cm/360°\n`;
  reasoning += `• Weighting: ${Math.round(gameProfile.testWeights.accuracy * 100)}% Accuracy, ${Math.round(gameProfile.testWeights.reaction * 100)}% Reaction, ${Math.round(gameProfile.testWeights.consistency * 100)}% Consistency\n\n`;
  
  const avgAccuracy = testResults.reduce((sum, r) => sum + r.accuracy_percentage, 0) / testResults.length;
  const avgReaction = testResults.reduce((sum, r) => sum + r.reaction_time_ms, 0) / testResults.length;
  
  reasoning += `⚡ **Performance Breakdown:**\n`;
  reasoning += `• Average Accuracy: ${avgAccuracy.toFixed(1)}%\n`;
  reasoning += `• Average Reaction Time: ${avgReaction.toFixed(0)}ms\n`;
  reasoning += `• Confidence Level: ${optimization.confidence}%\n\n`;
  
  // Game-specific tips
  if (gameProfile.name === 'Valorant' || gameProfile.name === 'CS:GO') {
    reasoning += `🎯 **${gameProfile.name} Tips:**\n`;
    reasoning += `• Focus on crosshair placement and pre-aiming common angles\n`;
    reasoning += `• Practice counter-strafing for accurate shots\n`;
    reasoning += `• Consider aim training maps for micro-adjustments\n`;
  } else if (gameProfile.name === 'Apex Legends') {
    reasoning += `🏃 **Apex Legends Tips:**\n`;
    reasoning += `• Practice tracking moving targets while sliding/jumping\n`;
    reasoning += `• Work on flick shots for close-range encounters\n`;
    reasoning += `• Train target switching for multi-enemy situations\n`;
  } else if (gameProfile.name === 'Rainbow Six Siege') {
    reasoning += `🏠 **Rainbow Six Siege Tips:**\n`;
    reasoning += `• Master precise angle holding and pre-firing\n`;
    reasoning += `• Practice vertical recoil control for sustained fire\n`;
    reasoning += `• Focus on quick peek accuracy and defensive positioning\n`;
  } else if (gameProfile.name === 'Marvel Rivals') {
    reasoning += `🦸 **Marvel Rivals Tips:**\n`;
    reasoning += `• Practice switching between different hero sensitivities\n`;
    reasoning += `• Train ability + aim combinations for hero synergy\n`;
    reasoning += `• Work on tracking through particle effects and visual clutter\n`;
  } else if (gameProfile.name === 'Call of Duty') {
    reasoning += `⚡ **Call of Duty Tips:**\n`;
    reasoning += `• Focus on quick target acquisition and snap shots\n`;
    reasoning += `• Practice tracking while slide canceling/jumping\n`;
    reasoning += `• Train close to mid-range flick accuracy\n`;
  }
  
  return reasoning;
}

function getGameSpecificMousepadProducts(gameName, cmPer360) {
  const baseProducts = {
    'large': ['SteelSeries QcK Heavy Large', 'Corsair MM300 Extended', 'Razer Gigantus V2 Large'],
    'xlarge': ['Corsair MM300 PRO', 'SteelSeries QcK 3XL', 'Razer Gigantus V2 XXL'],
    'medium': ['SteelSeries QcK', 'Corsair MM100', 'Razer Goliathus Speed']
  };
  
  if (cmPer360 <= 15) return baseProducts.medium;
  if (cmPer360 <= 30) return baseProducts.large;
  return baseProducts.xlarge;
}

function generateMousepadRecommendation(cmPer360) {
  // Calculate minimum mousepad size based on cm/360
  const minWidth = Math.ceil(cmPer360 * 1.5); // 1.5x for comfort margin
  const minHeight = Math.ceil(cmPer360 * 0.8); // Height for vertical adjustments
  
  if (cmPer360 <= 20) {
    return {
      size: 'Large (45cm x 40cm+)',
      reasoning: `With your ${cmPer360}cm/360° setting, you need a large mousepad to accommodate wide swipes for 180° turns (${Math.round(cmPer360 / 2)}cm) with comfort margin.`,
      minDimensions: `${minWidth}cm x ${minHeight}cm minimum`,
      products: [
        'SteelSeries QcK Heavy Large',
        'Corsair MM300 Extended',
        'HyperX Fury S Pro Large'
      ]
    };
  } else if (cmPer360 <= 35) {
    return {
      size: 'Medium (35cm x 30cm+)',
      reasoning: `Your ${cmPer360}cm/360° setting requires moderate mouse movement. A medium pad provides good balance of space and desk efficiency.`,
      minDimensions: `${minWidth}cm x ${minHeight}cm minimum`,
      products: [
        'Logitech G640',
        'SteelSeries QcK+',
        'Razer Goliathus Extended'
      ]
    };
  } else {
    return {
      size: 'Small to Medium (30cm x 25cm+)',
      reasoning: `With your higher sensitivity (${cmPer360}cm/360°), you use precise wrist movements. A smaller pad is sufficient and saves desk space.`,
      minDimensions: `${minWidth}cm x ${minHeight}cm minimum`,
      products: [
        'SteelSeries QcK',
        'Logitech G240',
        'Corsair MM100'
      ]
    };
  }
}

function generateOptimizationReasoning(testResults, optimization) {
  const avgAccuracy = testResults.reduce((sum, r) => sum + r.accuracy_percentage, 0) / testResults.length;
  const avgReactionTime = testResults.reduce((sum, r) => sum + r.reaction_time_ms, 0) / testResults.length;
  const avgConsistency = testResults.reduce((sum, r) => sum + r.consistency_score, 0) / testResults.length;
  
  let reasoning = `Based on your ${testResults.length} test sessions, here's why these settings are optimal:\n\n`;
  
  // Accuracy analysis
  if (avgAccuracy < 70) {
    reasoning += `• Your average accuracy (${Math.round(avgAccuracy)}%) suggests you may benefit from a slower sensitivity for better precision.\n`;
  } else if (avgAccuracy > 85) {
    reasoning += `• Your excellent accuracy (${Math.round(avgAccuracy)}%) shows you can handle your current sensitivity well.\n`;
  } else {
    reasoning += `• Your good accuracy (${Math.round(avgAccuracy)}%) indicates your sensitivity is in a reasonable range.\n`;
  }
  
  // Reaction time analysis
  if (avgReactionTime > 400) {
    reasoning += `• Your reaction times (${Math.round(avgReactionTime)}ms avg) could improve with a faster, more responsive sensitivity.\n`;
  } else {
    reasoning += `• Your quick reactions (${Math.round(avgReactionTime)}ms avg) show good mouse control at this sensitivity.\n`;
  }
  
  // Consistency analysis
  if (avgConsistency < 60) {
    reasoning += `• Lower consistency scores (${Math.round(avgConsistency)}%) suggest finding a sensitivity that feels more natural.\n`;
  } else {
    reasoning += `• Good consistency (${Math.round(avgConsistency)}%) indicates you're comfortable with this sensitivity range.\n`;
  }
  
  reasoning += `\nThe recommended ${optimization.cmPer360}cm/360° balances speed and precision based on your best-performing tests.`;
  
  return reasoning;
}

// Serve static files
app.get('/', (req, res) => {
  console.log('Serving landing page');
  res.sendFile(path.join(__dirname, '../public/landing.html'));
});

app.get('/landing', (req, res) => {
  console.log('Serving landing page (explicit route)');
  res.sendFile(path.join(__dirname, '../public/landing.html'));
});

app.get('/app', (req, res) => {
  console.log('Serving main app');
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/circle-tracking', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/circle-tracking.html'));
});

app.get('/grid-shot', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/grid-shot.html'));
});

app.get('/flick-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/flick-test.html'));
});

app.get('/consistency-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/consistency-test.html'));
});

app.get('/results', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/results.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/education', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/education.html'));
});

app.get('/how-it-works', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/how-it-works.html'));
});

app.get('/features', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/features.html'));
});

app.get('/help', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/help.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/contact.html'));
});

app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/docs.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/register.html'));
});

app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/forgot-password.html'));
});

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/reset-password.html'));
});

app.get('/valorant-crosshair-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/valorant-crosshair-test.html'));
});

app.get('/apex-tracking-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/apex-tracking-test.html'));
});

// Serve static files after custom routes
app.use(express.static(path.join(__dirname, '../public')));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;