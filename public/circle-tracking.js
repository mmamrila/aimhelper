let testSettings = null;
let canvas = null;
let ctx = null;
let isTestRunning = false;
let currentTest = 0;
let totalTests = 1;
let testResults = [];

const testConfigurations = [
    { dpiMultiplier: 0.8, sensMultiplier: 0.8 },
    { dpiMultiplier: 0.9, sensMultiplier: 0.9 },
    { dpiMultiplier: 1.0, sensMultiplier: 1.0 },
    { dpiMultiplier: 1.1, sensMultiplier: 1.1 },
    { dpiMultiplier: 1.2, sensMultiplier: 1.2 }
];

let target = {
    x: 400,
    y: 300,
    radius: 25,
    angle: 0,
    speed: 0.02,
    orbitRadius: 150
};

let crosshair = {
    x: 400,
    y: 300,
    size: 20
};

let testData = {
    startTime: 0,
    duration: 30000,
    samples: [],
    totalDistance: 0,
    timeOnTarget: 0,
    lastSampleTime: 0,
    // Enhanced tracking data
    overshoots: 0,
    undershoots: 0,
    corrections: 0,
    movementPath: [],
    velocityData: [],
    lastCrosshairPos: { x: 400, y: 300 },
    lastTargetPos: { x: 400, y: 300 }
};

function initTest() {
    const settings = localStorage.getItem('testSettings');
    if (!settings) {
        alert('No test settings found. Returning to home.');
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
}

function startCircleTest() {
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
    document.getElementById('testDPI').textContent = currentDPI;
    document.getElementById('testSens').textContent = currentSens;
    
    resetTestData();
    
    setTimeout(() => {
        startSingleTest(currentDPI, currentSens);
    }, 1000);
}

function resetTestData() {
    target.x = 400;
    target.y = 300;
    target.angle = 0;
    crosshair.x = 400;
    crosshair.y = 300;

    testData = {
        startTime: Date.now(),
        duration: 30000,
        samples: [],
        totalDistance: 0,
        timeOnTarget: 0,
        lastSampleTime: Date.now(),
        // Enhanced tracking data
        overshoots: 0,
        undershoots: 0,
        corrections: 0,
        movementPath: [],
        velocityData: [],
        lastCrosshairPos: { x: 400, y: 300 },
        lastTargetPos: { x: 400, y: 300 }
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
    target.angle += target.speed;
    target.x = 400 + Math.cos(target.angle) * target.orbitRadius;
    target.y = 300 + Math.sin(target.angle) * target.orbitRadius;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4444';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
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
    const sensitivity = testConfigurations[currentTest].sensMultiplier;
    
    crosshair.x = event.clientX - rect.left;
    crosshair.y = event.clientY - rect.top;
    
    crosshair.x = Math.max(0, Math.min(canvas.width, crosshair.x));
    crosshair.y = Math.max(0, Math.min(canvas.height, crosshair.y));
}

function updateTestData() {
    const now = Date.now();
    const distance = Math.sqrt(
        Math.pow(crosshair.x - target.x, 2) +
        Math.pow(crosshair.y - target.y, 2)
    );

    const isOnTarget = distance <= target.radius;

    // Calculate movement velocity
    const crosshairMovement = Math.sqrt(
        Math.pow(crosshair.x - testData.lastCrosshairPos.x, 2) +
        Math.pow(crosshair.y - testData.lastCrosshairPos.y, 2)
    );
    const timeDelta = Math.max(1, now - testData.lastSampleTime);
    const velocity = crosshairMovement / timeDelta * 1000; // pixels per second

    // Calculate target movement for prediction analysis
    const targetMovement = Math.sqrt(
        Math.pow(target.x - testData.lastTargetPos.x, 2) +
        Math.pow(target.y - testData.lastTargetPos.y, 2)
    );

    // Detect overshoots and undershoots
    if (testData.samples.length > 5) {
        analyzeOvershootUndershoot(crosshair.x, crosshair.y, target.x, target.y);
    }

    // Detect corrections (sudden direction changes)
    if (testData.velocityData.length > 3) {
        detectCorrections(velocity);
    }

    // Record movement path for efficiency analysis
    testData.movementPath.push({
        x: crosshair.x,
        y: crosshair.y,
        targetX: target.x,
        targetY: target.y,
        time: now - testData.startTime
    });

    // Record velocity data
    testData.velocityData.push({
        velocity: velocity,
        distance: distance,
        time: now - testData.startTime
    });

    testData.samples.push({
        time: now - testData.startTime,
        distance: distance,
        onTarget: isOnTarget,
        velocity: velocity,
        targetMovement: targetMovement
    });

    if (isOnTarget) {
        testData.timeOnTarget += now - testData.lastSampleTime;
    }

    testData.totalDistance += distance;

    // Update last positions
    testData.lastCrosshairPos = { x: crosshair.x, y: crosshair.y };
    testData.lastTargetPos = { x: target.x, y: target.y };
    testData.lastSampleTime = now;
}

function analyzeOvershootUndershoot(crosshairX, crosshairY, targetX, targetY) {
    const recentSamples = testData.samples.slice(-5);
    if (recentSamples.length < 5) return;

    // Check if crosshair was approaching target and then passed it
    const distances = recentSamples.map(s => s.distance);
    const wasApproaching = distances[1] > distances[2] && distances[2] > distances[3];
    const nowReceding = distances[3] < distances[4];

    if (wasApproaching && nowReceding) {
        // Determine if it was overshoot (went past) or undershoot (fell short)
        const currentDistance = Math.sqrt(Math.pow(crosshairX - targetX, 2) + Math.pow(crosshairY - targetY, 2));
        const minDistance = Math.min(...distances);

        if (currentDistance > minDistance * 1.5) {
            testData.overshoots++;
        }
    }

    // Check for undershoots (stopped short of target)
    const velocity = recentSamples[recentSamples.length - 1].velocity;
    if (velocity < 50 && distances[distances.length - 1] > target.radius * 1.2) {
        const wasMovingToward = distances[1] > distances[2];
        if (wasMovingToward) {
            testData.undershoots++;
        }
    }
}

function detectCorrections(currentVelocity) {
    const recentVelocities = testData.velocityData.slice(-4).map(v => v.velocity);

    // Detect sudden velocity changes indicating corrections
    const velocityChange = Math.abs(currentVelocity - recentVelocities[recentVelocities.length - 1]);
    const avgVelocity = recentVelocities.reduce((a, b) => a + b) / recentVelocities.length;

    if (velocityChange > avgVelocity * 2 && currentVelocity > 100) {
        testData.corrections++;
    }
}

function updateUI() {
    const elapsed = Date.now() - testData.startTime;
    const remaining = Math.max(0, Math.ceil((testData.duration - elapsed) / 1000));
    
    document.getElementById('timeDisplay').textContent = remaining;
    
    const accuracy = testData.samples.length > 0 ? 
        (testData.timeOnTarget / elapsed) * 100 : 0;
    
    document.getElementById('accuracyDisplay').textContent = Math.round(accuracy);
}

function endSingleTest(dpi, sensitivity) {
    isTestRunning = false;

    const accuracy = (testData.timeOnTarget / testData.duration) * 100;
    const avgDistance = testData.totalDistance / testData.samples.length;
    const consistencyScore = calculateConsistency();
    const reactionTime = calculateReactionTime();
    const inchesPer360 = 10080 / (dpi * sensitivity);

    // Enhanced measurements
    const pathEfficiency = calculatePathEfficiency();
    const movementSmoothness = calculateMovementSmoothness();
    const overshootRate = (testData.overshoots / testData.duration) * 1000; // per second
    const undershootRate = (testData.undershoots / testData.duration) * 1000; // per second
    const correctionRate = (testData.corrections / testData.duration) * 1000; // per second
    const predictionAccuracy = calculatePredictionAccuracy();

    const result = {
        dpi: dpi,
        sensitivity: sensitivity,
        inchesPer360: inchesPer360,
        accuracy: accuracy,
        avgDistance: avgDistance,
        consistencyScore: consistencyScore,
        reactionTime: reactionTime,
        // Enhanced metrics for sensitivity optimization
        pathEfficiency: pathEfficiency,
        movementSmoothness: movementSmoothness,
        overshootRate: overshootRate,
        undershootRate: undershootRate,
        correctionRate: correctionRate,
        predictionAccuracy: predictionAccuracy
    };

    testResults.push(result);
    saveTestResult(result);

    currentTest++;

    setTimeout(() => {
        runNextTest();
    }, 2000);
}

function calculatePathEfficiency() {
    if (testData.movementPath.length < 10) return 0;

    let totalPathLength = 0;
    let totalOptimalLength = 0;

    for (let i = 1; i < testData.movementPath.length; i++) {
        const current = testData.movementPath[i];
        const previous = testData.movementPath[i - 1];

        // Actual path length
        const actualDistance = Math.sqrt(
            Math.pow(current.x - previous.x, 2) +
            Math.pow(current.y - previous.y, 2)
        );
        totalPathLength += actualDistance;

        // Optimal path length (direct line to target)
        const optimalDistance = Math.sqrt(
            Math.pow(current.targetX - previous.x, 2) +
            Math.pow(current.targetY - previous.y, 2)
        );
        totalOptimalLength += optimalDistance;
    }

    return totalOptimalLength > 0 ? (totalOptimalLength / totalPathLength) * 100 : 0;
}

function calculateMovementSmoothness() {
    if (testData.velocityData.length < 10) return 0;

    const velocities = testData.velocityData.map(v => v.velocity);
    let smoothnessScore = 0;
    let validSamples = 0;

    // Calculate velocity changes - smoother movement has less dramatic changes
    for (let i = 2; i < velocities.length - 1; i++) {
        const velocityChange = Math.abs(velocities[i] - velocities[i - 1]);
        const velocityChange2 = Math.abs(velocities[i + 1] - velocities[i]);

        // Normalize based on average velocity
        const avgVelocity = (velocities[i - 1] + velocities[i] + velocities[i + 1]) / 3;
        if (avgVelocity > 10) {
            const normalizedChange = (velocityChange + velocityChange2) / (2 * avgVelocity);
            smoothnessScore += Math.max(0, 1 - normalizedChange);
            validSamples++;
        }
    }

    return validSamples > 0 ? (smoothnessScore / validSamples) * 100 : 0;
}

function calculatePredictionAccuracy() {
    if (testData.samples.length < 20) return 0;

    let predictionScore = 0;
    let validPredictions = 0;

    // Analyze how well the player predicts target movement
    for (let i = 5; i < testData.samples.length - 5; i++) {
        const sample = testData.samples[i];
        const futureSample = testData.samples[i + 5];

        // Where was the target going?
        const targetVelocityX = futureSample.targetX - sample.targetX;
        const targetVelocityY = futureSample.targetY - sample.targetY;

        // Where did the player move?
        const playerMovementX = testData.samples[i + 1].crosshairX - sample.crosshairX;
        const playerMovementY = testData.samples[i + 1].crosshairY - sample.crosshairY;

        if (Math.abs(targetVelocityX) > 5 || Math.abs(targetVelocityY) > 5) {
            // Calculate how aligned player movement was with target movement
            const alignment = Math.cos(Math.atan2(playerMovementY, playerMovementX) - Math.atan2(targetVelocityY, targetVelocityX));
            predictionScore += Math.max(0, alignment);
            validPredictions++;
        }
    }

    return validPredictions > 0 ? (predictionScore / validPredictions) * 100 : 50;
}

function calculateConsistency() {
    if (testData.samples.length < 10) return 0;
    
    let distances = testData.samples.map(s => s.distance);
    let avg = distances.reduce((a, b) => a + b) / distances.length;
    let variance = distances.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / distances.length;
    let stdDev = Math.sqrt(variance);
    
    return Math.max(0, 100 - (stdDev / avg) * 100);
}

function calculateReactionTime() {
    let reactionTimes = [];
    let lastTargetChange = 0;
    
    for (let i = 1; i < testData.samples.length; i++) {
        const sample = testData.samples[i];
        const prevSample = testData.samples[i-1];
        
        if (!prevSample.onTarget && sample.onTarget) {
            reactionTimes.push(sample.time - lastTargetChange);
        }
        
        if (i > 0 && Math.abs(sample.distance - prevSample.distance) > 50) {
            lastTargetChange = sample.time;
        }
    }
    
    return reactionTimes.length > 0 ? 
        reactionTimes.reduce((a, b) => a + b) / reactionTimes.length : 500;
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
                testType: 'circle-tracking',
                dpi: result.dpi,
                inGameSensitivity: result.sensitivity,
                inchesPer360: result.inchesPer360,
                accuracyPercentage: result.accuracy,
                reactionTimeMs: result.reactionTime,
                consistencyScore: result.consistencyScore,
                // Enhanced sensitivity optimization metrics
                pathEfficiency: result.pathEfficiency,
                movementSmoothness: result.movementSmoothness,
                overshootRate: result.overshootRate,
                undershootRate: result.undershootRate,
                correctionRate: result.correctionRate,
                predictionAccuracy: result.predictionAccuracy
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
    
    let bestResult = testResults.reduce((best, current) => {
        const bestScore = (best.accuracy * 0.6) + (best.consistencyScore * 0.4);
        const currentScore = (current.accuracy * 0.6) + (current.consistencyScore * 0.4);
        return currentScore > bestScore ? current : best;
    });
    
    const resultsHtml = `
        <div class="best-result">
            <h3>Best Performance</h3>
            <p><strong>DPI:</strong> ${bestResult.dpi}</p>
            <p><strong>Sensitivity:</strong> ${bestResult.sensitivity}</p>
            <p><strong>in/360°:</strong> ${bestResult.inchesPer360.toFixed(1)} in</p>
            <p><strong>Accuracy:</strong> ${bestResult.accuracy.toFixed(1)}%</p>
            <p><strong>Consistency:</strong> ${bestResult.consistencyScore.toFixed(1)}%</p>
        </div>
        
        <div class="all-results">
            <h3>All Test Results</h3>
            <table>
                <tr>
                    <th>DPI</th>
                    <th>Sens</th>
                    <th>in/360°</th>
                    <th>Accuracy</th>
                    <th>Consistency</th>
                </tr>
                ${testResults.map(r => `
                    <tr>
                        <td>${r.dpi}</td>
                        <td>${r.sensitivity}</td>
                        <td>${r.inchesPer360.toFixed(1)}</td>
                        <td>${r.accuracy.toFixed(1)}%</td>
                        <td>${r.consistencyScore.toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </table>
        </div>
    `;
    
    document.getElementById('resultsContent').innerHTML = resultsHtml;
    
    updateCompletedTests('circle-tracking');
}

function updateCompletedTests(testType) {
    let completed = JSON.parse(localStorage.getItem('completedTests') || '[]');
    if (!completed.includes(testType)) {
        completed.push(testType);
        localStorage.setItem('completedTests', JSON.stringify(completed));
    }
    
    // Update next test button after marking test as complete
    updateNextTestButton();
}

function areAllTestsCompleted() {
    const completedTests = localStorage.getItem('completedTests');
    if (completedTests) {
        const tests = JSON.parse(completedTests);
        return tests.length >= 4;
    }
    return false;
}

function updateNextTestButton() {
    const nextBtn = document.getElementById('nextTestBtn');
    if (!nextBtn) return;
    
    if (areAllTestsCompleted()) {
        nextBtn.innerHTML = '🎯 View Results & Get Recommendations';
        nextBtn.onclick = function() {
            window.location.href = '/results';
        };
    } else {
        nextBtn.innerHTML = 'Next Test: Grid Shot →';
        nextBtn.onclick = function() {
            window.location.href = '/grid-shot';
        };
    }
}

function retryTest() {
    window.location.reload();
}

function goHome() {
    window.location.href = '/';
}

window.addEventListener('load', function() {
    initTest();
    
    // Add event listeners
    document.getElementById('startBtn').addEventListener('click', startCircleTest);
    document.getElementById('homeBtn').addEventListener('click', goHome);
    document.getElementById('retryBtn').addEventListener('click', retryTest);
    document.getElementById('homeBtn2').addEventListener('click', goHome);
    
    // Initialize next test button on page load
    updateNextTestButton();
});