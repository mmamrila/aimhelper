let currentUser = null;
let allResults = {};

async function loadResults() {
    try {
        // First check if user is authenticated
        const authResponse = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        const authData = await authResponse.json();
        
        if (!authData.authenticated) {
            alert('Please log in to view your results.');
            window.location.href = '/login';
            return;
        }
        
        currentUser = authData.user.username;
        document.getElementById('userName').textContent = authData.user.username;
        
        // Fetch user results using session authentication
        const response = await fetch('/api/user-results', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (response.ok) {
            processResults(data.results);
            displayResults();
        } else {
            console.error('Error loading results:', data.error);
            document.getElementById('resultsContent').innerHTML = `
                <div class="error-message">
                    <p>Error loading results: ${data.error}</p>
                    <button onclick="window.location.reload()" class="btn btn--primary">Try Again</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching results:', error);
        document.getElementById('resultsContent').innerHTML = `
            <div class="error-message">
                <p>Failed to load results. Please try again.</p>
                <button onclick="window.location.reload()" class="btn btn--primary">Retry</button>
            </div>
        `;
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
                inchesPer360: result.inches_per_360,
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

async function displayOverallAnalysis() {
    const totalTests = Object.values(allResults).reduce((sum, results) => sum + results.length, 0);
    const completedTestTypes = Object.keys(allResults).filter(testType => allResults[testType].length > 0);
    
    // Show test completion status
    const testStatus = {
        'circle-tracking': allResults['circle-tracking'].length > 0,
        'grid-shot': allResults['grid-shot'].length > 0,
        'flick-test': allResults['flick-test'].length > 0,
        'consistency-test': allResults['consistency-test'].length > 0
    };
    
    const completedCount = Object.values(testStatus).filter(Boolean).length;
    
    document.getElementById('overallResults').style.display = 'block';
    
    if (totalTests === 0) {
        document.getElementById('analysisContent').innerHTML = `
            <div class="no-data-state">
                <div class="icon">🎯</div>
                <h3>Ready to Start Your Analysis?</h3>
                <p>Complete our scientific aim tests to get AI-powered sensitivity recommendations.</p>
                <div class="test-checklist">
                    <div class="checklist-item incomplete">❌ Circle Tracking Test</div>
                    <div class="checklist-item incomplete">❌ Grid Shot Test</div>
                    <div class="checklist-item incomplete">❌ Flick Test</div>
                    <div class="checklist-item incomplete">❌ Consistency Test</div>
                </div>
                <a href="/test-interface" class="btn btn--primary">Start Testing</a>
            </div>
        `;
        return;
    }
    
    // Display current progress and recommendations
    document.getElementById('analysisContent').innerHTML = `
        <div class="analysis-section">
            <div class="completion-header">
                <h3>📊 Test Completion Status (${completedCount}/4)</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(completedCount / 4) * 100}%"></div>
                </div>
            </div>
            
            <div class="test-completion-grid">
                <div class="completion-item ${testStatus['circle-tracking'] ? 'completed' : 'incomplete'}">
                    <span class="status-icon">${testStatus['circle-tracking'] ? '✅' : '❌'}</span>
                    <span class="test-name">Circle Tracking</span>
                    ${testStatus['circle-tracking'] ? 
                        `<span class="test-count">${allResults['circle-tracking'].length} completed</span>` : 
                        '<a href="/circle-tracking" class="test-link btn--sm">Take Test</a>'}
                </div>
                <div class="completion-item ${testStatus['grid-shot'] ? 'completed' : 'incomplete'}">
                    <span class="status-icon">${testStatus['grid-shot'] ? '✅' : '❌'}</span>
                    <span class="test-name">Grid Shot</span>
                    ${testStatus['grid-shot'] ? 
                        `<span class="test-count">${allResults['grid-shot'].length} completed</span>` : 
                        '<a href="/grid-shot" class="test-link btn--sm">Take Test</a>'}
                </div>
                <div class="completion-item ${testStatus['flick-test'] ? 'completed' : 'incomplete'}">
                    <span class="status-icon">${testStatus['flick-test'] ? '✅' : '❌'}</span>
                    <span class="test-name">Flick Test</span>
                    ${testStatus['flick-test'] ? 
                        `<span class="test-count">${allResults['flick-test'].length} completed</span>` : 
                        '<a href="/flick-test" class="test-link btn--sm">Take Test</a>'}
                </div>
                <div class="completion-item ${testStatus['consistency-test'] ? 'completed' : 'incomplete'}">
                    <span class="status-icon">${testStatus['consistency-test'] ? '✅' : '❌'}</span>
                    <span class="test-name">Consistency Test</span>
                    ${testStatus['consistency-test'] ? 
                        `<span class="test-count">${allResults['consistency-test'].length} completed</span>` : 
                        '<a href="/consistency-test" class="test-link btn--sm">Take Test</a>'}
                </div>
            </div>
            
            <div class="progress-section">
                ${completedCount >= 2 ? await generateAIAnalysis() : generatePartialAnalysis(completedCount, totalTests)}
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
        recommendedCm360: avgCm360,
        confidence: calculateConfidence(topResults.length, allTestResults.length)
    };
}

function calculateConfidence(topResults, totalResults) {
    const dataQuality = Math.min(totalResults / 20, 1);
    const consistencyFactor = topResults >= 3 ? 1 : topResults / 3;
    return Math.round((dataQuality * consistencyFactor * 100));
}

async function displayOptimizationResults(analysis) {
    const optimizationSection = document.getElementById('optimizationResults');
    
    if (!optimizationSection) return;
    
    optimizationSection.style.display = 'block';
    
    document.getElementById('optimalDPI').textContent = analysis.recommendedDPI;
    document.getElementById('optimalSens').textContent = analysis.recommendedSensitivity;
    document.getElementById('optimalCm').textContent = analysis.recommendedCm360.toFixed(1) + ' cm';
    document.getElementById('confidence').textContent = analysis.confidence + '%';
    
    try {
        const response = await fetch('/api/optimize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUser,
                cmPer360: analysis.recommendedCm360
            })
        });
        
        if (response.ok) {
            const optimizationData = await response.json();
            displayEquipmentRecommendations(optimizationData.mousepadRecommendation);
            displayAnalysisReasoning(optimizationData.reasoning, analysis);
        }
    } catch (error) {
        console.error('Error fetching optimization data:', error);
        displayBasicRecommendations(analysis);
    }
}

function displayEquipmentRecommendations(mousepadRec) {
    if (!mousepadRec) return;
    
    document.getElementById('mousepadSize').textContent = mousepadRec.size;
    document.getElementById('mousepadReasoning').textContent = mousepadRec.reasoning;
    
    const productsContainer = document.getElementById('mousepadProducts');
    if (mousepadRec.products && mousepadRec.products.length > 0) {
        productsContainer.innerHTML = '<h5>Recommended Products:</h5><ul>' + 
            mousepadRec.products.map(product => `<li>${product}</li>`).join('') + 
            '</ul>';
    }
}

function displayAnalysisReasoning(reasoning, analysis) {
    const reasoningContainer = document.getElementById('analysisReasoning');
    
    let reasoningText = reasoning || generateBasicReasoning(analysis);
    
    reasoningContainer.innerHTML = reasoningText;
}

function generateBasicReasoning(analysis) {
    return `
        <p>Based on your test results, we recommend <strong>${analysis.recommendedDPI} DPI</strong> 
        with <strong>${analysis.recommendedSensitivity} in-game sensitivity</strong> 
        (${analysis.recommendedCm360.toFixed(1)}cm/360°).</p>
        
        <p>This setting balances precision and speed based on your performance patterns across all tests. 
        Your strongest performance came from settings closest to this recommendation.</p>
        
        <p>Continue practicing with these settings to build muscle memory and improve consistency.</p>
    `;
}

function displayBasicRecommendations(analysis) {
    const cmPer360 = analysis.recommendedCm360;
    
    let mousepadSize = 'Large (45cm x 40cm+)';
    let reasoning = `With your ${cmPer360.toFixed(1)}cm/360° setting, you need adequate space for full rotations.`;
    
    if (cmPer360 <= 15) {
        mousepadSize = 'Extra Large (60cm x 30cm+)';
        reasoning = `Your high sensitivity (${cmPer360.toFixed(1)}cm/360°) still benefits from a large mousepad for consistency and comfort during extended play sessions.`;
    } else if (cmPer360 <= 25) {
        mousepadSize = 'Large (45cm x 40cm)';
        reasoning = `Your medium sensitivity (${cmPer360.toFixed(1)}cm/360°) works well with a large mousepad, providing good balance between space efficiency and movement freedom.`;
    } else if (cmPer360 <= 40) {
        mousepadSize = 'Extra Large (60cm x 30cm+)';
        reasoning = `Your lower sensitivity (${cmPer360.toFixed(1)}cm/360°) requires significant mouse movement. A large mousepad ensures you never run out of space during gameplay.`;
    } else {
        mousepadSize = 'Desk Pad (80cm x 40cm+)';
        reasoning = `Your very low sensitivity (${cmPer360.toFixed(1)}cm/360°) demands maximum mouse real estate. Consider a full desk pad for optimal performance.`;
    }
    
    document.getElementById('mousepadSize').textContent = mousepadSize;
    document.getElementById('mousepadReasoning').textContent = reasoning;
    
    displayAnalysisReasoning(null, analysis);
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

// Helper functions for new analysis system
async function generateAIAnalysis() {
    try {
        const response = await fetch('/api/optimize-sensitivity', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const optimization = await response.json();
            return `
                <div class="ai-analysis-result">
                    <div class="analysis-header">
                        <h3>🤖 AI Performance Analysis</h3>
                        <div class="confidence-badge">
                            <span class="confidence-label">Confidence:</span>
                            <span class="confidence-value">${optimization.confidence}%</span>
                        </div>
                    </div>
                    
                    <div class="recommended-settings">
                        <h4>🎯 Optimized Settings</h4>
                        <div class="settings-grid">
                            <div class="setting-item">
                                <span class="setting-label">DPI</span>
                                <span class="setting-value">${optimization.dpi}</span>
                            </div>
                            <div class="setting-item">
                                <span class="setting-label">Sensitivity</span>
                                <span class="setting-value">${optimization.sensitivity}</span>
                            </div>
                            <div class="setting-item">
                                <span class="setting-label">cm/360°</span>
                                <span class="setting-value">${optimization.cmPer360}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${optimization.gameProfile ? `
                        <div class="game-analysis">
                            <h4>🎮 ${optimization.gameProfile.name} Analysis</h4>
                            <p>${optimization.gameProfile.description}</p>
                            <p><strong>Optimal Range:</strong> ${optimization.gameProfile.optimalRange.min}-${optimization.gameProfile.optimalRange.max} cm/360°</p>
                        </div>
                    ` : ''}
                    
                    ${optimization.mousepadRecommendation ? `
                        <div class="equipment-recommendation">
                            <h4>🖱️ Equipment Recommendation</h4>
                            <p><strong>Mousepad Size:</strong> ${optimization.mousepadRecommendation.size}</p>
                            <p>${optimization.mousepadRecommendation.reasoning}</p>
                        </div>
                    ` : ''}
                    
                    <div class="next-steps">
                        <h4>📈 Next Steps</h4>
                        <ul>
                            <li>Apply these settings in your game</li>
                            <li>Practice for 1-2 weeks to build muscle memory</li>
                            <li>Complete more tests to refine recommendations</li>
                            <li>Track your competitive performance improvements</li>
                        </ul>
                    </div>
                </div>
            `;
        } else {
            throw new Error('Failed to get AI analysis');
        }
    } catch (error) {
        console.error('Error getting AI analysis:', error);
        return `
            <div class="ai-analysis-error">
                <h3>🤖 AI Analysis</h3>
                <p>Unable to generate AI analysis at this time. Please try again later.</p>
                <button onclick="location.reload()" class="btn btn--secondary">Retry Analysis</button>
            </div>
        `;
    }
}

function generatePartialAnalysis(completedCount, totalTests) {
    if (completedCount === 0) {
        return `
            <div class="partial-analysis">
                <div class="analysis-header">
                    <h3>🚀 Get Started with Your Analysis</h3>
                </div>
                <p>Complete at least 2 different test types to unlock AI-powered sensitivity recommendations.</p>
                <div class="benefits-list">
                    <div class="benefit-item">✨ Personalized DPI & sensitivity recommendations</div>
                    <div class="benefit-item">🎮 Game-specific optimization</div>
                    <div class="benefit-item">📊 Performance trend analysis</div>
                    <div class="benefit-item">🛠️ Equipment recommendations</div>
                </div>
                <a href="/test-interface" class="btn btn--primary">Continue Testing</a>
            </div>
        `;
    } else if (completedCount === 1) {
        return `
            <div class="partial-analysis">
                <div class="analysis-header">
                    <h3>📊 Making Progress!</h3>
                </div>
                <p>Great start! You've completed ${totalTests} test${totalTests > 1 ? 's' : ''} in ${completedCount} category.</p>
                <p><strong>Complete 1 more test type</strong> to unlock your AI-powered sensitivity analysis.</p>
                
                <div class="preview-benefits">
                    <h4>🔓 Unlock with 1 more test:</h4>
                    <ul>
                        <li>AI-optimized sensitivity recommendations</li>
                        <li>Game-specific performance insights</li>
                        <li>Equipment and mousepad suggestions</li>
                    </ul>
                </div>
                
                <a href="/test-interface" class="btn btn--primary">Complete 1 More Test</a>
            </div>
        `;
    }
    
    // This shouldn't happen since completedCount >= 2 goes to AI analysis
    return '';
}

window.addEventListener('load', function() {
    loadResults();
    
    // Add event listeners with error handling
    const homeBtn = document.getElementById('homeBtn');
    const exportBtn = document.getElementById('exportBtn');
    const clearBtn = document.getElementById('clearBtn');
    
    if (homeBtn) homeBtn.addEventListener('click', goHome);
    if (exportBtn) exportBtn.addEventListener('click', exportResults);
    if (clearBtn) clearBtn.addEventListener('click', clearAllData);
});