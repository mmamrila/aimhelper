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

let targets = [
    { x: 400, y: 300, radius: 25, type: 'center' },
    { x: 200, y: 200, radius: 20, type: 'corner' },
    { x: 600, y: 200, radius: 20, type: 'corner' },
    { x: 600, y: 400, radius: 20, type: 'corner' },
    { x: 200, y: 400, radius: 20, type: 'corner' }
];

let testData = {
    rounds: [],
    currentRound: 0,
    currentTarget: 0,
    totalRounds: 10,
    targetSequence: [0, 1, 2, 3, 4, 0], // center -> corners -> center
    roundStartTime: 0,
    paths: []
};

let mouseTrail = [];

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
    canvas.addEventListener('mousemove', trackMouse);
    canvas.addEventListener('mouseenter', () => {
        canvas.style.cursor = 'none';
    });
    canvas.addEventListener('mouseleave', () => {
        canvas.style.cursor = 'default';
    });
}

function startConsistencyTest() {
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
        rounds: [],
        currentRound: 0,
        currentTarget: 0,
        totalRounds: 10,
        targetSequence: [0, 1, 2, 3, 4, 0],
        roundStartTime: Date.now(),
        paths: []
    };
    
    mouseTrail = [];
}

function startSingleTest(dpi, sensitivity) {
    isTestRunning = true;
    testData.roundStartTime = Date.now();
    gameLoop();
}

function gameLoop() {
    if (!isTestRunning) return;
    
    draw();
    updateUI();
    
    requestAnimationFrame(gameLoop);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    targets.forEach((target, index) => {
        const isActive = index === testData.targetSequence[testData.currentTarget];
        const isNext = index === testData.targetSequence[testData.currentTarget + 1];
        
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        
        if (isActive) {
            ctx.fillStyle = '#4caf50';
        } else if (isNext) {
            ctx.fillStyle = '#ffeb3b';
        } else {
            ctx.fillStyle = '#666';
        }
        
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isActive ? 3 : 1;
        ctx.stroke();
        
        if (isActive) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('CLICK', target.x, target.y + 3);
        }
    });
    
    if (mouseTrail.length > 1) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        
        for (let i = 1; i < mouseTrail.length; i++) {
            if (i === 1) {
                ctx.moveTo(mouseTrail[0].x, mouseTrail[0].y);
            }
            ctx.lineTo(mouseTrail[i].x, mouseTrail[i].y);
        }
        
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
    
    if (testData.currentRound > 0) {
        drawPreviousPaths();
    }
}

function drawPreviousPaths() {
    // Only show the last 2 rounds to reduce clutter
    const recentRounds = testData.rounds.slice(-2);
    
    recentRounds.forEach((round, roundIndex) => {
        const actualRoundIndex = testData.rounds.length - recentRounds.length + roundIndex;
        const alpha = roundIndex === recentRounds.length - 1 ? 0.15 : 0.08; // Most recent is slightly more visible
        
        ctx.globalAlpha = alpha;
        
        round.movements.forEach((movement) => {
            if (movement.path.length > 1) {
                ctx.strokeStyle = '#888888'; // Simple gray instead of rainbow colors
                ctx.lineWidth = 1;
                ctx.beginPath();
                
                for (let i = 1; i < movement.path.length; i++) {
                    if (i === 1) {
                        ctx.moveTo(movement.path[0].x, movement.path[0].y);
                    }
                    ctx.lineTo(movement.path[i].x, movement.path[i].y);
                }
                
                ctx.stroke();
            }
        });
    });
    
    ctx.globalAlpha = 1;
}

function trackMouse(event) {
    if (!isTestRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    mouseTrail.push({
        x: mouseX,
        y: mouseY,
        time: Date.now()
    });
    
    if (mouseTrail.length > 50) {
        mouseTrail.shift();
    }
}

function handleClick(event) {
    if (!isTestRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    const targetIndex = testData.targetSequence[testData.currentTarget];
    const target = targets[targetIndex];
    
    const distance = Math.sqrt(
        Math.pow(clickX - target.x, 2) + 
        Math.pow(clickY - target.y, 2)
    );
    
    if (distance <= target.radius) {
        const clickTime = Date.now();
        
        if (!testData.rounds[testData.currentRound]) {
            testData.rounds[testData.currentRound] = {
                movements: [],
                startTime: testData.roundStartTime,
                endTime: 0
            };
        }
        
        testData.rounds[testData.currentRound].movements.push({
            targetIndex: targetIndex,
            clickTime: clickTime,
            path: [...mouseTrail],
            accuracy: Math.max(0, 100 - distance),
            movementTime: clickTime - (testData.rounds[testData.currentRound].movements.length > 0 ? 
                testData.rounds[testData.currentRound].movements[testData.rounds[testData.currentRound].movements.length - 1].clickTime : 
                testData.roundStartTime)
        });
        
        testData.currentTarget++;
        mouseTrail = [];
        
        if (testData.currentTarget >= testData.targetSequence.length) {
            testData.rounds[testData.currentRound].endTime = clickTime;
            testData.currentRound++;
            testData.currentTarget = 0;
            testData.roundStartTime = clickTime;
            
            if (testData.currentRound >= testData.totalRounds) {
                endSingleTest();
                return;
            }
        }
    }
}

function updateUI() {
    document.getElementById('roundDisplay').textContent = testData.currentRound + 1;
    document.getElementById('totalRounds').textContent = testData.totalRounds;
    document.getElementById('targetDisplay').textContent = testData.currentTarget + 1;
    document.getElementById('targetCount').textContent = testData.targetSequence.length;
    
    const consistencyScore = calculateCurrentConsistency();
    document.getElementById('consistencyDisplay').textContent = Math.round(consistencyScore);
}

function calculateCurrentConsistency() {
    if (testData.rounds.length < 2) return 100;
    
    let totalVariance = 0;
    let movementCount = 0;
    
    for (let moveIndex = 0; moveIndex < testData.targetSequence.length - 1; moveIndex++) {
        const movementTimes = [];
        
        testData.rounds.forEach(round => {
            if (round.movements[moveIndex]) {
                movementTimes.push(round.movements[moveIndex].movementTime);
            }
        });
        
        if (movementTimes.length > 1) {
            const avg = movementTimes.reduce((a, b) => a + b) / movementTimes.length;
            const variance = movementTimes.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / movementTimes.length;
            totalVariance += variance;
            movementCount++;
        }
    }
    
    if (movementCount === 0) return 100;
    
    const avgVariance = totalVariance / movementCount;
    const consistencyScore = Math.max(0, 100 - Math.sqrt(avgVariance) / 10);
    
    return consistencyScore;
}

function endSingleTest() {
    isTestRunning = false;
    
    const config = testConfigurations[currentTest];
    const currentDPI = Math.round(testSettings.dpi * config.dpiMultiplier);
    const currentSens = Math.round(testSettings.sensitivity * config.sensMultiplier * 100) / 100;
    
    const consistencyScore = calculateFinalConsistency();
    const avgMovementTime = calculateAverageMovementTime();
    const accuracyScore = calculateAverageAccuracy();
    const inchesPer360 = 10080 / (currentDPI * currentSens);
    
    const result = {
        dpi: currentDPI,
        sensitivity: currentSens,
        inchesPer360: inchesPer360,
        consistencyScore: consistencyScore,
        avgMovementTime: avgMovementTime,
        accuracyScore: accuracyScore,
        totalRounds: testData.rounds.length
    };
    
    testResults.push(result);
    saveTestResult(result);
    
    currentTest++;
    
    setTimeout(() => {
        runNextTest();
    }, 2000);
}

function calculateFinalConsistency() {
    let totalVariance = 0;
    let movementCount = 0;
    
    for (let moveIndex = 0; moveIndex < testData.targetSequence.length - 1; moveIndex++) {
        const movementTimes = [];
        const pathLengths = [];
        
        testData.rounds.forEach(round => {
            if (round.movements[moveIndex]) {
                movementTimes.push(round.movements[moveIndex].movementTime);
                
                let pathLength = 0;
                const path = round.movements[moveIndex].path;
                for (let i = 1; i < path.length; i++) {
                    pathLength += Math.sqrt(
                        Math.pow(path[i].x - path[i-1].x, 2) + 
                        Math.pow(path[i].y - path[i-1].y, 2)
                    );
                }
                pathLengths.push(pathLength);
            }
        });
        
        if (movementTimes.length > 1) {
            const timeAvg = movementTimes.reduce((a, b) => a + b) / movementTimes.length;
            const timeVariance = movementTimes.reduce((sum, time) => sum + Math.pow(time - timeAvg, 2), 0) / movementTimes.length;
            
            const pathAvg = pathLengths.reduce((a, b) => a + b) / pathLengths.length;
            const pathVariance = pathLengths.reduce((sum, length) => sum + Math.pow(length - pathAvg, 2), 0) / pathLengths.length;
            
            totalVariance += (timeVariance / (timeAvg * timeAvg)) + (pathVariance / (pathAvg * pathAvg));
            movementCount++;
        }
    }
    
    if (movementCount === 0) return 0;
    
    const avgNormalizedVariance = totalVariance / movementCount;
    return Math.max(0, 100 - avgNormalizedVariance * 100);
}

function calculateAverageMovementTime() {
    let totalTime = 0;
    let count = 0;
    
    testData.rounds.forEach(round => {
        round.movements.forEach(movement => {
            totalTime += movement.movementTime;
            count++;
        });
    });
    
    return count > 0 ? totalTime / count : 0;
}

function calculateAverageAccuracy() {
    let totalAccuracy = 0;
    let count = 0;
    
    testData.rounds.forEach(round => {
        round.movements.forEach(movement => {
            totalAccuracy += movement.accuracy;
            count++;
        });
    });
    
    return count > 0 ? totalAccuracy / count : 0;
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
                testType: 'consistency-test',
                dpi: result.dpi,
                inGameSensitivity: result.sensitivity,
                inchesPer360: result.inchesPer360,
                accuracyPercentage: result.accuracyScore,
                reactionTimeMs: result.avgMovementTime,
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
        return current.consistencyScore > best.consistencyScore ? current : best;
    });
    
    const resultsHtml = `
        <div class="best-result">
            <h3>Best Consistency Performance</h3>
            <p><strong>DPI:</strong> ${bestResult.dpi}</p>
            <p><strong>Sensitivity:</strong> ${bestResult.sensitivity}</p>
            <p><strong>in/360°:</strong> ${bestResult.inchesPer360.toFixed(1)} in</p>
            <p><strong>Consistency Score:</strong> ${bestResult.consistencyScore.toFixed(1)}%</p>
            <p><strong>Avg Movement Time:</strong> ${bestResult.avgMovementTime.toFixed(0)}ms</p>
            <p><strong>Accuracy:</strong> ${bestResult.accuracyScore.toFixed(1)}%</p>
        </div>
        
        <div class="all-results">
            <h3>All Test Results</h3>
            <table>
                <tr>
                    <th>DPI</th>
                    <th>Sens</th>
                    <th>Consistency</th>
                    <th>Movement Time</th>
                    <th>Accuracy</th>
                </tr>
                ${testResults.map(r => `
                    <tr>
                        <td>${r.dpi}</td>
                        <td>${r.sensitivity}</td>
                        <td>${r.consistencyScore.toFixed(1)}%</td>
                        <td>${r.avgMovementTime.toFixed(0)}ms</td>
                        <td>${r.accuracyScore.toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </table>
        </div>
    `;
    
    document.getElementById('resultsContent').innerHTML = resultsHtml;
    
    updateCompletedTests('consistency-test');
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
    
    // Consistency test is always the last test, so always show recommendations
    nextBtn.innerHTML = '🎯 View Results & Get Recommendations';
    nextBtn.onclick = function() {
        window.location.href = '/results';
    };
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
    document.getElementById('startBtn').addEventListener('click', startConsistencyTest);
    document.getElementById('homeBtn').addEventListener('click', goHome);
    document.getElementById('retryBtn').addEventListener('click', retryTest);
    document.getElementById('homeBtn2').addEventListener('click', goHome);
    
    // Initialize next test button on page load
    updateNextTestButton();
});