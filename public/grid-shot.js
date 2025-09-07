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
    totalTargets: 0
};

const TARGET_SIZE = 40;
const GRID_SIZE = 6;
const SPAWN_INTERVAL = 800;

function initTest() {
    const settings = localStorage.getItem('testSettings');
    if (!settings) {
        alert('No test settings found. Returning to home.');
        window.location.href = '/app';
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
        totalTargets: 0
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
    crosshair.x = event.clientX - rect.left;
    crosshair.y = event.clientY - rect.top;
    
    // Keep crosshair within canvas bounds
    crosshair.x = Math.max(0, Math.min(canvas.width, crosshair.x));
    crosshair.y = Math.max(0, Math.min(canvas.height, crosshair.y));
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
            testData.clicks.push({
                x: clickX,
                y: clickY,
                time: clickTime - testData.startTime,
                hit: true,
                reactionTime: reactionTime,
                targetX: target.x,
                targetY: target.y,
                distance: distance
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
    const cmPer360 = (360 / (dpi * sensitivity)) * 2.54;
    
    const result = {
        dpi: dpi,
        sensitivity: sensitivity,
        cmPer360: cmPer360,
        accuracy: accuracy,
        avgReactionTime: avgReactionTime,
        consistencyScore: consistencyScore,
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
                cmPer360: result.cmPer360,
                accuracyPercentage: result.accuracy,
                reactionTimeMs: result.avgReactionTime,
                consistencyScore: result.consistencyScore
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
            <p><strong>cm/360°:</strong> ${bestResult.cmPer360.toFixed(1)} cm</p>
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

function retryTest() {
    window.location.reload();
}

function goHome() {
    window.location.href = '/app';
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