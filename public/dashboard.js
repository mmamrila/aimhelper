let currentUser = null;
let userResults = [];
let chartContext = null;

async function initDashboard() {
    currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) {
        window.location.href = '/';
        return;
    }

    await checkAuthStatus();
    await loadUserData();
    initChart();
    loadRecommendations();
}

async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!data.authenticated) {
            localStorage.removeItem('currentUser');
            window.location.href = '/';
            return;
        }
        
        document.getElementById('username').textContent = data.user.username;
    } catch (error) {
        console.error('Error checking auth status:', error);
        window.location.href = '/';
    }
}

async function loadUserData() {
    try {
        const response = await fetch('/api/user-results', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (response.ok) {
            userResults = data.results || [];
            updateDashboard();
        } else {
            console.error('Error loading user data:', data.error);
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

function updateDashboard() {
    updateOverviewStats();
    updateCurrentSettings();
    updateProgressChart();
    updateTestHistory();
    updateImprovementIndicator();
}

function updateOverviewStats() {
    const totalTests = userResults.length;
    
    if (totalTests === 0) {
        document.getElementById('totalTests').textContent = '0';
        document.getElementById('avgAccuracy').textContent = '0%';
        document.getElementById('avgReaction').textContent = '0ms';
        document.getElementById('consistency').textContent = '0%';
        return;
    }
    
    const avgAccuracy = userResults.reduce((sum, r) => sum + r.accuracy_percentage, 0) / totalTests;
    const avgReaction = userResults.reduce((sum, r) => sum + r.reaction_time_ms, 0) / totalTests;
    const avgConsistency = userResults.reduce((sum, r) => sum + r.consistency_score, 0) / totalTests;
    
    document.getElementById('totalTests').textContent = totalTests;
    document.getElementById('avgAccuracy').textContent = Math.round(avgAccuracy) + '%';
    document.getElementById('avgReaction').textContent = Math.round(avgReaction) + 'ms';
    document.getElementById('consistency').textContent = Math.round(avgConsistency) + '%';
}

function updateCurrentSettings() {
    if (userResults.length === 0) {
        document.getElementById('currentDPI').textContent = '-';
        document.getElementById('currentSens').textContent = '-';
        document.getElementById('currentCm360').textContent = '-';
        return;
    }
    
    const latestResult = userResults[userResults.length - 1];
    document.getElementById('currentDPI').textContent = latestResult.dpi;
    document.getElementById('currentSens').textContent = latestResult.in_game_sensitivity;
    document.getElementById('currentCm360').textContent = latestResult.cm_per_360.toFixed(1) + ' cm';
}

function updateTestHistory() {
    const historyContainer = document.getElementById('testHistory');
    
    if (userResults.length === 0) {
        historyContainer.innerHTML = '<p>No recent test data available</p>';
        return;
    }
    
    const recentTests = userResults
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    
    const historyHtml = recentTests.map(result => `
        <div class="history-item">
            <div class="history-test-type">${formatTestType(result.test_type)}</div>
            <div class="history-stats">
                <span class="history-accuracy">${result.accuracy_percentage.toFixed(1)}%</span>
                <span class="history-reaction">${result.reaction_time_ms.toFixed(0)}ms</span>
            </div>
            <div class="history-date">${new Date(result.timestamp).toLocaleDateString()}</div>
        </div>
    `).join('');
    
    historyContainer.innerHTML = historyHtml;
}

function formatTestType(testType) {
    const types = {
        'circle-tracking': 'Circle Tracking',
        'grid-shot': 'Grid Shot',
        'flick-test': 'Flick Test',
        'consistency-test': 'Consistency Test'
    };
    return types[testType] || testType;
}

function initChart() {
    const canvas = document.getElementById('performanceChart');
    chartContext = canvas.getContext('2d');
}

function updateProgressChart() {
    if (!chartContext || userResults.length === 0) return;
    
    const canvas = chartContext.canvas;
    chartContext.clearRect(0, 0, canvas.width, canvas.height);
    
    const recentResults = userResults
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .slice(-10);
    
    if (recentResults.length < 2) return;
    
    const accuracyData = recentResults.map(r => r.accuracy_percentage);
    const maxAccuracy = Math.max(...accuracyData);
    const minAccuracy = Math.min(...accuracyData);
    const range = Math.max(maxAccuracy - minAccuracy, 10);
    
    const padding = 20;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    chartContext.strokeStyle = '#4facfe';
    chartContext.lineWidth = 3;
    chartContext.lineCap = 'round';
    chartContext.lineJoin = 'round';
    
    chartContext.beginPath();
    
    accuracyData.forEach((accuracy, index) => {
        const x = padding + (index / (accuracyData.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((accuracy - minAccuracy) / range) * chartHeight;
        
        if (index === 0) {
            chartContext.moveTo(x, y);
        } else {
            chartContext.lineTo(x, y);
        }
        
        chartContext.fillStyle = '#4facfe';
        chartContext.beginPath();
        chartContext.arc(x, y, 4, 0, Math.PI * 2);
        chartContext.fill();
    });
    
    chartContext.stroke();
}

function updateImprovementIndicator() {
    const indicator = document.getElementById('improvementValue');
    
    if (userResults.length < 2) {
        indicator.textContent = 'N/A';
        return;
    }
    
    const recentResults = userResults
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    const lastSession = recentResults.slice(-5);
    const previousSession = recentResults.slice(-10, -5);
    
    if (previousSession.length === 0) {
        indicator.textContent = 'N/A';
        return;
    }
    
    const lastAvg = lastSession.reduce((sum, r) => sum + r.accuracy_percentage, 0) / lastSession.length;
    const prevAvg = previousSession.reduce((sum, r) => sum + r.accuracy_percentage, 0) / previousSession.length;
    
    const improvement = lastAvg - prevAvg;
    const improvementPercent = Math.round(improvement * 10) / 10;
    
    indicator.textContent = (improvement >= 0 ? '+' : '') + improvementPercent + '%';
    indicator.className = 'improvement-value ' + (improvement >= 0 ? 'positive' : 'negative');
}

async function loadRecommendations() {
    if (userResults.length === 0) return;
    
    try {
        const response = await fetch('/api/optimize-sensitivity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            const recommendations = await response.json();
            displayRecommendations(recommendations);
        }
    } catch (error) {
        console.error('Error loading recommendations:', error);
    }
}

function displayRecommendations(recommendations) {
    const panel = document.getElementById('recommendationsPanel');
    const content = document.getElementById('recommendationsContent');
    
    if (!recommendations || !recommendations.mousepadRecommendation) return;
    
    const mousepad = recommendations.mousepadRecommendation;
    
    content.innerHTML = `
        <div class="recommendation-item">
            <h3>🖱️ Mousepad Recommendation</h3>
            <p><strong>${mousepad.size}</strong></p>
            <p class="recommendation-reasoning">${mousepad.reasoning}</p>
            ${mousepad.products ? `
                <div class="product-recommendations">
                    <h4>Suggested Products:</h4>
                    <ul>
                        ${mousepad.products.map(product => `<li>${product}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
        
        <div class="recommendation-item">
            <h3>🎯 Next Steps</h3>
            <ul>
                <li>Practice with your current settings for consistency</li>
                <li>Run more tests to improve recommendation accuracy</li>
                <li>Consider the equipment recommendations above</li>
            </ul>
        </div>
    `;
    
    panel.style.display = 'block';
}

function startNewTest() {
    window.location.href = '/app';
}

function viewResults() {
    window.location.href = '/results';
}

function updateSettings() {
    window.location.href = '/app';
}

async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            localStorage.removeItem('currentUser');
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error during logout:', error);
    }
}

// Add profile management functions
async function loadUserProfile() {
    try {
        const response = await fetch('/api/user-profile', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const profile = await response.json();
            if (profile.preferred_game) {
                updateGameSpecificInfo(profile.preferred_game);
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function updateGameSpecificInfo(game) {
    // Could add game-specific tips or UI elements here
    console.log('User preferred game:', game);
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('[id$="Section"]').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.style.display = 'block';
    }
}

window.addEventListener('load', function() {
    initDashboard();
    loadUserProfile();
    
    // Add event listeners if elements exist
    const newTestBtn = document.getElementById('newTestBtn');
    if (newTestBtn) newTestBtn.addEventListener('click', startNewTest);
    
    const viewResultsBtn = document.getElementById('viewResultsBtn');
    if (viewResultsBtn) viewResultsBtn.addEventListener('click', viewResults);
    
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.addEventListener('click', updateSettings);
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
});