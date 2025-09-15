/**
 * AimHelper Pro - Grid Shot Enhanced Test
 * Professional aim training with comprehensive analytics
 */

class GridShotPro {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.crosshair = document.getElementById('crosshair');

        // Test state
        this.isRunning = false;
        this.isPaused = false;
        this.difficulty = 'medium';
        this.duration = 60;
        this.timeRemaining = 60;
        this.startTime = 0;
        this.endTime = 0;

        // Game objects
        this.targets = [];
        this.particles = [];

        // Performance metrics
        this.metrics = {
            totalShots: 0,
            totalHits: 0,
            totalMisses: 0,
            reactionTimes: [],
            streakCurrent: 0,
            streakBest: 0,
            targetsSeen: 0,
            accuracy: 0,
            averageReactionTime: 0,
            killsPerSecond: 0,
            consistency: 0,
            score: 0,
            // Advanced analytics data
            clickPositions: [],
            targetPositions: [],
            missedTargets: [],
            hitZones: [],
            sessionStartTime: 0,
            detailedTimings: []
        };

        // Difficulty settings
        this.difficultySettings = {
            easy: { targetSize: 60, spawnRate: 800, targetLifetime: 2500, maxTargets: 3 },
            medium: { targetSize: 45, spawnRate: 600, targetLifetime: 2000, maxTargets: 4 },
            hard: { targetSize: 30, spawnRate: 400, targetLifetime: 1500, maxTargets: 5 },
            extreme: { targetSize: 20, spawnRate: 300, targetLifetime: 1200, maxTargets: 6 }
        };

        this.currentSettings = this.difficultySettings.medium;
        this.lastSpawn = 0;
        this.gameLoop = null;

        this.initializeEventListeners();
        this.initializeCrosshair();
    }

    initializeEventListeners() {
        // Difficulty selection
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.difficulty = e.target.dataset.difficulty;
                this.currentSettings = this.difficultySettings[this.difficulty];
            });
        });

        // Test controls
        document.getElementById('startTest').addEventListener('click', () => this.startTest());
        document.getElementById('exitTest').addEventListener('click', () => this.exitTest());
        document.getElementById('retryTest').addEventListener('click', () => this.retryTest());
        document.getElementById('nextTest').addEventListener('click', () => this.nextTest());
        document.getElementById('saveResults').addEventListener('click', () => this.saveResults());
        document.getElementById('shareResults').addEventListener('click', () => this.shareResults());
        document.getElementById('viewFullLeaderboard').addEventListener('click', () => this.showLeaderboard());

        // Share modal events
        document.getElementById('copyScore').addEventListener('click', () => this.copyShareText());
        document.getElementById('tweetScore').addEventListener('click', () => this.tweetScore());
        document.getElementById('closeShare').addEventListener('click', () => {
            document.getElementById('shareModal').classList.remove('active');
        });

        // Leaderboard modal events
        document.getElementById('refreshLeaderboard').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('closeLeaderboard').addEventListener('click', () => {
            document.getElementById('leaderboardModal').classList.remove('active');
        });

        // Plan limitation modal events
        document.getElementById('upgradeToPro').addEventListener('click', () => {
            window.location.href = '/pricing';
        });
        document.getElementById('viewPricing').addEventListener('click', () => {
            window.location.href = '/pricing';
        });
        document.getElementById('closePlanLimit').addEventListener('click', () => {
            document.getElementById('planLimitModal').classList.remove('active');
        });

        // Duration selection
        document.getElementById('testDuration').addEventListener('change', (e) => {
            this.duration = parseInt(e.target.value);
            this.timeRemaining = this.duration;
        });

        // Canvas events
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.updateCrosshair(e));

        // Prevent right-click menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Update plan status display
        this.updatePlanStatus();
    }

    initializeCrosshair() {
        this.canvas.addEventListener('mouseenter', () => {
            this.crosshair.style.display = 'block';
            this.canvas.style.cursor = 'none';
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.crosshair.style.display = 'none';
            this.canvas.style.cursor = 'default';
        });
    }

    updateCrosshair(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.crosshair.style.left = (rect.left + x - 10) + 'px';
        this.crosshair.style.top = (rect.top + y - 10) + 'px';
    }

    startTest() {
        // Check if user has remaining tests
        const testsRemaining = PricingManager.getTestsRemaining();

        if (testsRemaining === 0) {
            // Show plan limitation modal
            document.getElementById('planLimitModal').classList.add('active');
            return;
        }

        // Record test attempt
        PricingManager.recordTestTaken();

        // Show loading state
        uiSystem.showLoading('Initializing test environment...');

        setTimeout(() => {
            // Hide setup, show arena and metrics
            document.getElementById('testSetup').style.display = 'none';
            document.getElementById('testArena').style.display = 'block';
            document.getElementById('liveMetrics').style.display = 'block';

            uiSystem.hideLoading();
            uiSystem.showSuccess('Test Started', 'Grid Shot test is now active. Good luck!');
        }, 800);

        // Reset metrics
        this.metrics = {
            totalShots: 0,
            totalHits: 0,
            totalMisses: 0,
            reactionTimes: [],
            streakCurrent: 0,
            streakBest: 0,
            targetsSeen: 0,
            accuracy: 0,
            averageReactionTime: 0,
            killsPerSecond: 0,
            consistency: 0,
            score: 0,
            // Advanced analytics data
            clickPositions: [],
            targetPositions: [],
            missedTargets: [],
            hitZones: [],
            sessionStartTime: Date.now(),
            detailedTimings: []
        };

        // Reset game state
        this.targets = [];
        this.particles = [];
        this.timeRemaining = this.duration;
        this.isRunning = true;
        this.startTime = Date.now();
        this.lastSpawn = Date.now();

        // Start game loop
        this.gameLoop = setInterval(() => this.update(), 16); // 60 FPS
        this.timerLoop = setInterval(() => this.updateTimer(), 100);
    }

    update() {
        if (!this.isRunning) return;

        this.clearCanvas();
        this.spawnTargets();
        this.updateTargets();
        this.updateParticles();
        this.renderTargets();
        this.renderParticles();
        this.updateLiveMetrics();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw subtle background pattern
        this.ctx.fillStyle = 'rgba(26, 115, 232, 0.02)';
        for (let i = 0; i < this.canvas.width; i += 40) {
            for (let j = 0; j < this.canvas.height; j += 40) {
                if ((i + j) % 80 === 0) {
                    this.ctx.fillRect(i, j, 2, 2);
                }
            }
        }
    }

    spawnTargets() {
        const now = Date.now();
        if (now - this.lastSpawn > this.currentSettings.spawnRate &&
            this.targets.length < this.currentSettings.maxTargets) {

            const target = this.createTarget();
            this.targets.push(target);
            this.metrics.targetsSeen++;

            // Record target position for analytics
            this.metrics.targetPositions.push({
                x: target.x,
                y: target.y,
                size: target.size,
                spawnTime: target.spawnTime,
                lifetime: this.currentSettings.targetLifetime
            });

            this.lastSpawn = now;
        }
    }

    createTarget() {
        const margin = this.currentSettings.targetSize;
        const x = margin + Math.random() * (this.canvas.width - margin * 2);
        const y = margin + Math.random() * (this.canvas.height - margin * 2);

        return {
            x: x,
            y: y,
            size: this.currentSettings.targetSize,
            spawnTime: Date.now(),
            lifetime: this.currentSettings.targetLifetime,
            isAlive: true,
            pulsePhase: Math.random() * Math.PI * 2
        };
    }

    updateTargets() {
        const now = Date.now();
        this.targets = this.targets.filter(target => {
            const age = now - target.spawnTime;
            if (age > target.lifetime) {
                this.metrics.totalMisses++;
                this.metrics.streakCurrent = 0;
                return false;
            }
            target.pulsePhase += 0.1;
            return target.isAlive;
        });
    }

    renderTargets() {
        this.targets.forEach(target => {
            const pulseScale = 1 + Math.sin(target.pulsePhase) * 0.1;
            const currentSize = target.size * pulseScale;

            // Outer glow
            const gradient = this.ctx.createRadialGradient(
                target.x, target.y, 0,
                target.x, target.y, currentSize
            );
            gradient.addColorStop(0, 'rgba(234, 67, 53, 0.8)');
            gradient.addColorStop(0.7, 'rgba(26, 115, 232, 0.6)');
            gradient.addColorStop(1, 'rgba(234, 67, 53, 0.2)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(target.x, target.y, currentSize / 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Inner circle
            this.ctx.fillStyle = '#ea4335';
            this.ctx.beginPath();
            this.ctx.arc(target.x, target.y, currentSize / 3, 0, Math.PI * 2);
            this.ctx.fill();

            // Center dot
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(target.x, target.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.size *= 0.95;
            return particle.life > 0;
        });
    }

    renderParticles() {
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = `rgba(52, 168, 83, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    createHitEffect(x, y) {
        // Create particles
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 4 + 2,
                life: 30,
                maxLife: 30
            });
        }

        // Create hit marker
        const hitMarker = document.createElement('div');
        hitMarker.className = 'hit-effect';
        hitMarker.textContent = '+100';
        hitMarker.style.left = x + 'px';
        hitMarker.style.top = y + 'px';
        document.getElementById('testArena').appendChild(hitMarker);

        setTimeout(() => hitMarker.remove(), 800);
    }

    handleCanvasClick(e) {
        if (!this.isRunning) return;

        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        this.metrics.totalShots++;
        let hit = false;
        const clickTime = Date.now();

        // Record click position for heat map analysis
        this.metrics.clickPositions.push({
            x: clickX,
            y: clickY,
            timestamp: clickTime
        });

        // Check for hits
        this.targets.forEach((target, index) => {
            const distance = Math.sqrt(
                Math.pow(clickX - target.x, 2) +
                Math.pow(clickY - target.y, 2)
            );

            if (distance <= target.size / 2) {
                hit = true;
                this.metrics.totalHits++;
                this.metrics.streakCurrent++;
                this.metrics.streakBest = Math.max(this.metrics.streakBest, this.metrics.streakCurrent);

                // Record reaction time
                const reactionTime = clickTime - target.spawnTime;
                this.metrics.reactionTimes.push(reactionTime);

                // Record advanced analytics data
                this.metrics.hitZones.push({
                    targetX: target.x,
                    targetY: target.y,
                    clickX: clickX,
                    clickY: clickY,
                    distance: distance,
                    targetSize: target.size,
                    reactionTime: reactionTime,
                    timestamp: clickTime
                });

                // Create hit effect
                this.createHitEffect(target.x, target.y);

                // Remove target
                this.targets.splice(index, 1);

                // Calculate score
                const timeBonus = Math.max(0, 1000 - reactionTime) / 10;
                const streakBonus = this.metrics.streakCurrent * 5;
                this.metrics.score += 100 + timeBonus + streakBonus;
            }
        });

        if (!hit) {
            this.metrics.totalMisses++;
            this.metrics.streakCurrent = 0;

            // Record miss data for analytics
            const nearestTarget = this.findNearestTarget(clickX, clickY);
            if (nearestTarget) {
                this.metrics.missedTargets.push({
                    clickX: clickX,
                    clickY: clickY,
                    nearestTargetX: nearestTarget.x,
                    nearestTargetY: nearestTarget.y,
                    distance: nearestTarget.distance,
                    timestamp: clickTime
                });
            }
        }
    }

    findNearestTarget(clickX, clickY) {
        if (this.targets.length === 0) return null;

        let nearest = null;
        let minDistance = Infinity;

        this.targets.forEach(target => {
            const distance = Math.sqrt(
                Math.pow(clickX - target.x, 2) +
                Math.pow(clickY - target.y, 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearest = {
                    x: target.x,
                    y: target.y,
                    distance: distance
                };
            }
        });

        return nearest;
    }

    updateLiveMetrics() {
        // Calculate accuracy
        this.metrics.accuracy = this.metrics.totalShots > 0 ?
            (this.metrics.totalHits / this.metrics.totalShots * 100) : 0;

        // Calculate average reaction time
        this.metrics.averageReactionTime = this.metrics.reactionTimes.length > 0 ?
            this.metrics.reactionTimes.reduce((a, b) => a + b, 0) / this.metrics.reactionTimes.length : 0;

        // Calculate kills per second
        const elapsed = (Date.now() - this.startTime) / 1000;
        this.metrics.killsPerSecond = elapsed > 0 ? this.metrics.totalHits / elapsed : 0;

        // Update display
        document.getElementById('liveAccuracy').textContent = this.metrics.accuracy.toFixed(1) + '%';
        document.getElementById('liveKPS').textContent = this.metrics.killsPerSecond.toFixed(2);
        document.getElementById('liveReaction').textContent = Math.round(this.metrics.averageReactionTime);
        document.getElementById('liveStreak').textContent = this.metrics.streakBest;
        document.getElementById('scoreDisplay').textContent = 'Score: ' + Math.round(this.metrics.score);
    }

    updateTimer() {
        this.timeRemaining -= 0.1;
        document.getElementById('timerDisplay').textContent = Math.max(0, this.timeRemaining).toFixed(1);

        if (this.timeRemaining <= 0) {
            this.endTest();
        }
    }

    endTest() {
        this.isRunning = false;
        this.endTime = Date.now();

        // Stop loops
        clearInterval(this.gameLoop);
        clearInterval(this.timerLoop);

        // Calculate final metrics
        this.calculateFinalMetrics();

        // Show results
        document.getElementById('testArena').style.display = 'none';
        document.getElementById('liveMetrics').style.display = 'none';
        document.getElementById('testResults').style.display = 'block';

        this.displayResults();
    }

    calculateFinalMetrics() {
        const totalTime = (this.endTime - this.startTime) / 1000;

        // Consistency (variation in reaction times)
        if (this.metrics.reactionTimes.length > 1) {
            const mean = this.metrics.averageReactionTime;
            const variance = this.metrics.reactionTimes.reduce((acc, time) =>
                acc + Math.pow(time - mean, 2), 0) / this.metrics.reactionTimes.length;
            const stdDev = Math.sqrt(variance);
            this.metrics.consistency = Math.max(0, 100 - (stdDev / mean * 100));
        }

        // Final calculations
        this.metrics.killsPerSecond = this.metrics.totalHits / totalTime;
    }

    displayResults() {
        // Update result displays
        document.getElementById('finalScore').textContent = Math.round(this.metrics.score);
        document.getElementById('totalHits').textContent = this.metrics.totalHits;
        document.getElementById('finalAccuracy').textContent = this.metrics.accuracy.toFixed(1) + '%';
        document.getElementById('avgReactionTime').textContent = Math.round(this.metrics.averageReactionTime) + 'ms';
        document.getElementById('killsPerSecond').textContent = this.metrics.killsPerSecond.toFixed(2);
        document.getElementById('consistency').textContent = this.metrics.consistency.toFixed(1) + '%';

        // Calculate rank and percentile
        this.calculateRankAndPercentile();

        // Draw performance radar chart
        this.drawRadarChart();

        // Update recent scores display
        this.updateRecentScores();
    }

    calculateRankAndPercentile() {
        // Simplified ranking system based on accuracy and KPS
        const performanceScore = (this.metrics.accuracy * 0.4) +
                               (this.metrics.killsPerSecond * 20) +
                               (this.metrics.consistency * 0.4);

        let rank = 'Bronze';
        let percentile = 20;

        if (performanceScore > 80) {
            rank = 'Radiant';
            percentile = 99;
        } else if (performanceScore > 70) {
            rank = 'Immortal';
            percentile = 95;
        } else if (performanceScore > 60) {
            rank = 'Diamond';
            percentile = 85;
        } else if (performanceScore > 50) {
            rank = 'Platinum';
            percentile = 70;
        } else if (performanceScore > 40) {
            rank = 'Gold';
            percentile = 50;
        } else if (performanceScore > 30) {
            rank = 'Silver';
            percentile = 30;
        }

        document.getElementById('playerRank').textContent = rank;
        document.getElementById('playerPercentile').textContent = `Top ${100 - percentile}%`;
    }

    drawRadarChart() {
        const canvas = document.getElementById('radarChart');
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 100;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Performance categories (normalized to 0-1)
        const categories = [
            { label: 'Accuracy', value: this.metrics.accuracy / 100 },
            { label: 'Speed', value: Math.min(1, this.metrics.killsPerSecond / 3) },
            { label: 'Reaction', value: Math.max(0, 1 - this.metrics.averageReactionTime / 1000) },
            { label: 'Consistency', value: this.metrics.consistency / 100 },
            { label: 'Precision', value: Math.min(1, this.metrics.streakBest / 10) }
        ];

        const angleStep = (2 * Math.PI) / categories.length;

        // Draw grid circles
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 5; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, (radius / 5) * i, 0, 2 * Math.PI);
            ctx.stroke();
        }

        // Draw axes and labels
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';

        categories.forEach((category, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            // Draw axis line
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Draw label
            const labelX = centerX + Math.cos(angle) * (radius + 20);
            const labelY = centerY + Math.sin(angle) * (radius + 20);
            ctx.fillText(category.label, labelX, labelY);
        });

        // Draw performance polygon
        ctx.beginPath();
        ctx.fillStyle = 'rgba(26, 115, 232, 0.3)';
        ctx.strokeStyle = 'rgba(26, 115, 232, 0.8)';
        ctx.lineWidth = 2;

        categories.forEach((category, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const distance = category.value * radius;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw data points
        ctx.fillStyle = 'rgba(26, 115, 232, 1)';
        categories.forEach((category, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const distance = category.value * radius;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    exitTest() {
        this.isRunning = false;
        if (this.gameLoop) clearInterval(this.gameLoop);
        if (this.timerLoop) clearInterval(this.timerLoop);

        window.location.href = '/';
    }

    retryTest() {
        // Reset and restart
        document.getElementById('testResults').style.display = 'none';
        document.getElementById('testSetup').style.display = 'block';
    }

    nextTest() {
        // Navigate to next test (implement based on test sequence)
        window.location.href = '/flick-test';
    }

    saveResults() {
        // Save results to localStorage
        const results = {
            testType: 'gridshot',
            difficulty: this.difficulty,
            duration: this.duration,
            timestamp: Date.now(),
            metrics: { ...this.metrics },
            playerName: this.getPlayerName()
        };

        const existingResults = JSON.parse(localStorage.getItem('aimhelper_results') || '[]');
        existingResults.push(results);
        localStorage.setItem('aimhelper_results', JSON.stringify(existingResults));

        // Add to global leaderboard
        this.submitToLeaderboard(results);

        // Check for achievements and add to community feed
        this.checkAchievements(results);

        // Show enhanced confirmation
        uiSystem.showSuccess('Results Saved!',
            `Your Grid Shot performance has been saved. Score: ${results.metrics.score}, Accuracy: ${results.metrics.accuracy.toFixed(1)}%`, [
            {
                text: 'View Analytics',
                primary: true,
                onclick: "window.location.href='/analytics'"
            },
            {
                text: 'Share Score',
                onclick: "document.getElementById('shareResults').click()"
            }
        ]);
    }

    shareResults() {
        const shareModal = document.getElementById('shareModal');
        const sharePreview = document.getElementById('sharePreview');

        const playerName = this.getPlayerName();
        const shareText = this.generateShareText(playerName);

        sharePreview.textContent = shareText;
        shareModal.classList.add('active');
    }

    generateShareText(playerName) {
        return `🎯 Grid Shot Results - ${playerName}
📊 Score: ${this.metrics.score}
🎯 Accuracy: ${this.metrics.accuracy.toFixed(1)}%
⚡ Reaction Time: ${this.metrics.averageReactionTime}ms
🔥 Best Streak: ${this.metrics.streakBest}
💪 Kills/Sec: ${this.metrics.killsPerSecond.toFixed(1)}

Try AimHelper Pro: ${window.location.origin}`;
    }

    getPlayerName() {
        let playerName = localStorage.getItem('aimhelper_username');
        if (!playerName) {
            playerName = prompt('Enter your username for leaderboard:') || 'Anonymous';
            localStorage.setItem('aimhelper_username', playerName);
        }
        return playerName;
    }

    submitToLeaderboard(results) {
        // Store in localStorage-based leaderboard
        const leaderboard = JSON.parse(localStorage.getItem('aimhelper_leaderboard') || '[]');

        const leaderboardEntry = {
            playerName: results.playerName,
            score: results.metrics.score,
            accuracy: results.metrics.accuracy,
            reactionTime: results.metrics.averageReactionTime,
            difficulty: results.difficulty,
            timestamp: results.timestamp
        };

        leaderboard.push(leaderboardEntry);

        // Keep only top 100 scores
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard.splice(100);

        localStorage.setItem('aimhelper_leaderboard', JSON.stringify(leaderboard));

        // Update recent scores display
        this.updateRecentScores();
    }

    updateRecentScores() {
        const recentScores = document.getElementById('recentScores');
        const leaderboard = JSON.parse(localStorage.getItem('aimhelper_leaderboard') || '[]');

        // Show top 5 recent scores
        const topScores = leaderboard.slice(0, 5);

        recentScores.innerHTML = topScores.map((entry, index) => `
            <div class="score-item">
                <span class="score-player">#${index + 1} ${entry.playerName}</span>
                <span class="score-value">${entry.score}</span>
            </div>
        `).join('');
    }

    showLeaderboard() {
        const leaderboardModal = document.getElementById('leaderboardModal');
        const fullLeaderboard = document.getElementById('fullLeaderboard');
        const leaderboard = JSON.parse(localStorage.getItem('aimhelper_leaderboard') || '[]');

        fullLeaderboard.innerHTML = leaderboard.map((entry, index) => `
            <div class="score-item">
                <span class="score-player">
                    #${index + 1} ${entry.playerName}
                    <small style="color: var(--text-tertiary); margin-left: var(--space-2);">
                        ${entry.difficulty} • ${entry.accuracy.toFixed(1)}% • ${entry.reactionTime}ms
                    </small>
                </span>
                <span class="score-value">${entry.score}</span>
            </div>
        `).join('');

        leaderboardModal.classList.add('active');
    }

    copyShareText() {
        const sharePreview = document.getElementById('sharePreview');
        navigator.clipboard.writeText(sharePreview.textContent).then(() => {
            uiSystem.showSuccess('Copied!', 'Score copied to clipboard. Share it anywhere!');
        }).catch(() => {
            uiSystem.showError('Copy Failed', 'Unable to copy to clipboard. Please select and copy manually.');
        });
    }

    tweetScore() {
        const sharePreview = document.getElementById('sharePreview');
        const tweetText = encodeURIComponent(sharePreview.textContent);
        const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
        window.open(tweetUrl, '_blank');
    }

    updatePlanStatus() {
        const planStatusElement = document.getElementById('planStatus');
        if (!planStatusElement) return;

        const currentPlan = PricingManager.getCurrentPlan();
        const testsRemaining = PricingManager.getTestsRemaining();

        let statusHTML = '';

        // Plan badge
        const planBadges = {
            free: '<span class="plan-badge free">Free Plan</span>',
            pro: '<span class="plan-badge pro">Pro Plan</span>',
            team: '<span class="plan-badge team">Team Plan</span>'
        };

        statusHTML += planBadges[currentPlan] || planBadges.free;

        // Tests remaining for free users
        if (currentPlan === 'free') {
            if (testsRemaining > 0) {
                statusHTML += `<br><small>${testsRemaining} test${testsRemaining !== 1 ? 's' : ''} remaining today</small>`;
            } else {
                statusHTML += '<br><small>Daily test limit reached</small>';
            }
            statusHTML += '<div class="upgrade-prompt"><a href="/pricing">⚡ Upgrade for unlimited tests</a></div>';
        } else if (currentPlan === 'pro' || currentPlan === 'team') {
            statusHTML += '<br><small>Unlimited tests</small>';
        }

        planStatusElement.innerHTML = statusHTML;
    }

    checkAchievements(currentResults) {
        const allResults = JSON.parse(localStorage.getItem('aimhelper_results') || '[]');
        const currentScore = currentResults.metrics.score;
        const currentAccuracy = currentResults.metrics.accuracy;
        const communityFeed = JSON.parse(localStorage.getItem('aimhelper_community_feed') || '[]');

        // Check for personal bests
        const previousBest = allResults
            .filter(r => r.timestamp < currentResults.timestamp)
            .reduce((best, r) => Math.max(best, r.metrics?.score || 0), 0);

        if (currentScore > previousBest && currentScore > 500) {
            this.addCommunityActivity({
                type: 'score',
                username: currentResults.playerName,
                score: currentScore,
                accuracy: currentAccuracy.toFixed(1),
                timestamp: currentResults.timestamp
            });
        }

        // Check for accuracy achievements
        if (currentAccuracy >= 95 && !this.hasAchievement(communityFeed, currentResults.playerName, 'Accuracy King')) {
            this.addCommunityActivity({
                type: 'achievement',
                username: currentResults.playerName,
                achievement: {
                    icon: '👑',
                    title: 'Accuracy King',
                    description: 'Achieved 95%+ accuracy'
                },
                timestamp: currentResults.timestamp
            });
        } else if (currentAccuracy >= 90 && !this.hasAchievement(communityFeed, currentResults.playerName, 'Bullseye Master')) {
            this.addCommunityActivity({
                type: 'achievement',
                username: currentResults.playerName,
                achievement: {
                    icon: '🎯',
                    title: 'Bullseye Master',
                    description: 'Joined the 90% accuracy club'
                },
                timestamp: currentResults.timestamp
            });
        }

        // Check for reaction time achievements
        if (currentResults.metrics.averageReactionTime < 200 && !this.hasAchievement(communityFeed, currentResults.playerName, 'Lightning Reflexes')) {
            this.addCommunityActivity({
                type: 'achievement',
                username: currentResults.playerName,
                achievement: {
                    icon: '⚡',
                    title: 'Lightning Reflexes',
                    description: 'Sub-200ms average reaction time'
                },
                timestamp: currentResults.timestamp
            });
        }

        // Check for session milestones
        if (allResults.length === 10) {
            this.addCommunityActivity({
                type: 'milestone',
                username: currentResults.playerName,
                description: 'Completed 10th training session!',
                timestamp: currentResults.timestamp
            });
        } else if (allResults.length === 50) {
            this.addCommunityActivity({
                type: 'milestone',
                username: currentResults.playerName,
                description: 'Reached 50 training sessions milestone!',
                timestamp: currentResults.timestamp
            });
        } else if (allResults.length === 100) {
            this.addCommunityActivity({
                type: 'milestone',
                username: currentResults.playerName,
                description: '100th session completed - Dedication master!',
                timestamp: currentResults.timestamp
            });
        }
    }

    hasAchievement(feed, username, achievementTitle) {
        return feed.some(item =>
            item.type === 'achievement' &&
            item.username === username &&
            item.achievement?.title === achievementTitle
        );
    }

    addCommunityActivity(activity) {
        const communityFeed = JSON.parse(localStorage.getItem('aimhelper_community_feed') || '[]');
        communityFeed.unshift(activity);

        // Keep only the latest 100 activities
        if (communityFeed.length > 100) {
            communityFeed.splice(100);
        }

        localStorage.setItem('aimhelper_community_feed', JSON.stringify(communityFeed));
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GridShotPro();
});