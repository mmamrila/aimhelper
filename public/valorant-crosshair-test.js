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

let target = {
    x: 600,
    y: 300, // Head level
    width: 400,
    height: 8,
    speed: 0.8,
    direction: 1
};

let crosshair = {
    x: 600,
    y: 300,
    size: 20
};

let testData = {
    startTime: 0,
    duration: 30000,
    samples: [],
    totalDeviation: 0,
    timeOnTarget: 0,
    lastSampleTime: 0,
    // Enhanced tracking for Valorant-specific metrics
    horizontalDeviations: [],
    verticalDeviations: [],
    overshoots: 0,
    undershoots: 0,
    corrections: 0,
    movementPath: [],
    velocityData: [],
    lastCrosshairPos: { x: 600, y: 300 },
    crosshairStability: [],
    preAimAccuracy: 0
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
    target.x = canvas.width / 2;
    target.y = canvas.height * 0.4; // Typical head level
    target.direction = 1;
    crosshair.x = canvas.width / 2;
    crosshair.y = canvas.height * 0.4;

    testData = {
        startTime: Date.now(),
        duration: 30000,
        samples: [],
        totalDeviation: 0,
        timeOnTarget: 0,
        lastSampleTime: Date.now(),
        // Enhanced tracking for Valorant-specific metrics
        horizontalDeviations: [],
        verticalDeviations: [],
        overshoots: 0,
        undershoots: 0,
        corrections: 0,
        movementPath: [],
        velocityData: [],
        lastCrosshairPos: { x: crosshair.x, y: crosshair.y },
        crosshairStability: [],
        preAimAccuracy: 0
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

    updateTarget();
    draw();
    updateTestData();
    updateUI();

    requestAnimationFrame(gameLoop);
}

function updateTarget() {
    // Horizontal movement with some randomness for realistic crosshair placement practice
    target.x += target.speed * target.direction;

    if (target.x <= 200 || target.x >= canvas.width - 200) {
        target.direction *= -1;
        // Add slight vertical variation when changing direction
        target.y += (Math.random() - 0.5) * 20;
        target.y = Math.max(canvas.height * 0.3, Math.min(canvas.height * 0.5, target.y));
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background (simulated map environment)
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw head-level line
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, target.y);
    ctx.lineTo(canvas.width, target.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw target zone (head-level corridor)
    ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
    ctx.fillRect(target.x - target.width/2, target.y - target.height/2, target.width, target.height);

    // Draw target indicator
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(target.x - 20, target.y - 4, 40, 8);

    // Draw crosshair
    ctx.strokeStyle = '#00ff41';
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
        targetX: target.x,
        targetY: target.y,
        time: now - testData.startTime
    });

    // Record velocity and stability data
    testData.velocityData.push({
        velocity: velocity,
        time: now - testData.startTime
    });

    // Detect corrections
    if (testData.velocityData.length > 3) {
        detectCorrections(velocity);
    }

    // Analyze crosshair stability (important for Valorant)
    const stabilityWindow = 500; // ms
    const recentMovements = testData.movementPath.filter(p =>
        now - testData.startTime - p.time < stabilityWindow
    );

    if (recentMovements.length > 5) {
        const avgX = recentMovements.reduce((sum, p) => sum + p.x, 0) / recentMovements.length;
        const avgY = recentMovements.reduce((sum, p) => sum + p.y, 0) / recentMovements.length;
        const stability = Math.sqrt(
            Math.pow(newX - avgX, 2) + Math.pow(newY - avgY, 2)
        );
        testData.crosshairStability.push(stability);
    }

    testData.lastCrosshairPos = { x: newX, y: newY };
}

function detectCorrections(currentVelocity) {
    const recentVelocities = testData.velocityData.slice(-4).map(v => v.velocity);
    const velocityChange = Math.abs(currentVelocity - recentVelocities[recentVelocities.length - 2]);
    const avgVelocity = recentVelocities.reduce((a, b) => a + b) / recentVelocities.length;

    if (velocityChange > avgVelocity * 1.5 && currentVelocity > 80) {
        testData.corrections++;
    }
}

function updateTestData() {
    const now = Date.now();

    // Calculate deviation from ideal crosshair placement
    const horizontalDeviation = Math.abs(crosshair.x - target.x);
    const verticalDeviation = Math.abs(crosshair.y - target.y);

    const totalDeviation = Math.sqrt(
        Math.pow(horizontalDeviation, 2) + Math.pow(verticalDeviation, 2)
    );

    // Consider "on target" if within the head-level corridor
    const isOnTarget = horizontalDeviation <= target.width/2 && verticalDeviation <= target.height/2;

    testData.samples.push({
        time: now - testData.startTime,
        horizontalDeviation: horizontalDeviation,
        verticalDeviation: verticalDeviation,
        totalDeviation: totalDeviation,
        onTarget: isOnTarget
    });

    testData.horizontalDeviations.push(horizontalDeviation);
    testData.verticalDeviations.push(verticalDeviation);

    if (isOnTarget) {
        testData.timeOnTarget += now - testData.lastSampleTime;
    }

    testData.totalDeviation += totalDeviation;
    testData.lastSampleTime = now;
}

function updateUI() {
    const elapsed = Date.now() - testData.startTime;
    const remaining = Math.max(0, Math.ceil((testData.duration - elapsed) / 1000));

    document.getElementById('timeDisplay').textContent = remaining;

    const precision = testData.samples.length > 0 ?
        (testData.timeOnTarget / elapsed) * 100 : 0;

    document.getElementById('precisionDisplay').textContent = Math.round(precision);
}

function endSingleTest(dpi, sensitivity) {
    isTestRunning = false;

    const precision = (testData.timeOnTarget / testData.duration) * 100;
    const avgHorizontalDeviation = testData.horizontalDeviations.reduce((a, b) => a + b, 0) / testData.horizontalDeviations.length;
    const avgVerticalDeviation = testData.verticalDeviations.reduce((a, b) => a + b, 0) / testData.verticalDeviations.length;
    const crosshairStabilityScore = calculateStabilityScore();
    const movementSmoothness = calculateMovementSmoothness();
    const correctionRate = (testData.corrections / testData.duration) * 1000;
    const inchesPer360 = 10080 / (dpi * sensitivity);

    const result = {
        dpi: dpi,
        sensitivity: sensitivity,
        inchesPer360: inchesPer360,
        precision: precision,
        avgHorizontalDeviation: avgHorizontalDeviation,
        avgVerticalDeviation: avgVerticalDeviation,
        crosshairStabilityScore: crosshairStabilityScore,
        movementSmoothness: movementSmoothness,
        correctionRate: correctionRate,
        // Valorant-specific optimization score
        valorantOptimizationScore: calculateValorantScore(precision, crosshairStabilityScore, avgHorizontalDeviation, correctionRate)
    };

    testResults.push(result);
    saveTestResult(result);

    currentTest++;

    setTimeout(() => {
        runNextTest();
    }, 2000);
}

function calculateStabilityScore() {
    if (testData.crosshairStability.length < 10) return 0;

    const avgStability = testData.crosshairStability.reduce((a, b) => a + b) / testData.crosshairStability.length;
    return Math.max(0, 100 - avgStability);
}

function calculateMovementSmoothness() {
    if (testData.velocityData.length < 10) return 0;

    const velocities = testData.velocityData.map(v => v.velocity);
    let smoothnessScore = 0;
    let validSamples = 0;

    for (let i = 2; i < velocities.length - 1; i++) {
        const velocityChange = Math.abs(velocities[i] - velocities[i - 1]);
        const velocityChange2 = Math.abs(velocities[i + 1] - velocities[i]);
        const avgVelocity = (velocities[i - 1] + velocities[i] + velocities[i + 1]) / 3;

        if (avgVelocity > 5) {
            const normalizedChange = (velocityChange + velocityChange2) / (2 * avgVelocity);
            smoothnessScore += Math.max(0, 1 - normalizedChange);
            validSamples++;
        }
    }

    return validSamples > 0 ? (smoothnessScore / validSamples) * 100 : 0;
}

function calculateValorantScore(precision, stability, horizontalDev, corrections) {
    // Valorant prioritizes precision and stability for crosshair placement
    const precisionWeight = 0.4;
    const stabilityWeight = 0.3;
    const horizontalWeight = 0.2;
    const correctionWeight = 0.1;

    const horizontalScore = Math.max(0, 100 - horizontalDev);
    const correctionScore = Math.max(0, 100 - corrections * 10);

    return (precision * precisionWeight) +
           (stability * stabilityWeight) +
           (horizontalScore * horizontalWeight) +
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
                testType: 'valorant-crosshair-placement',
                dpi: result.dpi,
                inGameSensitivity: result.sensitivity,
                inchesPer360: result.inchesPer360,
                accuracyPercentage: result.precision,
                // Valorant-specific metrics
                avgHorizontalDeviation: result.avgHorizontalDeviation,
                avgVerticalDeviation: result.avgVerticalDeviation,
                crosshairStabilityScore: result.crosshairStabilityScore,
                movementSmoothness: result.movementSmoothness,
                correctionRate: result.correctionRate,
                valorantOptimizationScore: result.valorantOptimizationScore
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
        result.valorantOptimizationScore > best.valorantOptimizationScore ? result : best
    );

    document.getElementById('resultsContent').innerHTML = `
        <div class="results-summary">
            <h3>🎯 Optimal Valorant Settings Found</h3>
            <div class="optimal-settings">
                <p><strong>DPI:</strong> ${bestResult.dpi}</p>
                <p><strong>Sensitivity:</strong> ${bestResult.sensitivity}</p>
                <p><strong>in/360:</strong> ${bestResult.inchesPer360.toFixed(1)}in</p>
                <p><strong>Optimization Score:</strong> ${bestResult.valorantOptimizationScore.toFixed(1)}/100</p>
            </div>
            <div class="performance-breakdown">
                <p><strong>Precision:</strong> ${bestResult.precision.toFixed(1)}%</p>
                <p><strong>Stability:</strong> ${bestResult.crosshairStabilityScore.toFixed(1)}/100</p>
                <p><strong>Smoothness:</strong> ${bestResult.movementSmoothness.toFixed(1)}/100</p>
                <p><strong>Horizontal Deviation:</strong> ${bestResult.avgHorizontalDeviation.toFixed(1)}px</p>
            </div>
        </div>
    `;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initTest);