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

let centerTarget = {
    x: 400,
    y: 300,
    radius: 30,
    active: true
};

let flickTarget = {
    x: 0,
    y: 0,
    radius: 25,
    active: false,
    spawnTime: 0
};

let crosshair = {
    x: 400,
    y: 300,
    size: 20
};

let testData = {
    flickAttempts: [],
    totalFlicks: 0,
    successfulFlicks: 0,
    targetFlicks: 30
};

let gameState = 'waiting_for_center'; // 'waiting_for_center', 'waiting_for_flick', 'complete'

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

function startFlickTest() {
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
    testData = {
        flickAttempts: [],
        totalFlicks: 0,
        successfulFlicks: 0,
        targetFlicks: 30
    };
    
    gameState = 'waiting_for_center';
    centerTarget.active = true;
    flickTarget.active = false;
}

function startSingleTest(dpi, sensitivity) {
    isTestRunning = true;
    gameLoop();
}

function gameLoop() {
    if (!isTestRunning) return;
    
    draw();
    updateUI();
    
    if (testData.totalFlicks >= testData.targetFlicks) {
        endSingleTest();
        return;
    }
    
    requestAnimationFrame(gameLoop);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (centerTarget.active) {
        ctx.beginPath();
        ctx.arc(centerTarget.x, centerTarget.y, centerTarget.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#4caf50';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('START', centerTarget.x, centerTarget.y + 5);
    }
    
    if (flickTarget.active) {
        ctx.beginPath();
        ctx.arc(flickTarget.x, flickTarget.y, flickTarget.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4444';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    if (gameState === 'waiting_for_flick' && flickTarget.active) {
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(centerTarget.x, centerTarget.y);
        ctx.lineTo(flickTarget.x, flickTarget.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
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
    
    if (gameState === 'waiting_for_center' && centerTarget.active) {
        const distance = Math.sqrt(
            Math.pow(clickX - centerTarget.x, 2) + 
            Math.pow(clickY - centerTarget.y, 2)
        );
        
        if (distance <= centerTarget.radius) {
            centerTarget.active = false;
            spawnFlickTarget();
            gameState = 'waiting_for_flick';
        }
    } else if (gameState === 'waiting_for_flick' && flickTarget.active) {
        const distance = Math.sqrt(
            Math.pow(clickX - flickTarget.x, 2) + 
            Math.pow(clickY - flickTarget.y, 2)
        );
        
        const clickTime = Date.now();
        const reactionTime = clickTime - flickTarget.spawnTime;
        const hit = distance <= flickTarget.radius;
        
        const flickDistance = Math.sqrt(
            Math.pow(flickTarget.x - centerTarget.x, 2) + 
            Math.pow(flickTarget.y - centerTarget.y, 2)
        );
        
        testData.flickAttempts.push({
            hit: hit,
            reactionTime: reactionTime,
            flickDistance: flickDistance,
            accuracy: hit ? 100 : Math.max(0, 100 - (distance - flickTarget.radius)),
            targetX: flickTarget.x,
            targetY: flickTarget.y,
            clickX: clickX,
            clickY: clickY
        });
        
        if (hit) {
            testData.successfulFlicks++;
        }
        
        testData.totalFlicks++;
        flickTarget.active = false;
        centerTarget.active = true;
        gameState = 'waiting_for_center';
    }
}

function spawnFlickTarget() {
    const minDistance = 150;
    const maxDistance = 250;
    const angle = Math.random() * Math.PI * 2;
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    
    flickTarget.x = centerTarget.x + Math.cos(angle) * distance;
    flickTarget.y = centerTarget.y + Math.sin(angle) * distance;
    
    flickTarget.x = Math.max(flickTarget.radius, Math.min(canvas.width - flickTarget.radius, flickTarget.x));
    flickTarget.y = Math.max(flickTarget.radius, Math.min(canvas.height - flickTarget.radius, flickTarget.y));
    
    flickTarget.active = true;
    flickTarget.spawnTime = Date.now();
}

function updateUI() {
    document.getElementById('flicksDisplay').textContent = testData.totalFlicks;
    
    const accuracy = testData.totalFlicks > 0 ? 
        (testData.successfulFlicks / testData.totalFlicks) * 100 : 0;
    
    document.getElementById('accuracyDisplay').textContent = Math.round(accuracy);
    
    const hitAttempts = testData.flickAttempts.filter(a => a.hit);
    const avgTime = hitAttempts.length > 0 ? 
        hitAttempts.reduce((sum, a) => sum + a.reactionTime, 0) / hitAttempts.length : 0;
    
    document.getElementById('timeDisplay').textContent = Math.round(avgTime);
}

function endSingleTest() {
    isTestRunning = false;
    
    const config = testConfigurations[currentTest];
    const currentDPI = Math.round(testSettings.dpi * config.dpiMultiplier);
    const currentSens = Math.round(testSettings.sensitivity * config.sensMultiplier * 100) / 100;
    
    const accuracy = testData.totalFlicks > 0 ? 
        (testData.successfulFlicks / testData.totalFlicks) * 100 : 0;
    
    const hitAttempts = testData.flickAttempts.filter(a => a.hit);
    const avgReactionTime = hitAttempts.length > 0 ? 
        hitAttempts.reduce((sum, a) => sum + a.reactionTime, 0) / hitAttempts.length : 1000;
    
    const consistencyScore = calculateConsistency();
    const inchesPer360 = 10080 / (currentDPI * currentSens);
    
    const result = {
        dpi: currentDPI,
        sensitivity: currentSens,
        inchesPer360: inchesPer360,
        accuracy: accuracy,
        avgReactionTime: avgReactionTime,
        consistencyScore: consistencyScore,
        totalFlicks: testData.totalFlicks,
        successfulFlicks: testData.successfulFlicks
    };
    
    testResults.push(result);
    saveTestResult(result);
    
    currentTest++;
    
    setTimeout(() => {
        runNextTest();
    }, 2000);
}

function calculateConsistency() {
    const hitAttempts = testData.flickAttempts.filter(a => a.hit);
    
    if (hitAttempts.length < 5) return 0;
    
    const reactionTimes = hitAttempts.map(a => a.reactionTime);
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
                testType: 'flick-test',
                dpi: result.dpi,
                inGameSensitivity: result.sensitivity,
                inchesPer360: result.inchesPer360,
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
        const bestScore = (best.accuracy * 0.5) + (best.consistencyScore * 0.3) + ((1000 - best.avgReactionTime) / 10 * 0.2);
        const currentScore = (current.accuracy * 0.5) + (current.consistencyScore * 0.3) + ((1000 - current.avgReactionTime) / 10 * 0.2);
        return currentScore > bestScore ? current : best;
    });
    
    const resultsHtml = `
        <div class="best-result">
            <h3>Best Performance</h3>
            <p><strong>DPI:</strong> ${bestResult.dpi}</p>
            <p><strong>Sensitivity:</strong> ${bestResult.sensitivity}</p>
            <p><strong>in/360°:</strong> ${bestResult.inchesPer360.toFixed(1)} in</p>
            <p><strong>Accuracy:</strong> ${bestResult.accuracy.toFixed(1)}% (${bestResult.successfulFlicks}/${bestResult.totalFlicks})</p>
            <p><strong>Avg Reaction:</strong> ${bestResult.avgReactionTime.toFixed(0)}ms</p>
            <p><strong>Consistency:</strong> ${bestResult.consistencyScore.toFixed(1)}%</p>
        </div>
        
        <div class="all-results">
            <h3>All Test Results</h3>
            <table>
                <tr>
                    <th>DPI</th>
                    <th>Sens</th>
                    <th>Accuracy</th>
                    <th>Reaction</th>
                    <th>Consistency</th>
                </tr>
                ${testResults.map(r => `
                    <tr>
                        <td>${r.dpi}</td>
                        <td>${r.sensitivity}</td>
                        <td>${r.accuracy.toFixed(1)}%</td>
                        <td>${r.avgReactionTime.toFixed(0)}ms</td>
                        <td>${r.consistencyScore.toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </table>
        </div>
    `;
    
    document.getElementById('resultsContent').innerHTML = resultsHtml;
    
    updateCompletedTests('flick-test');
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
        nextBtn.innerHTML = 'Next Test: Consistency Test →';
        nextBtn.onclick = function() {
            window.location.href = '/consistency-test';
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
    document.getElementById('startBtn').addEventListener('click', startFlickTest);
    document.getElementById('homeBtn').addEventListener('click', goHome);
    document.getElementById('retryBtn').addEventListener('click', retryTest);
    document.getElementById('homeBtn2').addEventListener('click', goHome);
    
    // Initialize next test button on page load
    updateNextTestButton();
});