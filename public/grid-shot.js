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

let targets = [];
let crosshair = {
    x: 400,
    y: 300,
    size: 20
};
let testData = {
    startTime: 0,
    duration: 60000,
    clicks: [],
    hits: 0,
    misses: 0,
    totalTargets: 0,
    // Enhanced tracking data
    overshoots: 0,
    undershoots: 0,
    corrections: 0,
    movementPath: [],
    velocityData: [],
    lastCrosshairPos: { x: 400, y: 300 },
    lastMoveTime: 0,
    targetAcquisitionTimes: [],
    clickPrecision: []
};

const TARGET_SIZE = 40;
const GRID_SIZE = 6;
const SPAWN_INTERVAL = 800;

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
    
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseenter', () => {
        canvas.style.cursor = 'none';
    });
    canvas.addEventListener('mouseleave', () => {
        canvas.style.cursor = 'default';
    });
}

function startGridTest() {
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
    targets = [];
    testData = {
        startTime: Date.now(),
        duration: 60000,
        clicks: [],
        hits: 0,
        misses: 0,
        totalTargets: 0,
        // Enhanced tracking data
        overshoots: 0,
        undershoots: 0,
        corrections: 0,
        movementPath: [],
        velocityData: [],
        lastCrosshairPos: { x: 400, y: 300 },
        lastMoveTime: Date.now(),
        targetAcquisitionTimes: [],
        clickPrecision: []
    };
}

function startSingleTest(dpi, sensitivity) {
    isTestRunning = true;
    testData.startTime = Date.now();
    
    spawnTarget();
    gameLoop();
    
    setTimeout(() => {
        endSingleTest(dpi, sensitivity);
    }, testData.duration);
}

function gameLoop() {
    if (!isTestRunning) return;
    
    updateTargets();
    draw();
    updateUI();
    
    requestAnimationFrame(gameLoop);
}

function spawnTarget() {
    if (!isTestRunning) return;
    
    const gridSpacing = Math.min(canvas.width, canvas.height) / GRID_SIZE;
    const offsetX = (canvas.width - (GRID_SIZE - 1) * gridSpacing) / 2;
    const offsetY = (canvas.height - (GRID_SIZE - 1) * gridSpacing) / 2;
    
    let attempts = 0;
    let newTarget;
    
    do {
        const gridX = Math.floor(Math.random() * GRID_SIZE);
        const gridY = Math.floor(Math.random() * GRID_SIZE);
        
        newTarget = {
            x: offsetX + gridX * gridSpacing,
            y: offsetY + gridY * gridSpacing,
            radius: TARGET_SIZE / 2,
            spawnTime: Date.now(),
            lifetime: 2000 + Math.random() * 1000
        };
        
        attempts++;
    } while (targets.some(t => 
        Math.sqrt(Math.pow(t.x - newTarget.x, 2) + Math.pow(t.y - newTarget.y, 2)) < TARGET_SIZE * 1.5
    ) && attempts < 20);
    
    if (attempts < 20) {
        targets.push(newTarget);
        testData.totalTargets++;
    }
    
    setTimeout(spawnTarget, SPAWN_INTERVAL + Math.random() * 400);
}

function findTargetAcquisitionStart(target, clickTime) {
    // Find when the player started moving toward this target
    const targetRadius = 50; // Detection radius around target
    let acquisitionStart = 0;

    for (let i = testData.movementPath.length - 1; i >= 0; i--) {
        const pos = testData.movementPath[i];
        const distanceToTarget = Math.sqrt(
            Math.pow(pos.x - target.x, 2) +
            Math.pow(pos.y - target.y, 2)
        );

        if (distanceToTarget > targetRadius * 2) {
            acquisitionStart = testData.startTime + pos.time;
            break;
        }
    }

    return acquisitionStart;
}

function updateTargets() {
    const now = Date.now();
    targets = targets.filter(target => {
        if (now - target.spawnTime > target.lifetime) {
            testData.misses++;
            return false;
        }
        return true;
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    targets.forEach(target => {
        const age = Date.now() - target.spawnTime;
        const alpha = Math.max(0.3, 1 - (age / target.lifetime));
        
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4444';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
    });
    
    // Draw crosshair
    if (isTestRunning) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(crosshair.x - crosshair.size/2, crosshair.y);
        ctx.lineTo(crosshair.x + crosshair.size/2, crosshair.y);
        ctx.moveTo(crosshair.x, crosshair.y - crosshair.size/2);
        ctx.lineTo(crosshair.x, crosshair.y + crosshair.size/2);
        ctx.stroke();
    }
}

function handleMouseMove(event) {
    if (!isTestRunning) return;

    const rect = canvas.getBoundingClientRect();
    const newX = event.clientX - rect.left;
    const newY = event.clientY - rect.top;

    // Keep crosshair within canvas bounds
    crosshair.x = Math.max(0, Math.min(canvas.width, newX));
    crosshair.y = Math.max(0, Math.min(canvas.height, newY));

    // Enhanced movement tracking
    trackMovementData(crosshair.x, crosshair.y);
}

function trackMovementData(newX, newY) {
    const now = Date.now();
    const timeDelta = Math.max(1, now - testData.lastMoveTime);

    // Calculate movement velocity
    const movement = Math.sqrt(
        Math.pow(newX - testData.lastCrosshairPos.x, 2) +
        Math.pow(newY - testData.lastCrosshairPos.y, 2)
    );
    const velocity = movement / timeDelta * 1000; // pixels per second

    // Record movement path
    testData.movementPath.push({
        x: newX,
        y: newY,
        time: now - testData.startTime,
        targets: [...targets] // snapshot of current targets
    });

    // Record velocity data
    testData.velocityData.push({
        velocity: velocity,
        time: now - testData.startTime,
        movement: movement
    });

    // Detect corrections (sudden direction changes)
    if (testData.velocityData.length > 3) {
        const recentVelocities = testData.velocityData.slice(-4).map(v => v.velocity);
        const velocityChange = Math.abs(velocity - recentVelocities[recentVelocities.length - 2]);
        const avgVelocity = recentVelocities.reduce((a, b) => a + b) / recentVelocities.length;

        if (velocityChange > avgVelocity * 1.5 && velocity > 100) {
            testData.corrections++;
        }
    }

    // Detect overshoots and undershoots when moving toward targets
    if (targets.length > 0) {
        analyzeTargetApproach(newX, newY);
    }

    testData.lastCrosshairPos = { x: newX, y: newY };
    testData.lastMoveTime = now;
}

function analyzeTargetApproach(crosshairX, crosshairY) {
    const closestTarget = targets.reduce((closest, target) => {
        const distance = Math.sqrt(
            Math.pow(crosshairX - target.x, 2) +
            Math.pow(crosshairY - target.y, 2)
        );
        return distance < closest.distance ? { target, distance } : closest;
    }, { distance: Infinity });

    if (closestTarget.distance === Infinity) return;

    const recentMovements = testData.movementPath.slice(-5);
    if (recentMovements.length < 5) return;

    // Calculate if we were approaching the target and then moved away (overshoot)
    const distances = recentMovements.map(pos =>
        Math.sqrt(Math.pow(pos.x - closestTarget.target.x, 2) + Math.pow(pos.y - closestTarget.target.y, 2))
    );

    const wasApproaching = distances[1] > distances[2] && distances[2] > distances[3];
    const nowReceding = distances[3] < distances[4];

    if (wasApproaching && nowReceding) {
        const minDistance = Math.min(...distances);
        if (distances[distances.length - 1] > minDistance * 1.3) {
            testData.overshoots++;
        }
    }

    // Detect undershoots (stopping short when moving slowly)
    const currentVelocity = testData.velocityData[testData.velocityData.length - 1]?.velocity || 0;
    if (currentVelocity < 50 && closestTarget.distance > closestTarget.target.radius * 1.5) {
        const wasMovingToward = distances.length > 1 && distances[distances.length - 2] > distances[distances.length - 1];
        if (wasMovingToward) {
            testData.undershoots++;
        }
    }
}

function handleClick(event) {
    if (!isTestRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    const clickTime = Date.now();
    
    let hit = false;
    let hitTargetIndex = -1;
    
    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        const distance = Math.sqrt(
            Math.pow(clickX - target.x, 2) + 
            Math.pow(clickY - target.y, 2)
        );
        
        if (distance <= target.radius) {
            hit = true;
            hitTargetIndex = i;
            testData.hits++;

            const reactionTime = clickTime - target.spawnTime;

            // Record click precision (how close to center)
            const precisionScore = Math.max(0, (target.radius - distance) / target.radius * 100);
            testData.clickPrecision.push(precisionScore);

            // Record target acquisition time
            const acquisitionStartTime = findTargetAcquisitionStart(target, clickTime);
            if (acquisitionStartTime > 0) {
                testData.targetAcquisitionTimes.push(clickTime - acquisitionStartTime);
            }

            testData.clicks.push({
                x: clickX,
                y: clickY,
                time: clickTime - testData.startTime,
                hit: true,
                reactionTime: reactionTime,
                targetX: target.x,
                targetY: target.y,
                distance: distance,
                precisionScore: precisionScore
            });

            targets.splice(i, 1);
            break;
        }
    }
    
    if (!hit) {
        testData.misses++;
        testData.clicks.push({
            x: clickX,
            y: clickY,
            time: clickTime - testData.startTime,
            hit: false,
            reactionTime: null,
            distance: null
        });
    }
}

function updateUI() {
    const elapsed = Date.now() - testData.startTime;
    const remaining = Math.max(0, Math.ceil((testData.duration - elapsed) / 1000));
    
    document.getElementById('timeDisplay').textContent = remaining;
    document.getElementById('scoreDisplay').textContent = testData.hits;
    
    const accuracy = testData.totalTargets > 0 ? 
        (testData.hits / testData.totalTargets) * 100 : 0;
    
    document.getElementById('accuracyDisplay').textContent = Math.round(accuracy);
}

function endSingleTest(dpi, sensitivity) {
    isTestRunning = false;
    targets = [];

    const accuracy = testData.totalTargets > 0 ?
        (testData.hits / testData.totalTargets) * 100 : 0;

    const hitClicks = testData.clicks.filter(c => c.hit);
    const avgReactionTime = hitClicks.length > 0 ?
        hitClicks.reduce((sum, c) => sum + c.reactionTime, 0) / hitClicks.length : 1000;

    const consistencyScore = calculateConsistency();
    const inchesPer360 = 10080 / (dpi * sensitivity);

    // Enhanced measurements
    const avgClickPrecision = testData.clickPrecision.length > 0 ?
        testData.clickPrecision.reduce((a, b) => a + b) / testData.clickPrecision.length : 0;

    const avgTargetAcquisitionTime = testData.targetAcquisitionTimes.length > 0 ?
        testData.targetAcquisitionTimes.reduce((a, b) => a + b) / testData.targetAcquisitionTimes.length : 0;

    const movementSmoothness = calculateMovementSmoothness();
    const overshootRate = (testData.overshoots / testData.duration) * 1000;
    const undershootRate = (testData.undershoots / testData.duration) * 1000;
    const correctionRate = (testData.corrections / testData.duration) * 1000;
    const flickAccuracy = calculateFlickAccuracy();

    const result = {
        dpi: dpi,
        sensitivity: sensitivity,
        inchesPer360: inchesPer360,
        accuracy: accuracy,
        avgReactionTime: avgReactionTime,
        consistencyScore: consistencyScore,
        // Enhanced metrics for sensitivity optimization
        avgClickPrecision: avgClickPrecision,
        avgTargetAcquisitionTime: avgTargetAcquisitionTime,
        movementSmoothness: movementSmoothness,
        overshootRate: overshootRate,
        undershootRate: undershootRate,
        correctionRate: correctionRate,
        flickAccuracy: flickAccuracy,
        score: testData.hits,
        totalTargets: testData.totalTargets
    };
    
    testResults.push(result);
    saveTestResult(result);
    
    currentTest++;
    
    setTimeout(() => {
        runNextTest();
    }, 2000);
}

function calculateConsistency() {
    const hitClicks = testData.clicks.filter(c => c.hit);
    
    if (hitClicks.length < 5) return 0;
    
    const reactionTimes = hitClicks.map(c => c.reactionTime);
    const avg = reactionTimes.reduce((a, b) => a + b) / reactionTimes.length;
    const variance = reactionTimes.reduce((sum, rt) => sum + Math.pow(rt - avg, 2), 0) / reactionTimes.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.max(0, 100 - (stdDev / avg) * 100);
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

function calculateFlickAccuracy() {
    if (testData.clicks.length < 5) return 0;

    let flickAccuracySum = 0;
    let validFlicks = 0;

    // Analyze accuracy of quick flick movements
    for (let i = 1; i < testData.clicks.length; i++) {
        const currentClick = testData.clicks[i];
        const previousClick = testData.clicks[i - 1];

        const timeBetween = currentClick.time - previousClick.time;
        const distance = Math.sqrt(
            Math.pow(currentClick.x - previousClick.x, 2) +
            Math.pow(currentClick.y - previousClick.y, 2)
        );

        // Consider it a flick if it was fast movement over distance
        if (timeBetween < 1000 && distance > 100) {
            if (currentClick.hit) {
                flickAccuracySum += currentClick.precisionScore || 50;
            }
            validFlicks++;
        }
    }

    return validFlicks > 0 ? flickAccuracySum / validFlicks : 0;
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
                testType: 'grid-shot',
                dpi: result.dpi,
                inGameSensitivity: result.sensitivity,
                inchesPer360: result.inchesPer360,
                accuracyPercentage: result.accuracy,
                reactionTimeMs: result.avgReactionTime,
                consistencyScore: result.consistencyScore,
                // Enhanced sensitivity optimization metrics
                avgClickPrecision: result.avgClickPrecision,
                avgTargetAcquisitionTime: result.avgTargetAcquisitionTime,
                movementSmoothness: result.movementSmoothness,
                overshootRate: result.overshootRate,
                undershootRate: result.undershootRate,
                correctionRate: result.correctionRate,
                flickAccuracy: result.flickAccuracy,
                score: result.score
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
        const bestScore = (best.accuracy * 0.4) + (best.score * 0.3) + (best.consistencyScore * 0.3);
        const currentScore = (current.accuracy * 0.4) + (current.score * 0.3) + (current.consistencyScore * 0.3);
        return currentScore > bestScore ? current : best;
    });
    
    const resultsHtml = `
        <div class="best-result">
            <h3>Best Performance</h3>
            <p><strong>DPI:</strong> ${bestResult.dpi}</p>
            <p><strong>Sensitivity:</strong> ${bestResult.sensitivity}</p>
            <p><strong>in/360°:</strong> ${bestResult.inchesPer360.toFixed(1)} in</p>
            <p><strong>Accuracy:</strong> ${bestResult.accuracy.toFixed(1)}%</p>
            <p><strong>Score:</strong> ${bestResult.score}/${bestResult.totalTargets}</p>
            <p><strong>Avg Reaction:</strong> ${bestResult.avgReactionTime.toFixed(0)}ms</p>
        </div>
        
        <div class="all-results">
            <h3>All Test Results</h3>
            <table>
                <tr>
                    <th>DPI</th>
                    <th>Sens</th>
                    <th>Score</th>
                    <th>Accuracy</th>
                    <th>Reaction</th>
                </tr>
                ${testResults.map(r => `
                    <tr>
                        <td>${r.dpi}</td>
                        <td>${r.sensitivity}</td>
                        <td>${r.score}/${r.totalTargets}</td>
                        <td>${r.accuracy.toFixed(1)}%</td>
                        <td>${r.avgReactionTime.toFixed(0)}ms</td>
                    </tr>
                `).join('')}
            </table>
        </div>
    `;
    
    document.getElementById('resultsContent').innerHTML = resultsHtml;
    
    updateCompletedTests('grid-shot');
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
        nextBtn.innerHTML = 'Next Test: Flick Test →';
        nextBtn.onclick = function() {
            window.location.href = '/flick-test';
        };
    }
}

function goHome() {
    window.location.href = '/';
}

function retryTest() {
    // Reset test state
    isTestRunning = false;
    currentTest = 0;
    testResults = [];
    targets = [];

    // Reset UI
    document.getElementById('results').style.display = 'none';
    document.getElementById('instructions').style.display = 'block';
    document.getElementById('testArea').style.display = 'none';

    // Reset test data
    testData = {
        startTime: 0,
        duration: 60000,
        clicks: [],
        hits: 0,
        misses: 0,
        totalTargets: 0,
        overshoots: 0,
        undershoots: 0,
        corrections: 0,
        movementPath: [],
        velocityData: [],
        lastCrosshairPos: { x: 400, y: 300 },
        lastMoveTime: 0,
        targetAcquisitionTimes: [],
        clickPrecision: []
    };

    // Clear canvas
    if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

window.addEventListener('load', function() {
    initTest();
    
    // Add event listeners
    document.getElementById('startBtn').addEventListener('click', startGridTest);
    document.getElementById('homeBtn').addEventListener('click', goHome);
    document.getElementById('retryBtn').addEventListener('click', retryTest);
    document.getElementById('homeBtn2').addEventListener('click', goHome);
    
    // Initialize next test button on page load
    updateNextTestButton();
});