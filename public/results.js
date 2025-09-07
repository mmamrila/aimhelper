let currentUser = null;
let allResults = {};

async function loadResults() {
    currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) {
        alert('No user profile found. Please return to home and set up your profile.');
        window.location.href = '/';
        return;
    }
    
    try {
        const response = await fetch(`/api/user-results/${currentUser}`);
        const results = await response.json();
        
        if (response.ok) {
            processResults(results);
            displayResults();
        } else {
            console.error('Error loading results:', results.error);
        }
    } catch (error) {
        console.error('Error fetching results:', error);
    }
}

function processResults(results) {
    allResults = {
        'circle-tracking': [],
        'grid-shot': [],
        'flick-test': [],
        'consistency-test': []
    };
    
    results.forEach(result => {
        if (allResults[result.test_type]) {
            allResults[result.test_type].push({
                dpi: result.dpi,
                sensitivity: result.in_game_sensitivity,
                cmPer360: result.cm_per_360,
                accuracy: result.accuracy_percentage,
                reactionTime: result.reaction_time_ms,
                consistency: result.consistency_score,
                timestamp: new Date(result.timestamp)
            });
        }
    });
    
    Object.keys(allResults).forEach(testType => {
        allResults[testType].sort((a, b) => b.timestamp - a.timestamp);
    });
}

function displayResults() {
    displayCircleResults();
    displayGridResults();
    displayFlickResults();
    displayConsistencyResults();
    displayOverallAnalysis();
}

function displayCircleResults() {
    const results = allResults['circle-tracking'];
    const container = document.getElementById('circleResults');
    
    if (results.length === 0) {
        container.innerHTML = '<p>No circle tracking data available</p>';
        return;
    }
    
    const bestResult = results.reduce((best, current) => {
        const bestScore = (best.accuracy * 0.6) + (best.consistency * 0.4);
        const currentScore = (current.accuracy * 0.6) + (current.consistency * 0.4);
        return currentScore > bestScore ? current : best;
    });
    
    container.innerHTML = `
        <div class="best-result">
            <h4>Best Performance</h4>
            <p><strong>DPI:</strong> ${bestResult.dpi}</p>
            <p><strong>Sensitivity:</strong> ${bestResult.sensitivity}</p>
            <p><strong>Accuracy:</strong> ${bestResult.accuracy.toFixed(1)}%</p>
            <p><strong>Consistency:</strong> ${bestResult.consistency.toFixed(1)}%</p>
        </div>
        <p><strong>Total Tests:</strong> ${results.length}</p>
        <p><strong>Latest Test:</strong> ${results[0].timestamp.toLocaleDateString()}</p>
    `;
}

function displayGridResults() {
    const results = allResults['grid-shot'];
    const container = document.getElementById('gridResults');
    
    if (results.length === 0) {
        container.innerHTML = '<p>No grid shot data available</p>';
        return;
    }
    
    const bestResult = results.reduce((best, current) => {
        const bestScore = (best.accuracy * 0.4) + ((1000 - best.reactionTime) / 10 * 0.6);
        const currentScore = (current.accuracy * 0.4) + ((1000 - current.reactionTime) / 10 * 0.6);
        return currentScore > bestScore ? current : best;
    });
    
    container.innerHTML = `
        <div class="best-result">
            <h4>Best Performance</h4>
            <p><strong>DPI:</strong> ${bestResult.dpi}</p>
            <p><strong>Sensitivity:</strong> ${bestResult.sensitivity}</p>
            <p><strong>Accuracy:</strong> ${bestResult.accuracy.toFixed(1)}%</p>
            <p><strong>Reaction Time:</strong> ${bestResult.reactionTime.toFixed(0)}ms</p>
        </div>
        <p><strong>Total Tests:</strong> ${results.length}</p>
        <p><strong>Latest Test:</strong> ${results[0].timestamp.toLocaleDateString()}</p>
    `;
}

function displayFlickResults() {
    const results = allResults['flick-test'];
    const container = document.getElementById('flickResults');
    
    if (results.length === 0) {
        container.innerHTML = '<p>No flick test data available</p>';
        return;
    }
    
    const bestResult = results.reduce((best, current) => {
        const bestScore = (best.accuracy * 0.5) + (best.consistency * 0.3) + ((1000 - best.reactionTime) / 10 * 0.2);
        const currentScore = (current.accuracy * 0.5) + (current.consistency * 0.3) + ((1000 - current.reactionTime) / 10 * 0.2);
        return currentScore > bestScore ? current : best;
    });
    
    container.innerHTML = `
        <div class="best-result">
            <h4>Best Performance</h4>
            <p><strong>DPI:</strong> ${bestResult.dpi}</p>
            <p><strong>Sensitivity:</strong> ${bestResult.sensitivity}</p>
            <p><strong>Accuracy:</strong> ${bestResult.accuracy.toFixed(1)}%</p>
            <p><strong>Reaction Time:</strong> ${bestResult.reactionTime.toFixed(0)}ms</p>
        </div>
        <p><strong>Total Tests:</strong> ${results.length}</p>
        <p><strong>Latest Test:</strong> ${results[0].timestamp.toLocaleDateString()}</p>
    `;
}

function displayConsistencyResults() {
    const results = allResults['consistency-test'];
    const container = document.getElementById('consistencyResults');
    
    if (results.length === 0) {
        container.innerHTML = '<p>No consistency test data available</p>';
        return;
    }
    
    const bestResult = results.reduce((best, current) => {
        return current.consistency > best.consistency ? current : best;
    });
    
    container.innerHTML = `
        <div class="best-result">
            <h4>Best Performance</h4>
            <p><strong>DPI:</strong> ${bestResult.dpi}</p>
            <p><strong>Sensitivity:</strong> ${bestResult.sensitivity}</p>
            <p><strong>Consistency:</strong> ${bestResult.consistency.toFixed(1)}%</p>
            <p><strong>Accuracy:</strong> ${bestResult.accuracy.toFixed(1)}%</p>
        </div>
        <p><strong>Total Tests:</strong> ${results.length}</p>
        <p><strong>Latest Test:</strong> ${results[0].timestamp.toLocaleDateString()}</p>
    `;
}

function displayOverallAnalysis() {
    const hasData = Object.values(allResults).some(results => results.length > 0);
    
    if (!hasData) {
        return;
    }
    
    document.getElementById('overallResults').style.display = 'block';
    
    const analysis = generateAnalysis();
    
    document.getElementById('analysisContent').innerHTML = `
        <div class="recommendation">
            <h3>Performance Summary</h3>
            ${analysis.summary}
            
            <h3>Recommended Settings</h3>
            <p><strong>DPI:</strong> ${analysis.recommendedDPI}</p>
            <p><strong>Sensitivity:</strong> ${analysis.recommendedSensitivity}</p>
            <p><strong>cm/360°:</strong> ${analysis.recommendedCm360.toFixed(1)} cm</p>
            
            <h3>Areas for Improvement</h3>
            ${analysis.improvements}
            
            <h3>Test Completion</h3>
            <div class="test-completion">
                <p>Circle Tracking: ${allResults['circle-tracking'].length > 0 ? '✅' : '❌'}</p>
                <p>Grid Shot: ${allResults['grid-shot'].length > 0 ? '✅' : '❌'}</p>
                <p>Flick Test: ${allResults['flick-test'].length > 0 ? '✅' : '❌'}</p>
                <p>Consistency Test: ${allResults['consistency-test'].length > 0 ? '✅' : '❌'}</p>
            </div>
        </div>
    `;
}

function generateAnalysis() {
    let allTestResults = [];
    let summary = '';
    let improvements = '';
    
    Object.keys(allResults).forEach(testType => {
        allTestResults = allTestResults.concat(allResults[testType]);
    });
    
    if (allTestResults.length === 0) {
        return {
            summary: '<p>No test data available for analysis.</p>',
            improvements: '<p>Complete some tests to get personalized recommendations.</p>',
            recommendedDPI: 800,
            recommendedSensitivity: 1.0,
            recommendedCm360: 36
        };
    }
    
    const weightedResults = allTestResults.map(result => {
        const combinedScore = (result.accuracy * 0.4) + 
                             ((1000 - Math.min(result.reactionTime, 1000)) / 1000 * 100 * 0.3) + 
                             (result.consistency * 0.3);
        
        return { ...result, combinedScore };
    });
    
    weightedResults.sort((a, b) => b.combinedScore - a.combinedScore);
    
    const topResults = weightedResults.slice(0, Math.min(5, weightedResults.length));
    const avgDPI = topResults.reduce((sum, r) => sum + r.dpi, 0) / topResults.length;
    const avgSens = topResults.reduce((sum, r) => sum + r.sensitivity, 0) / topResults.length;
    const avgCm360 = topResults.reduce((sum, r) => sum + r.cmPer360, 0) / topResults.length;
    
    const avgAccuracy = allTestResults.reduce((sum, r) => sum + r.accuracy, 0) / allTestResults.length;
    const avgReactionTime = allTestResults.reduce((sum, r) => sum + r.reactionTime, 0) / allTestResults.length;
    const avgConsistency = allTestResults.reduce((sum, r) => sum + r.consistency, 0) / allTestResults.length;
    
    summary = `
        <p><strong>Overall Performance:</strong></p>
        <p>Average Accuracy: ${avgAccuracy.toFixed(1)}%</p>
        <p>Average Reaction Time: ${avgReactionTime.toFixed(0)}ms</p>
        <p>Average Consistency: ${avgConsistency.toFixed(1)}%</p>
        <p>Total Tests Completed: ${allTestResults.length}</p>
    `;
    
    improvements = '<ul>';
    
    if (avgAccuracy < 70) {
        improvements += '<li>Focus on accuracy training - consider lowering sensitivity for better precision</li>';
    }
    
    if (avgReactionTime > 400) {
        improvements += '<li>Work on reaction time - try higher sensitivity for quicker target acquisition</li>';
    }
    
    if (avgConsistency < 60) {
        improvements += '<li>Practice muscle memory - stick to one sensitivity setting for longer periods</li>';
    }
    
    if (allResults['circle-tracking'].length === 0) {
        improvements += '<li>Complete circle tracking test to improve smooth tracking skills</li>';
    }
    
    if (allResults['consistency-test'].length === 0) {
        improvements += '<li>Complete consistency test to evaluate muscle memory</li>';
    }
    
    improvements += '</ul>';
    
    return {
        summary: summary,
        improvements: improvements,
        recommendedDPI: Math.round(avgDPI),
        recommendedSensitivity: Math.round(avgSens * 100) / 100,
        recommendedCm360: avgCm360
    };
}

function exportResults() {
    const exportData = {
        user: currentUser,
        exportDate: new Date().toISOString(),
        results: allResults,
        analysis: generateAnalysis()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `fps-sensitivity-results-${currentUser}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function clearAllData() {
    if (confirm('Are you sure you want to clear all test data? This cannot be undone.')) {
        localStorage.clear();
        window.location.href = '/';
    }
}

function goHome() {
    window.location.href = '/';
}

window.addEventListener('load', function() {
    loadResults();
    
    // Add event listeners
    document.getElementById('homeBtn').addEventListener('click', goHome);
    document.getElementById('exportBtn').addEventListener('click', exportResults);
    document.getElementById('clearBtn').addEventListener('click', clearAllData);
});