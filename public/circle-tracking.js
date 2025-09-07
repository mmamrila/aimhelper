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
    lastSampleTime: 0
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
        lastSampleTime: Date.now()
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
    
    testData.samples.push({
        time: now - testData.startTime,
        distance: distance,
        onTarget: isOnTarget
    });
    
    if (isOnTarget) {
        testData.timeOnTarget += now - testData.lastSampleTime;
    }
    
    testData.totalDistance += distance;
    testData.lastSampleTime = now;
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
    const cmPer360 = (360 / (dpi * sensitivity)) * 2.54;
    
    const result = {
        dpi: dpi,
        sensitivity: sensitivity,
        cmPer360: cmPer360,
        accuracy: accuracy,
        avgDistance: avgDistance,
        consistencyScore: consistencyScore,
        reactionTime: reactionTime
    };
    
    testResults.push(result);
    saveTestResult(result);
    
    currentTest++;
    
    setTimeout(() => {
        runNextTest();
    }, 2000);
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
                cmPer360: result.cmPer360,
                accuracyPercentage: result.accuracy,
                reactionTimeMs: result.reactionTime,
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
        const bestScore = (best.accuracy * 0.6) + (best.consistencyScore * 0.4);
        const currentScore = (current.accuracy * 0.6) + (current.consistencyScore * 0.4);
        return currentScore > bestScore ? current : best;
    });
    
    const resultsHtml = `
        <div class="best-result">
            <h3>Best Performance</h3>
            <p><strong>DPI:</strong> ${bestResult.dpi}</p>
            <p><strong>Sensitivity:</strong> ${bestResult.sensitivity}</p>
            <p><strong>cm/360°:</strong> ${bestResult.cmPer360.toFixed(1)} cm</p>
            <p><strong>Accuracy:</strong> ${bestResult.accuracy.toFixed(1)}%</p>
            <p><strong>Consistency:</strong> ${bestResult.consistencyScore.toFixed(1)}%</p>
        </div>
        
        <div class="all-results">
            <h3>All Test Results</h3>
            <table>
                <tr>
                    <th>DPI</th>
                    <th>Sens</th>
                    <th>cm/360°</th>
                    <th>Accuracy</th>
                    <th>Consistency</th>
                </tr>
                ${testResults.map(r => `
                    <tr>
                        <td>${r.dpi}</td>
                        <td>${r.sensitivity}</td>
                        <td>${r.cmPer360.toFixed(1)}</td>
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