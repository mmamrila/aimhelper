let testSettings = null;
let canvas = null;
let ctx = null;
let isTestRunning = false;
let currentTest = 0;
let totalTests = 5;
let testResults = [];

const testConfigurations = [
    { dpiMultiplier: 0.8, sensMultiplier: 0.8 },
    { dpiMultiplier: 0.9, sensMultiplier: 0.9 },
    { dpiMultiplier: 1.0, sensMultiplier: 1.0 },
    { dpiMultiplier: 1.1, sensMultiplier: 1.1 },
    { dpiMultiplier: 1.2, sensMultiplier: 1.2 }
];

let targets = [];
let crosshair = {
    x: 500,
    y: 300,
    size: 16
};

let testData = {
    startTime: 0,
    duration: 45000, // Longer test for close tracking
    samples: [],
    totalDistance: 0,
    timeOnTarget: 0,
    lastSampleTime: 0,
    // Enhanced tracking for Apex-specific metrics
    targetSwitches: 0,
    adaptabilityScore: 0,
    overshoots: 0,
    undershoots: 0,
    corrections: 0,
    movementPath: [],
    velocityData: [],
    lastCrosshairPos: { x: 500, y: 300 },
    targetVelocityMatching: [],
    closeRangeAccuracy: 0
};

function initTest() {
    const settings = localStorage.getItem('testSettings');
    if (!settings) {
        alert('No test settings found. Returning to app.');
        window.location.href = '/';
        return;
    }

    testSettings = JSON.parse(settings);

    document.getElementById('currentDPI').textContent = testSettings.dpi;
    document.getElementById('currentSens').textContent = testSettings.sensitivity;

    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseenter', () => {
        canvas.style.cursor = 'none';
    });
    canvas.addEventListener('mouseleave', () => {
        canvas.style.cursor = 'default';
    });

    document.getElementById('startBtn').addEventListener('click', startTest);
    document.getElementById('retryBtn').addEventListener('click', () => {
        location.reload();
    });
}

function startTest() {
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('testArea').style.display = 'block';

    currentTest = 0;
    testResults = [];
    runNextTest();
}

function runNextTest() {
    if (currentTest >= totalTests) {
        showResults();
        return;
    }

    const config = testConfigurations[currentTest];
    const currentDPI = Math.round(testSettings.dpi * config.dpiMultiplier);
    const currentSens = Math.round(testSettings.sensitivity * config.sensMultiplier * 100) / 100;

    document.getElementById('currentTestNum').textContent = currentTest + 1;
    document.getElementById('totalTests').textContent = totalTests;
    document.getElementById('testDPI').textContent = currentDPI;
    document.getElementById('testSens').textContent = currentSens;

    resetTestData();

    setTimeout(() => {
        startSingleTest(currentDPI, currentSens);
    }, 1000);
}

function resetTestData() {
    targets = [];
    crosshair.x = canvas.width / 2;
    crosshair.y = canvas.height / 2;

    // Create multiple fast-moving targets
    for (let i = 0; i < 2; i++) {
        targets.push(createTarget());
    }

    testData = {
        startTime: Date.now(),
        duration: 45000,
        samples: [],
        totalDistance: 0,
        timeOnTarget: 0,
        lastSampleTime: Date.now(),
        // Enhanced tracking for Apex-specific metrics
        targetSwitches: 0,
        adaptabilityScore: 0,
        overshoots: 0,
        undershoots: 0,
        corrections: 0,
        movementPath: [],
        velocityData: [],
        lastCrosshairPos: { x: crosshair.x, y: crosshair.y },
        targetVelocityMatching: [],
        closeRangeAccuracy: 0,
        lastActiveTarget: null
    };
}

function createTarget() {
    return {
        x: Math.random() * (canvas.width - 100) + 50,
        y: Math.random() * (canvas.height - 100) + 50,
        radius: 35, // Larger targets for close-range
        velocityX: (Math.random() - 0.5) * 8, // Fast movement
        velocityY: (Math.random() - 0.5) * 8,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        lastDirectionChange: Date.now(),
        active: true
    };
}

function startSingleTest(dpi, sensitivity) {
    isTestRunning = true;
    testData.startTime = Date.now();

    gameLoop();

    setTimeout(() => {
        endSingleTest(dpi, sensitivity);
    }, testData.duration);
}

function gameLoop() {
    if (!isTestRunning) return;

    updateTargets();
    draw();
    updateTestData();
    updateUI();

    requestAnimationFrame(gameLoop);
}

function updateTargets() {
    const now = Date.now();

    targets.forEach(target => {
        // Update position
        target.x += target.velocityX;
        target.y += target.velocityY;

        // Bounce off walls with some randomness
        if (target.x <= target.radius || target.x >= canvas.width - target.radius) {
            target.velocityX *= -1;
            target.velocityX += (Math.random() - 0.5) * 2; // Add randomness
        }
        if (target.y <= target.radius || target.y >= canvas.height - target.radius) {
            target.velocityY *= -1;
            target.velocityY += (Math.random() - 0.5) * 2; // Add randomness
        }

        // Keep within bounds
        target.x = Math.max(target.radius, Math.min(canvas.width - target.radius, target.x));
        target.y = Math.max(target.radius, Math.min(canvas.height - target.radius, target.y));

        // Random direction changes (simulates erratic movement in Apex)
        if (now - target.lastDirectionChange > 1500 + Math.random() * 2000) {
            target.velocityX = (Math.random() - 0.5) * 10;
            target.velocityY = (Math.random() - 0.5) * 10;
            target.lastDirectionChange = now;
        }

        // Clamp velocity to prevent too extreme movements
        const maxVelocity = 8;
        const currentSpeed = Math.sqrt(target.velocityX * target.velocityX + target.velocityY * target.velocityY);
        if (currentSpeed > maxVelocity) {
            target.velocityX = (target.velocityX / currentSpeed) * maxVelocity;
            target.velocityY = (target.velocityY / currentSpeed) * maxVelocity;
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background (Apex-style)
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw targets
    targets.forEach((target, index) => {
        const distance = Math.sqrt(
            Math.pow(crosshair.x - target.x, 2) +
            Math.pow(crosshair.y - target.y, 2)
        );
        const isBeingTracked = distance <= target.radius;

        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        ctx.fillStyle = isBeingTracked ? '#ff6b35' : target.color;
        ctx.fill();
        ctx.strokeStyle = isBeingTracked ? '#ffffff' : '#444';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw target number
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText((index + 1).toString(), target.x, target.y + 5);
    });

    // Draw crosshair
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(crosshair.x - crosshair.size/2, crosshair.y);
    ctx.lineTo(crosshair.x + crosshair.size/2, crosshair.y);
    ctx.moveTo(crosshair.x, crosshair.y - crosshair.size/2);
    ctx.lineTo(crosshair.x, crosshair.y + crosshair.size/2);
    ctx.stroke();
}

function handleMouseMove(event) {
    if (!isTestRunning) return;

    const rect = canvas.getBoundingClientRect();
    const newX = event.clientX - rect.left;
    const newY = event.clientY - rect.top;

    crosshair.x = Math.max(0, Math.min(canvas.width, newX));
    crosshair.y = Math.max(0, Math.min(canvas.height, newY));

    trackMovementData(crosshair.x, crosshair.y);
}

function trackMovementData(newX, newY) {
    const now = Date.now();
    const timeDelta = Math.max(1, now - testData.lastSampleTime);

    // Calculate movement velocity
    const movement = Math.sqrt(
        Math.pow(newX - testData.lastCrosshairPos.x, 2) +
        Math.pow(newY - testData.lastCrosshairPos.y, 2)
    );
    const velocity = movement / timeDelta * 1000;

    // Record movement path
    testData.movementPath.push({
        x: newX,
        y: newY,
        time: now - testData.startTime,
        targets: targets.map(t => ({ x: t.x, y: t.y, velocityX: t.velocityX, velocityY: t.velocityY }))
    });

    // Record velocity data
    testData.velocityData.push({
        velocity: velocity,
        time: now - testData.startTime
    });

    // Detect corrections
    if (testData.velocityData.length > 3) {
        detectCorrections(velocity);
    }

    testData.lastCrosshairPos = { x: newX, y: newY };
}

function detectCorrections(currentVelocity) {
    const recentVelocities = testData.velocityData.slice(-4).map(v => v.velocity);
    const velocityChange = Math.abs(currentVelocity - recentVelocities[recentVelocities.length - 2]);
    const avgVelocity = recentVelocities.reduce((a, b) => a + b) / recentVelocities.length;

    if (velocityChange > avgVelocity * 1.8 && currentVelocity > 120) {
        testData.corrections++;
    }
}

function updateTestData() {
    const now = Date.now();
    let currentActiveTarget = null;
    let minDistance = Infinity;

    // Find closest target being tracked
    targets.forEach((target, index) => {
        const distance = Math.sqrt(
            Math.pow(crosshair.x - target.x, 2) +
            Math.pow(crosshair.y - target.y, 2)
        );

        if (distance <= target.radius && distance < minDistance) {
            minDistance = distance;
            currentActiveTarget = index;
        }
    });

    // Detect target switches (important for Apex multi-enemy scenarios)
    if (currentActiveTarget !== null && testData.lastActiveTarget !== null &&
        currentActiveTarget !== testData.lastActiveTarget) {
        testData.targetSwitches++;
    }

    testData.lastActiveTarget = currentActiveTarget;

    // Calculate tracking accuracy
    const isTracking = currentActiveTarget !== null;
    if (isTracking) {
        testData.timeOnTarget += now - testData.lastSampleTime;

        // Analyze velocity matching (how well player predicts target movement)
        const target = targets[currentActiveTarget];
        const targetVelocity = Math.sqrt(target.velocityX * target.velocityX + target.velocityY * target.velocityY);

        if (testData.velocityData.length > 0) {
            const playerVelocity = testData.velocityData[testData.velocityData.length - 1].velocity;
            const velocityMatchScore = Math.max(0, 100 - Math.abs(playerVelocity - targetVelocity * 30)); // Scale target velocity
            testData.targetVelocityMatching.push(velocityMatchScore);
        }
    }

    testData.samples.push({
        time: now - testData.startTime,
        isTracking: isTracking,
        activeTarget: currentActiveTarget,
        distance: minDistance
    });

    testData.lastSampleTime = now;
}

function updateUI() {
    const elapsed = Date.now() - testData.startTime;
    const remaining = Math.max(0, Math.ceil((testData.duration - elapsed) / 1000));

    document.getElementById('timeDisplay').textContent = remaining;

    const trackingAccuracy = testData.samples.length > 0 ?
        (testData.timeOnTarget / elapsed) * 100 : 0;

    document.getElementById('trackingDisplay').textContent = Math.round(trackingAccuracy);
}

function endSingleTest(dpi, sensitivity) {
    isTestRunning = false;
    targets = [];

    const trackingAccuracy = (testData.timeOnTarget / testData.duration) * 100;
    const targetSwitchRate = (testData.targetSwitches / testData.duration) * 1000;
    const correctionRate = (testData.corrections / testData.duration) * 1000;
    const adaptabilityScore = calculateAdaptabilityScore();
    const velocityMatchingScore = testData.targetVelocityMatching.length > 0 ?
        testData.targetVelocityMatching.reduce((a, b) => a + b) / testData.targetVelocityMatching.length : 0;
    const movementSmoothness = calculateMovementSmoothness();
    const inchesPer360 = 10080 / (dpi * sensitivity);

    const result = {
        dpi: dpi,
        sensitivity: sensitivity,
        inchesPer360: inchesPer360,
        trackingAccuracy: trackingAccuracy,
        targetSwitchRate: targetSwitchRate,
        correctionRate: correctionRate,
        adaptabilityScore: adaptabilityScore,
        velocityMatchingScore: velocityMatchingScore,
        movementSmoothness: movementSmoothness,
        // Apex-specific optimization score
        apexOptimizationScore: calculateApexScore(trackingAccuracy, adaptabilityScore, velocityMatchingScore, correctionRate)
    };

    testResults.push(result);
    saveTestResult(result);

    currentTest++;

    setTimeout(() => {
        runNextTest();
    }, 2000);
}

function calculateAdaptabilityScore() {
    // Measures how quickly player adapts to target direction changes
    let adaptabilitySum = 0;
    let validSamples = 0;

    for (let i = 1; i < testData.samples.length; i++) {
        const current = testData.samples[i];
        const previous = testData.samples[i - 1];

        if (current.activeTarget === previous.activeTarget && current.activeTarget !== null) {
            const improvementRate = Math.max(0, previous.distance - current.distance);
            adaptabilitySum += improvementRate;
            validSamples++;
        }
    }

    return validSamples > 0 ? Math.min(100, (adaptabilitySum / validSamples) * 2) : 0;
}

function calculateMovementSmoothness() {
    if (testData.velocityData.length < 10) return 0;

    const velocities = testData.velocityData.map(v => v.velocity);
    let smoothnessScore = 0;
    let validSamples = 0;

    for (let i = 2; i < velocities.length - 1; i++) {
        const velocityChange = Math.abs(velocities[i] - velocities[i - 1]);
        const avgVelocity = (velocities[i - 1] + velocities[i] + velocities[i + 1]) / 3;

        if (avgVelocity > 10) {
            const normalizedChange = velocityChange / avgVelocity;
            smoothnessScore += Math.max(0, 1 - normalizedChange);
            validSamples++;
        }
    }

    return validSamples > 0 ? (smoothnessScore / validSamples) * 100 : 0;
}

function calculateApexScore(tracking, adaptability, velocityMatching, corrections) {
    // Apex prioritizes tracking accuracy, adaptability, and target switching
    const trackingWeight = 0.35;
    const adaptabilityWeight = 0.25;
    const velocityWeight = 0.25;
    const correctionWeight = 0.15;

    const correctionScore = Math.max(0, 100 - corrections * 8);

    return (tracking * trackingWeight) +
           (adaptability * adaptabilityWeight) +
           (velocityMatching * velocityWeight) +
           (correctionScore * correctionWeight);
}

async function saveTestResult(result) {
    try {
        const response = await fetch('/api/test-result', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: testSettings.user,
                testType: 'apex-close-tracking',
                dpi: result.dpi,
                inGameSensitivity: result.sensitivity,
                inchesPer360: result.inchesPer360,
                accuracyPercentage: result.trackingAccuracy,
                // Apex-specific metrics
                targetSwitchRate: result.targetSwitchRate,
                correctionRate: result.correctionRate,
                adaptabilityScore: result.adaptabilityScore,
                velocityMatchingScore: result.velocityMatchingScore,
                movementSmoothness: result.movementSmoothness,
                apexOptimizationScore: result.apexOptimizationScore
            })
        });

        if (!response.ok) {
            console.error('Failed to save test result');
        }
    } catch (error) {
        console.error('Error saving test result:', error);
    }
}

function showResults() {
    document.getElementById('testArea').style.display = 'none';
    document.getElementById('results').style.display = 'block';

    const bestResult = testResults.reduce((best, result) =>
        result.apexOptimizationScore > best.apexOptimizationScore ? result : best
    );

    document.getElementById('resultsContent').innerHTML = `
        <div class="results-summary">
            <h3>🔥 Optimal Apex Legends Settings Found</h3>
            <div class="optimal-settings">
                <p><strong>DPI:</strong> ${bestResult.dpi}</p>
                <p><strong>Sensitivity:</strong> ${bestResult.sensitivity}</p>
                <p><strong>in/360:</strong> ${bestResult.inchesPer360.toFixed(1)}in</p>
                <p><strong>Optimization Score:</strong> ${bestResult.apexOptimizationScore.toFixed(1)}/100</p>
            </div>
            <div class="performance-breakdown">
                <p><strong>Tracking Accuracy:</strong> ${bestResult.trackingAccuracy.toFixed(1)}%</p>
                <p><strong>Adaptability:</strong> ${bestResult.adaptabilityScore.toFixed(1)}/100</p>
                <p><strong>Velocity Matching:</strong> ${bestResult.velocityMatchingScore.toFixed(1)}/100</p>
                <p><strong>Target Switches:</strong> ${bestResult.targetSwitchRate.toFixed(1)}/sec</p>
            </div>
        </div>
    `;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initTest);