/**
 * AimHelper Pro - Advanced Aim Training System
 * Comprehensive training with Grid Shot, Flick Shot, Target Tracking, and Target Switching
 */

class AdvancedAimTrainer {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.crosshair = document.getElementById('crosshair');

        // Test state
        this.isRunning = false;
        this.isPaused = false;
        this.testMode = 'gridshot';
        this.difficulty = 'medium';
        this.targetSize = 'medium';
        this.duration = 60;
        this.timeRemaining = 60;
        this.startTime = 0;
        this.endTime = 0;

        // Game objects
        this.targets = [];
        this.particles = [];
        this.trailLines = [];
        this.activeTargetIndex = 0;

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
            // Mode-specific metrics
            flickDistance: [],
            trackingAccuracy: 0,
            switchSpeed: [],
            mouseMovement: [],
            // Advanced analytics data
            clickPositions: [],
            targetPositions: [],
            missedTargets: [],
            hitZones: [],
            sessionStartTime: 0,
            detailedTimings: []
        };

        // Test mode configurations
        this.testModes = {
            gridshot: {
                name: 'Grid Shot',
                icon: '🎯',
                description: 'Click static targets as quickly and accurately as possible. Classic aim training for precision.',
                instructions: [
                    'Duration: Variable (30-120 seconds)',
                    'Targets: Static randomly positioned circles',
                    'Objective: Maximize accuracy and speed',
                    'Scoring: Based on hits, accuracy, and reaction time'
                ]
            },
            flick: {
                name: 'Flick Shot',
                icon: '⚡',
                description: 'Large distance target switching to train quick mouse movements and crosshair placement.',
                instructions: [
                    'Duration: Variable (30-120 seconds)',
                    'Targets: Far apart static targets',
                    'Objective: Quick large movements with precision',
                    'Scoring: Emphasizes flick distance and accuracy'
                ]
            },
            track: {
                name: 'Target Tracking',
                icon: '🔄',
                description: 'Track smoothly moving targets to train mouse control and target prediction.',
                instructions: [
                    'Duration: Variable (30-120 seconds)',
                    'Targets: Continuously moving circles',
                    'Objective: Stay on target while it moves',
                    'Scoring: Based on tracking accuracy over time'
                ]
            },
            switch: {
                name: 'Target Switching',
                icon: '🎪',
                description: 'Switch between multiple marked targets quickly to train target acquisition.',
                instructions: [
                    'Duration: Variable (30-120 seconds)',
                    'Targets: Multiple targets with one active at a time',
                    'Objective: Hit only the highlighted active target',
                    'Scoring: Emphasizes target recognition and switching speed'
                ]
            }
        };

        // Difficulty settings for each mode
        this.difficultySettings = {
            gridshot: {
                easy: { targetSize: 60, spawnRate: 800, targetLifetime: 2500, maxTargets: 3 },
                medium: { targetSize: 45, spawnRate: 600, targetLifetime: 2000, maxTargets: 4 },
                hard: { targetSize: 30, spawnRate: 400, targetLifetime: 1500, maxTargets: 5 },
                extreme: { targetSize: 20, spawnRate: 300, targetLifetime: 1200, maxTargets: 6 }
            },
            flick: {
                easy: { targetSize: 50, spawnRate: 1200, minDistance: 300, maxTargets: 1 },
                medium: { targetSize: 35, spawnRate: 900, minDistance: 400, maxTargets: 1 },
                hard: { targetSize: 25, spawnRate: 700, minDistance: 500, maxTargets: 1 },
                extreme: { targetSize: 18, spawnRate: 500, minDistance: 600, maxTargets: 1 }
            },
            track: {
                easy: { targetSize: 50, speed: 2, direction: 'linear', maxTargets: 1 },
                medium: { targetSize: 40, speed: 3.5, direction: 'curved', maxTargets: 1 },
                hard: { targetSize: 30, speed: 5, direction: 'erratic', maxTargets: 1 },
                extreme: { targetSize: 22, speed: 7, direction: 'chaotic', maxTargets: 1 }
            },
            switch: {
                easy: { targetSize: 45, switchRate: 1500, totalTargets: 4, maxDistance: 300 },
                medium: { targetSize: 35, switchRate: 1200, totalTargets: 5, maxDistance: 400 },
                hard: { targetSize: 25, switchRate: 900, totalTargets: 6, maxDistance: 500 },
                extreme: { targetSize: 18, switchRate: 600, totalTargets: 8, maxDistance: 600 }
            }
        };

        // Target size overrides
        this.sizeSettings = {
            large: 60,
            medium: 40,
            small: 25,
            tiny: 15
        };

        this.currentSettings = this.difficultySettings.gridshot.medium;
        this.lastSpawn = 0;
        this.lastSwitch = 0;
        this.gameLoop = null;
        this.mousePosition = { x: 0, y: 0 };

        this.initializeEventListeners();
        this.initializeCrosshair();
        this.updateUI();
    }

    initializeEventListeners() {
        // Test mode selection
        document.getElementById('testMode').addEventListener('change', (e) => {
            this.testMode = e.target.value;
            this.updateUI();
        });

        // Target size selection
        document.getElementById('targetSize').addEventListener('change', (e) => {
            this.targetSize = e.target.value;
        });

        // Test duration selection
        document.getElementById('testDuration').addEventListener('change', (e) => {
            this.duration = parseInt(e.target.value);
            this.timeRemaining = this.duration;
        });

        // Difficulty selection
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.difficulty = e.target.dataset.difficulty;
                this.currentSettings = this.difficultySettings[this.testMode][this.difficulty];
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

        // Canvas events
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));

        // Share and modal events
        this.initializeModalEvents();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isRunning) {
                e.preventDefault();
                this.pauseTest();
            } else if (e.code === 'Escape') {
                this.exitTest();
            }
        });
    }

    initializeModalEvents() {
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
    }

    updateUI() {
        const mode = this.testModes[this.testMode];

        // Update test description
        const description = document.getElementById('testDescription');
        description.innerHTML = `
            <p>${mode.description}</p>
            <ul style="text-align: left; margin-top: var(--space-4); color: var(--text-secondary);">
                ${mode.instructions.map(instruction => `<li><strong>${instruction.split(':')[0]}:</strong> ${instruction.split(':').slice(1).join(':')}</li>`).join('')}
            </ul>
        `;

        // Update start button
        document.getElementById('startButtonText').textContent = `${mode.icon} Start ${mode.name}`;

        // Update current settings based on mode
        this.currentSettings = this.difficultySettings[this.testMode][this.difficulty];
    }

    initializeCrosshair() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.crosshair.style.left = (rect.left + x - 10) + 'px';
            this.crosshair.style.top = (rect.top + y - 10) + 'px';

            this.mousePosition = { x, y };
        });
    }

    startTest() {
        if (window.uiSystem) {
            window.uiSystem.showLoading(`Initializing ${this.testModes[this.testMode].name} test environment...`);
        }

        setTimeout(() => {
            // Hide setup, show arena and metrics
            document.getElementById('testSetup').style.display = 'none';
            document.getElementById('testArena').style.display = 'block';
            document.getElementById('liveMetrics').style.display = 'block';

            // Initialize test
            this.isRunning = true;
            this.startTime = Date.now();
            this.timeRemaining = this.duration;
            this.resetMetrics();
            this.currentSettings = this.difficultySettings[this.testMode][this.difficulty];

            // Apply target size override
            if (this.sizeSettings[this.targetSize]) {
                this.currentSettings.targetSize = this.sizeSettings[this.targetSize];
            }

            // Initialize mode-specific setup
            this.initializeTestMode();

            // Start game loop
            this.gameLoop = requestAnimationFrame(() => this.update());

            if (window.uiSystem) {
                window.uiSystem.hideLoading();
                window.uiSystem.showSuccess(`${this.testModes[this.testMode].name} Started`, `${this.testModes[this.testMode].name} test is now active. Good luck!`);
            }
        }, 800);
    }

    initializeTestMode() {
        this.targets = [];
        this.particles = [];
        this.trailLines = [];
        this.activeTargetIndex = 0;
        this.lastSpawn = 0;
        this.lastSwitch = 0;

        // Mode-specific initialization
        switch (this.testMode) {
            case 'gridshot':
                // Standard grid shot - no special setup needed
                break;

            case 'flick':
                // Start with one target for flick training
                this.spawnFlickTarget();
                break;

            case 'track':
                // Start with one moving target
                this.spawnTrackingTarget();
                break;

            case 'switch':
                // Create multiple targets, mark one as active
                this.spawnSwitchTargets();
                break;
        }
    }

    spawnFlickTarget() {
        // Ensure minimum distance from last target
        let newPos;
        let attempts = 0;
        const minDistance = this.currentSettings.minDistance || 400;

        do {
            newPos = {
                x: Math.random() * (this.canvas.width - this.currentSettings.targetSize * 2) + this.currentSettings.targetSize,
                y: Math.random() * (this.canvas.height - this.currentSettings.targetSize * 2) + this.currentSettings.targetSize
            };
            attempts++;
        } while (this.targets.length > 0 &&
                 this.getDistance(newPos, this.targets[this.targets.length - 1]) < minDistance &&
                 attempts < 10);

        const target = {
            x: newPos.x,
            y: newPos.y,
            size: this.currentSettings.targetSize,
            spawnTime: Date.now(),
            lifetime: 3000, // Longer lifetime for flick targets
            type: 'flick'
        };

        this.targets = [target]; // Only one target at a time for flick
        this.metrics.targetsSeen++;
    }

    spawnTrackingTarget() {
        const target = {
            x: Math.random() * (this.canvas.width - this.currentSettings.targetSize),
            y: Math.random() * (this.canvas.height - this.currentSettings.targetSize),
            size: this.currentSettings.targetSize,
            spawnTime: Date.now(),
            vx: (Math.random() - 0.5) * this.currentSettings.speed * 2,
            vy: (Math.random() - 0.5) * this.currentSettings.speed * 2,
            type: 'tracking',
            direction: this.currentSettings.direction
        };

        this.targets = [target]; // Only one tracking target
        this.metrics.targetsSeen++;
    }

    spawnSwitchTargets() {
        this.targets = [];
        const totalTargets = this.currentSettings.totalTargets;
        const maxDistance = this.currentSettings.maxDistance;

        for (let i = 0; i < totalTargets; i++) {
            let newPos;
            let attempts = 0;

            do {
                newPos = {
                    x: Math.random() * (this.canvas.width - this.currentSettings.targetSize * 2) + this.currentSettings.targetSize,
                    y: Math.random() * (this.canvas.height - this.currentSettings.targetSize * 2) + this.currentSettings.targetSize
                };
                attempts++;
            } while (attempts < 20 && this.targets.some(target =>
                this.getDistance(newPos, target) < maxDistance * 0.3
            ));

            const target = {
                x: newPos.x,
                y: newPos.y,
                size: this.currentSettings.targetSize,
                spawnTime: Date.now(),
                type: 'switch',
                index: i,
                active: i === 0 // First target starts active
            };

            this.targets.push(target);
        }

        this.activeTargetIndex = 0;
        this.metrics.targetsSeen += totalTargets;
    }

    getDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    handleClick(e) {
        if (!this.isRunning) return;

        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const clickTime = Date.now();

        this.metrics.totalShots++;
        this.metrics.clickPositions.push({ x: clickX, y: clickY, time: clickTime });

        let hit = false;
        const targetsToRemove = [];

        // Mode-specific hit detection
        switch (this.testMode) {
            case 'gridshot':
            case 'flick':
                // Standard hit detection
                for (let i = 0; i < this.targets.length; i++) {
                    if (this.isTargetHit(this.targets[i], clickX, clickY)) {
                        this.processHit(this.targets[i], clickTime);
                        targetsToRemove.push(i);
                        hit = true;
                        break;
                    }
                }
                break;

            case 'track':
                // Tracking requires continuous accuracy, not clicks
                // Handle as a miss for tracking mode
                this.metrics.totalMisses++;
                break;

            case 'switch':
                // Only active target can be hit
                const activeTarget = this.targets[this.activeTargetIndex];
                if (activeTarget && this.isTargetHit(activeTarget, clickX, clickY)) {
                    this.processHit(activeTarget, clickTime);
                    this.switchToNextTarget();
                    hit = true;
                } else {
                    this.metrics.totalMisses++;
                }
                break;
        }

        // Remove hit targets
        for (let i = targetsToRemove.length - 1; i >= 0; i--) {
            this.targets.splice(targetsToRemove[i], 1);
        }

        if (!hit && this.testMode !== 'track') {
            this.metrics.totalMisses++;
            this.metrics.streakCurrent = 0;
        }

        // Create hit/miss effect
        this.createClickEffect(clickX, clickY, hit);
        this.updateLiveMetrics();
    }

    switchToNextTarget() {
        // Deactivate current target
        if (this.targets[this.activeTargetIndex]) {
            this.targets[this.activeTargetIndex].active = false;
        }

        // Move to next target
        this.activeTargetIndex = (this.activeTargetIndex + 1) % this.targets.length;

        // Activate new target
        if (this.targets[this.activeTargetIndex]) {
            this.targets[this.activeTargetIndex].active = true;
        }

        this.lastSwitch = Date.now();
    }

    handleMouseMove(e) {
        if (!this.isRunning || this.testMode !== 'track') return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Check if mouse is over tracking target
        if (this.targets.length > 0) {
            const target = this.targets[0];
            const distance = this.getDistance({ x: mouseX, y: mouseY }, target);

            if (distance <= target.size / 2) {
                // Mouse is on target - increase tracking accuracy
                this.metrics.trackingAccuracy += 0.1;
            }

            // Record mouse movement for analysis
            this.metrics.mouseMovement.push({
                x: mouseX,
                y: mouseY,
                time: Date.now(),
                onTarget: distance <= target.size / 2
            });
        }
    }

    isTargetHit(target, clickX, clickY) {
        const distance = Math.sqrt(
            Math.pow(clickX - target.x, 2) +
            Math.pow(clickY - target.y, 2)
        );
        return distance <= target.size / 2;
    }

    processHit(target, clickTime) {
        const reactionTime = clickTime - target.spawnTime;

        this.metrics.totalHits++;
        this.metrics.reactionTimes.push(reactionTime);
        this.metrics.streakCurrent++;
        this.metrics.streakBest = Math.max(this.metrics.streakBest, this.metrics.streakCurrent);

        // Mode-specific scoring
        let points = 100;
        switch (this.testMode) {
            case 'flick':
                // Bonus points for long distance flicks
                if (this.targets.length > 1) {
                    const flickDistance = this.getDistance(target, this.targets[this.targets.length - 2]);
                    this.metrics.flickDistance.push(flickDistance);
                    points += Math.floor(flickDistance / 10);
                }
                break;

            case 'switch':
                // Bonus for fast switching
                if (this.lastSwitch > 0) {
                    const switchTime = clickTime - this.lastSwitch;
                    this.metrics.switchSpeed.push(switchTime);
                    points += Math.max(0, 50 - Math.floor(switchTime / 10));
                }
                break;
        }

        this.metrics.score += points;

        // Store hit data
        this.metrics.hitZones.push({
            x: target.x,
            y: target.y,
            clickX: this.mousePosition.x,
            clickY: this.mousePosition.y,
            reactionTime: reactionTime,
            points: points
        });
    }

    createClickEffect(x, y, hit) {
        const effect = {
            x: x,
            y: y,
            life: 30,
            maxLife: 30,
            text: hit ? '+' + (this.testMode === 'flick' ? '150' : '100') : 'MISS',
            color: hit ? '#4CAF50' : '#F44336'
        };
        this.particles.push(effect);
    }

    update() {
        if (!this.isRunning) return;

        const currentTime = Date.now();
        const elapsed = (currentTime - this.startTime) / 1000;
        this.timeRemaining = Math.max(0, this.duration - elapsed);

        // Update timer display
        document.getElementById('timerDisplay').textContent = Math.ceil(this.timeRemaining);
        document.getElementById('scoreDisplay').textContent = `Score: ${this.metrics.score}`;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and render based on mode
        this.updateTestMode(currentTime);

        // Update particles
        this.updateParticles();

        // Render everything
        this.render();

        // Check if test is complete
        if (this.timeRemaining <= 0) {
            this.endTest();
            return;
        }

        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    updateTestMode(currentTime) {
        switch (this.testMode) {
            case 'gridshot':
                this.updateGridShot(currentTime);
                break;
            case 'flick':
                this.updateFlickShot(currentTime);
                break;
            case 'track':
                this.updateTracking(currentTime);
                break;
            case 'switch':
                this.updateSwitching(currentTime);
                break;
        }
    }

    updateGridShot(currentTime) {
        // Spawn new targets
        if (currentTime - this.lastSpawn > this.currentSettings.spawnRate &&
            this.targets.length < this.currentSettings.maxTargets) {
            this.spawnGridTarget();
            this.lastSpawn = currentTime;
        }

        // Remove expired targets
        this.targets = this.targets.filter(target => {
            if (currentTime - target.spawnTime > this.currentSettings.targetLifetime) {
                this.metrics.missedTargets.push(target);
                return false;
            }
            return true;
        });
    }

    updateFlickShot(currentTime) {
        // Remove expired targets and spawn new ones
        this.targets = this.targets.filter(target => {
            if (currentTime - target.spawnTime > target.lifetime) {
                this.spawnFlickTarget(); // Immediately spawn new target
                return false;
            }
            return true;
        });

        // Ensure we always have a target
        if (this.targets.length === 0) {
            this.spawnFlickTarget();
        }
    }

    updateTracking(currentTime) {
        // Update tracking target movement
        if (this.targets.length > 0) {
            const target = this.targets[0];

            // Update position
            target.x += target.vx;
            target.y += target.vy;

            // Bounce off walls
            if (target.x <= target.size/2 || target.x >= this.canvas.width - target.size/2) {
                target.vx *= -1;
                target.x = Math.max(target.size/2, Math.min(this.canvas.width - target.size/2, target.x));
            }
            if (target.y <= target.size/2 || target.y >= this.canvas.height - target.size/2) {
                target.vy *= -1;
                target.y = Math.max(target.size/2, Math.min(this.canvas.height - target.size/2, target.y));
            }

            // Add movement variation based on difficulty
            if (target.direction === 'curved') {
                const time = (currentTime - target.spawnTime) * 0.001;
                target.vx += Math.sin(time) * 0.5;
                target.vy += Math.cos(time) * 0.5;
            } else if (target.direction === 'erratic') {
                if (Math.random() < 0.02) {
                    target.vx += (Math.random() - 0.5) * 2;
                    target.vy += (Math.random() - 0.5) * 2;
                }
            } else if (target.direction === 'chaotic') {
                target.vx += (Math.random() - 0.5) * 1;
                target.vy += (Math.random() - 0.5) * 1;
                // Clamp velocity
                const maxSpeed = this.currentSettings.speed;
                const currentSpeed = Math.sqrt(target.vx * target.vx + target.vy * target.vy);
                if (currentSpeed > maxSpeed) {
                    target.vx = (target.vx / currentSpeed) * maxSpeed;
                    target.vy = (target.vy / currentSpeed) * maxSpeed;
                }
            }
        }
    }

    updateSwitching(currentTime) {
        // Auto-switch targets after a delay
        if (currentTime - this.lastSwitch > this.currentSettings.switchRate) {
            this.switchToNextTarget();
        }
    }

    spawnGridTarget() {
        const target = {
            x: Math.random() * (this.canvas.width - this.currentSettings.targetSize),
            y: Math.random() * (this.canvas.height - this.currentSettings.targetSize),
            size: this.currentSettings.targetSize,
            spawnTime: Date.now(),
            type: 'grid'
        };
        this.targets.push(target);
        this.metrics.targetsSeen++;
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.life--;
            particle.y -= 2;
            return particle.life > 0;
        });
    }

    render() {
        // Render targets
        this.targets.forEach(target => {
            this.ctx.save();

            // Target styling based on type
            if (target.type === 'flick') {
                this.ctx.fillStyle = 'rgba(255, 193, 7, 0.9)';
                this.ctx.shadowColor = 'rgba(255, 193, 7, 0.5)';
                this.ctx.shadowBlur = 20;
            } else if (target.type === 'tracking') {
                this.ctx.fillStyle = 'rgba(76, 175, 80, 0.9)';
                this.ctx.shadowColor = 'rgba(76, 175, 80, 0.5)';
                this.ctx.shadowBlur = 20;
            } else if (target.type === 'switch') {
                if (target.active) {
                    this.ctx.fillStyle = 'rgba(244, 67, 54, 0.9)';
                    this.ctx.shadowColor = 'rgba(244, 67, 54, 0.7)';
                    this.ctx.shadowBlur = 25;
                } else {
                    this.ctx.fillStyle = 'rgba(156, 39, 176, 0.6)';
                    this.ctx.shadowColor = 'rgba(156, 39, 176, 0.3)';
                    this.ctx.shadowBlur = 15;
                }
            } else {
                this.ctx.fillStyle = 'rgba(234, 67, 53, 0.9)';
                this.ctx.shadowColor = 'rgba(234, 67, 53, 0.4)';
                this.ctx.shadowBlur = 20;
            }

            // Draw target
            this.ctx.beginPath();
            this.ctx.arc(target.x, target.y, target.size / 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw target index for switch mode
            if (target.type === 'switch') {
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 16px Inter';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(target.index + 1, target.x, target.y + 5);
            }

            this.ctx.restore();
        });

        // Render particles
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.fillStyle = particle.color;
            this.ctx.font = 'bold 20px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.fillText(particle.text, particle.x, particle.y);
            this.ctx.restore();
        });
    }

    updateLiveMetrics() {
        const accuracy = this.metrics.totalShots > 0 ?
            ((this.metrics.totalHits / this.metrics.totalShots) * 100).toFixed(1) : '0.0';
        const avgReaction = this.metrics.reactionTimes.length > 0 ?
            Math.round(this.metrics.reactionTimes.reduce((a, b) => a + b, 0) / this.metrics.reactionTimes.length) : 0;
        const kps = this.timeRemaining < this.duration ?
            (this.metrics.totalHits / (this.duration - this.timeRemaining)).toFixed(1) : '0.0';

        document.getElementById('liveAccuracy').textContent = accuracy + '%';
        document.getElementById('liveKPS').textContent = kps;
        document.getElementById('liveReaction').textContent = avgReaction;
        document.getElementById('liveStreak').textContent = this.metrics.streakBest;
    }

    endTest() {
        this.isRunning = false;
        this.endTime = Date.now();

        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }

        this.calculateFinalMetrics();
        this.showResults();
    }

    calculateFinalMetrics() {
        const totalTime = (this.endTime - this.startTime) / 1000;

        this.metrics.accuracy = this.metrics.totalShots > 0 ?
            (this.metrics.totalHits / this.metrics.totalShots) * 100 : 0;

        this.metrics.averageReactionTime = this.metrics.reactionTimes.length > 0 ?
            this.metrics.reactionTimes.reduce((a, b) => a + b, 0) / this.metrics.reactionTimes.length : 0;

        this.metrics.killsPerSecond = totalTime > 0 ? this.metrics.totalHits / totalTime : 0;

        // Calculate consistency (lower standard deviation = higher consistency)
        if (this.metrics.reactionTimes.length > 1) {
            const mean = this.metrics.averageReactionTime;
            const variance = this.metrics.reactionTimes.reduce((acc, time) =>
                acc + Math.pow(time - mean, 2), 0) / this.metrics.reactionTimes.length;
            const stdDev = Math.sqrt(variance);
            this.metrics.consistency = Math.max(0, 100 - (stdDev / 10));
        }

        // Mode-specific final calculations
        if (this.testMode === 'track') {
            // Normalize tracking accuracy
            this.metrics.trackingAccuracy = Math.min(100, this.metrics.trackingAccuracy);
            this.metrics.score += Math.floor(this.metrics.trackingAccuracy * 10);
        }
    }

    showResults() {
        // Hide test arena and metrics, show results
        document.getElementById('testArena').style.display = 'none';
        document.getElementById('liveMetrics').style.display = 'none';
        document.getElementById('testResults').style.display = 'block';

        // Update final metrics display
        document.getElementById('finalScore').textContent = Math.round(this.metrics.score);
        document.getElementById('totalHits').textContent = this.metrics.totalHits;
        document.getElementById('finalAccuracy').textContent = this.metrics.accuracy.toFixed(1) + '%';
        document.getElementById('avgReactionTime').textContent = Math.round(this.metrics.averageReactionTime) + 'ms';
        document.getElementById('killsPerSecond').textContent = this.metrics.killsPerSecond.toFixed(1);
        document.getElementById('consistency').textContent = this.metrics.consistency.toFixed(1) + '%';

        // Generate performance comparison
        this.generatePerformanceComparison();
        this.drawRadarChart();
        this.updateRecentScores();
    }

    generatePerformanceComparison() {
        let rank = 'Beginner';
        let percentile = 10;

        if (this.metrics.accuracy >= 90 && this.metrics.averageReactionTime <= 300) {
            rank = 'Pro Level';
            percentile = 95;
        } else if (this.metrics.accuracy >= 80 && this.metrics.averageReactionTime <= 400) {
            rank = 'Advanced';
            percentile = 80;
        } else if (this.metrics.accuracy >= 70 && this.metrics.averageReactionTime <= 500) {
            rank = 'Intermediate';
            percentile = 60;
        } else if (this.metrics.accuracy >= 60) {
            rank = 'Improving';
            percentile = 40;
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

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Radar chart data (normalized to 0-1)
        const data = {
            'Accuracy': this.metrics.accuracy / 100,
            'Speed': Math.min(1, this.metrics.killsPerSecond / 3),
            'Reaction': Math.max(0, 1 - (this.metrics.averageReactionTime / 1000)),
            'Consistency': this.metrics.consistency / 100,
            'Precision': Math.min(1, this.metrics.score / 5000)
        };

        const labels = Object.keys(data);
        const values = Object.values(data);
        const angleStep = (Math.PI * 2) / labels.length;

        // Draw radar grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;

        for (let i = 1; i <= 5; i++) {
            ctx.beginPath();
            for (let j = 0; j <= labels.length; j++) {
                const angle = j * angleStep - Math.PI / 2;
                const x = centerX + Math.cos(angle) * (radius * i / 5);
                const y = centerY + Math.sin(angle) * (radius * i / 5);

                if (j === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }

        // Draw radar axes
        ctx.beginPath();
        for (let i = 0; i < labels.length; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw data polygon
        ctx.fillStyle = 'rgba(26, 115, 232, 0.3)';
        ctx.strokeStyle = 'rgba(26, 115, 232, 0.8)';
        ctx.lineWidth = 2;

        ctx.beginPath();
        for (let i = 0; i <= values.length; i++) {
            const value = values[i % values.length];
            const angle = (i % values.length) * angleStep - Math.PI / 2;
            const x = centerX + Math.cos(angle) * (radius * value);
            const y = centerY + Math.sin(angle) * (radius * value);

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw labels
        ctx.fillStyle = 'white';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';

        for (let i = 0; i < labels.length; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const x = centerX + Math.cos(angle) * (radius + 20);
            const y = centerY + Math.sin(angle) * (radius + 20);

            ctx.fillText(labels[i], x, y + 4);
        }
    }

    updateRecentScores() {
        const scores = [
            { player: 'You', score: Math.round(this.metrics.score) },
        ].sort((a, b) => b.score - a.score);

        const container = document.getElementById('recentScores');
        container.innerHTML = scores.map(score => `
            <div class="score-item ${score.player === 'You' ? 'highlight' : ''}">
                <span class="score-player">${score.player}</span>
                <span class="score-value">${score.score}</span>
            </div>
        `).join('');
    }

    resetMetrics() {
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
            // Mode-specific metrics
            flickDistance: [],
            trackingAccuracy: 0,
            switchSpeed: [],
            mouseMovement: [],
            // Advanced analytics data
            clickPositions: [],
            targetPositions: [],
            missedTargets: [],
            hitZones: [],
            sessionStartTime: Date.now(),
            detailedTimings: []
        };
    }

    // Additional methods (saveResults, shareResults, etc.) remain the same as in the original
    saveResults() {
        const results = {
            testMode: this.testMode,
            difficulty: this.difficulty,
            duration: this.duration,
            metrics: this.metrics,
            timestamp: Date.now()
        };

        const existingResults = JSON.parse(localStorage.getItem('aimhelper_results') || '[]');
        existingResults.unshift(results);
        existingResults.splice(10); // Keep only latest 10 results

        localStorage.setItem('aimhelper_results', JSON.stringify(existingResults));

        if (window.uiSystem) {
            window.uiSystem.showSuccess('Results Saved', 'Your test results have been saved to your profile.', {
                actions: [
                    { text: 'View History', action: () => console.log('View history clicked') },
                    { text: 'Share Results', action: () => this.shareResults() }
                ]
            });
        }
    }

    shareResults() {
        const shareText = this.generateShareText();
        document.getElementById('sharePreview').textContent = shareText;
        document.getElementById('shareModal').classList.add('active');
    }

    generateShareText() {
        const mode = this.testModes[this.testMode];
        return `🎯 ${mode.name} Results - AimHelper Pro

Score: ${Math.round(this.metrics.score)}
Accuracy: ${this.metrics.accuracy.toFixed(1)}%
Hits: ${this.metrics.totalHits}
Avg Reaction: ${Math.round(this.metrics.averageReactionTime)}ms
Best Streak: ${this.metrics.streakBest}

Train your aim at aimhelper.pro! #AimTraining #FPS`;
    }

    copyShareText() {
        const text = this.generateShareText();

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                if (window.uiSystem) {
                    window.uiSystem.showSuccess('Copied!', 'Results copied to clipboard');
                }
            }).catch(() => {
                this.fallbackCopy(text);
            });
        } else {
            this.fallbackCopy(text);
        }
    }

    fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        if (window.uiSystem) {
            window.uiSystem.showSuccess('Copied!', 'Results copied to clipboard');
        }
    }

    tweetScore() {
        const text = encodeURIComponent(this.generateShareText());
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    }

    showLeaderboard() {
        const leaderboard = [];

        const container = document.getElementById('fullLeaderboard');
        container.innerHTML = leaderboard.map((entry, index) => `
            <div class="score-item">
                <span class="score-player">#${index + 1} ${entry.player} (${entry.mode})</span>
                <span class="score-value">${entry.score}</span>
            </div>
        `).join('');

        document.getElementById('leaderboardModal').classList.add('active');
    }

    retryTest() {
        document.getElementById('testResults').style.display = 'none';
        document.getElementById('testSetup').style.display = 'block';
    }

    nextTest() {
        // Cycle to next test mode
        const modes = Object.keys(this.testModes);
        const currentIndex = modes.indexOf(this.testMode);
        const nextIndex = (currentIndex + 1) % modes.length;

        document.getElementById('testMode').value = modes[nextIndex];
        this.testMode = modes[nextIndex];
        this.updateUI();
        this.retryTest();
    }

    exitTest() {
        if (this.isRunning) {
            this.isRunning = false;
            if (this.gameLoop) {
                cancelAnimationFrame(this.gameLoop);
            }
        }

        // Reset display
        document.getElementById('testArena').style.display = 'none';
        document.getElementById('liveMetrics').style.display = 'none';
        document.getElementById('testResults').style.display = 'none';
        document.getElementById('testSetup').style.display = 'block';

        // Clear canvas
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    pauseTest() {
        if (this.isRunning) {
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                cancelAnimationFrame(this.gameLoop);
            } else {
                this.gameLoop = requestAnimationFrame(() => this.update());
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Make uiSystem available globally if it exists
    if (typeof UISystem !== 'undefined') {
        window.uiSystem = new UISystem();
    }

    // Initialize the advanced aim trainer
    new AdvancedAimTrainer();
});