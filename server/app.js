const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

const db = new sqlite3.Database('./sensitivity_data.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    test_type TEXT,
    dpi INTEGER,
    in_game_sensitivity REAL,
    cm_per_360 REAL,
    accuracy_percentage REAL,
    reaction_time_ms INTEGER,
    consistency_score REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE,
    preferred_game TEXT,
    monitor_resolution TEXT,
    mouse_model TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS optimization_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    recommended_dpi INTEGER,
    recommended_sensitivity REAL,
    recommended_cm_per_360 REAL,
    confidence_score REAL,
    test_session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// API Routes
app.post('/api/test-result', (req, res) => {
  const { userId, testType, dpi, inGameSensitivity, cmPer360, accuracyPercentage, reactionTimeMs, consistencyScore } = req.body;
  
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

app.get('/api/user-results/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.all(`SELECT * FROM test_results WHERE user_id = ? ORDER BY timestamp DESC`, [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/optimize-sensitivity', (req, res) => {
  const { userId } = req.body;
  
  db.all(`SELECT * FROM test_results WHERE user_id = ?`, [userId], (err, rows) => {
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
    const optimization = calculateOptimalSensitivity(rows, userPreferredDPI);
    
    const stmt = db.prepare(`INSERT INTO optimization_results 
      (user_id, recommended_dpi, recommended_sensitivity, recommended_cm_per_360, confidence_score, test_session_id) 
      VALUES (?, ?, ?, ?, ?, ?)`);
    
    stmt.run(userId, optimization.dpi, optimization.sensitivity, optimization.cmPer360, optimization.confidence, Date.now().toString(), function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(optimization);
    });
    
    stmt.finalize();
  });
});

function calculateOptimalSensitivity(testResults, userPreferredDPI) {
  // Ensure user's DPI is within acceptable range
  const safeDPI = Math.max(400, Math.min(3200, userPreferredDPI));
  
  const weightedResults = testResults.map(result => {
    const combinedScore = (result.accuracy_percentage * 0.4) + 
                         ((1000 - Math.min(result.reaction_time_ms, 1000)) / 1000 * 100 * 0.3) + 
                         (result.consistency_score * 0.3);
    
    return {
      ...result,
      combinedScore
    };
  });
  
  weightedResults.sort((a, b) => b.combinedScore - a.combinedScore);
  
  const topResults = weightedResults.slice(0, Math.min(5, weightedResults.length));
  
  // Calculate optimal cm/360 from best performing tests
  const avgCmPer360 = topResults.reduce((sum, r) => sum + r.cm_per_360, 0) / topResults.length;
  
  // Calculate optimal sensitivity based on user's preferred DPI and optimal cm/360
  // Formula: sensitivity = 360 / (DPI * (cm/360 / 2.54))
  const optimalSensitivity = 360 / (safeDPI * (avgCmPer360 / 2.54));
  
  const confidence = Math.min(100, (topResults.length / testResults.length) * 100);
  
  return {
    dpi: safeDPI,  // Keep user's preferred DPI (within safe range)
    sensitivity: Math.round(optimalSensitivity * 100) / 100,
    cmPer360: Math.round(avgCmPer360 * 100) / 100,
    confidence: Math.round(confidence),
    topPerformanceScore: Math.round(topResults[0].combinedScore)
  };
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

// Serve static files after custom routes
app.use(express.static(path.join(__dirname, '../public')));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;