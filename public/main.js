let currentUser = null;
let testResults = [];
let currentDPI = 800;
let currentSensitivity = 1.0;

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
});

async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = data.user;
            updateUIForAuthenticatedUser(data.user);
            
            // Redirect returning users to dashboard
            const hasTestData = await checkUserTestData(data.user.userId);
            if (hasTestData) {
                showDashboardOption();
            }
        }
    } catch (error) {
        console.log('Not authenticated:', error);
    }
}

async function checkUserTestData(userId) {
    try {
        const response = await fetch(`/api/user-results/${userId}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const results = await response.json();
            return results.length > 0;
        }
    } catch (error) {
        console.error('Error checking user test data:', error);
    }
    return false;
}

function showDashboardOption() {
    const heroSection = document.querySelector('.hero-section');
    
    if (heroSection && !document.getElementById('dashboardPrompt')) {
        const dashboardPrompt = document.createElement('div');
        dashboardPrompt.id = 'dashboardPrompt';
        dashboardPrompt.className = 'dashboard-prompt';
        dashboardPrompt.innerHTML = `
            <div class="prompt-content">
                <h3>Welcome Back! 👋</h3>
                <p>You have previous test results. Would you like to view your dashboard or start a new analysis?</p>
                <div class="prompt-actions">
                    <button onclick="window.location.href='/dashboard'" class="primary-btn">View Dashboard</button>
                    <button onclick="this.parentElement.parentElement.parentElement.style.display='none'" class="secondary-btn">Start New Analysis</button>
                </div>
            </div>
        `;
        
        heroSection.appendChild(dashboardPrompt);
    }
}

function updateUIForAuthenticatedUser(user) {
    // Update the back button to show user info instead
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.innerHTML = `← ${user.username}`;
        backBtn.onclick = () => showUserMenu();
    }
    
    // Pre-fill form if user has a profile
    loadUserProfile();
}

function showUserMenu() {
    const menu = document.createElement('div');
    menu.style.cssText = `
        position: fixed;
        top: 60px;
        left: 20px;
        background: rgba(16, 16, 30, 0.95);
        border: 1px solid rgba(0, 210, 255, 0.2);
        border-radius: 10px;
        padding: 15px;
        z-index: 1000;
        min-width: 200px;
        backdrop-filter: blur(10px);
    `;
    
    menu.innerHTML = `
        <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div style="font-weight: 600; color: #00d2ff;">${currentUser.username}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.6);">${currentUser.email}</div>
        </div>
        <div style="margin-bottom: 8px;">
            <button onclick="window.location.href='/'" style="
                background: none; border: none; color: #ffffff; cursor: pointer;
                padding: 8px 0; width: 100%; text-align: left;
            ">🏠 Home</button>
        </div>
        <div style="margin-bottom: 8px;">
            <button onclick="handleLogout()" style="
                background: none; border: none; color: #ff6b6b; cursor: pointer;
                padding: 8px 0; width: 100%; text-align: left;
            ">Sign Out</button>
        </div>
    `;
    
    document.body.appendChild(menu);
    
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 10);
}

async function loadUserProfile() {
    try {
        const response = await fetch('/api/user-profile', {
            credentials: 'include'
        });
        if (response.ok) {
            const profile = await response.json();
            
            // Pre-fill form with saved data
            if (profile.current_dpi) {
                document.getElementById('currentDPI').value = profile.current_dpi;
                currentDPI = profile.current_dpi;
            }
            if (profile.current_sensitivity) {
                document.getElementById('currentSensitivity').value = profile.current_sensitivity;
                currentSensitivity = profile.current_sensitivity;
            }
            if (profile.preferred_game) {
                document.getElementById('preferredGame').value = profile.preferred_game;
            }
        }
    } catch (error) {
        console.log('No saved profile found');
    }
}

async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            currentUser = null;
            
            // Reset back button
            const backBtn = document.querySelector('.back-btn');
            if (backBtn) {
                backBtn.innerHTML = '← Back to Home';
                backBtn.onclick = () => window.location.href = '/';
            }
            
            // Remove menu
            document.querySelectorAll('[style*="position: fixed"]').forEach(el => {
                if (el.textContent.includes('Sign Out')) el.remove();
            });
            
            showSuccessMessage('Signed out successfully.');
        }
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(76, 175, 80, 0.1);
        border: 2px solid rgba(76, 175, 80, 0.3);
        color: #4caf50;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 3000;
        font-weight: 600;
        animation: slideInRight 0.5s ease-out;
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 4000);
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(244, 67, 54, 0.1);
        border: 2px solid rgba(244, 67, 54, 0.3);
        color: #f44336;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 3000;
        font-weight: 600;
        animation: slideInRight 0.5s ease-out;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 4000);
}

document.getElementById('profileForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    // Show loading state
    submitButton.innerHTML = '⏳ Saving Profile...';
    submitButton.disabled = true;
    
    // Get form data
    const userId = document.getElementById('userId').value;
    currentDPI = parseInt(document.getElementById('currentDPI').value);
    currentSensitivity = parseFloat(document.getElementById('currentSensitivity').value);
    const preferredGame = document.getElementById('preferredGame').value;
    
    // Save to database if user is authenticated
    if (currentUser) {
        try {
            const response = await fetch('/api/user-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    displayName: userId,
                    preferredGame: preferredGame,
                    currentDpi: currentDPI,
                    currentSensitivity: currentSensitivity
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save profile');
            }
        } catch (error) {
            console.error('Failed to save profile:', error);
            showErrorMessage('Failed to save profile to database');
        }
    }
    
    // For backward compatibility with anonymous users
    if (!currentUser) {
        currentUser = userId;
    }
    
    // Simulate processing time for better UX
    setTimeout(() => {
        
        const testsSection = document.getElementById('testsSection');
        if (testsSection) {
            testsSection.style.display = 'block';
            
            // Show success message
            showSuccessMessage('✅ Profile saved successfully! Ready to start testing.');
            
            // Smooth scroll to tests section
            testsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
            // Update current settings with animation
            updateCurrentSettings();
            
            // Store in localStorage
            localStorage.setItem('currentUser', currentUser);
            localStorage.setItem('currentDPI', currentDPI);
            localStorage.setItem('currentSensitivity', currentSensitivity);
            
            // Reset button after success
            setTimeout(() => {
                submitButton.innerHTML = '✅ Profile Saved';
                submitButton.disabled = false;
            }, 1000);
            
        } else {
            console.error('Tests section not found');
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }, 800); // Small delay for better UX
});

function updateCurrentSettings() {
    const dpiElement = document.getElementById('displayDPI');
    const sensElement = document.getElementById('displaySens');
    const cmElement = document.getElementById('displayCm');
    
    // Add animation class
    const currentSettingsDiv = document.querySelector('.current-settings');
    currentSettingsDiv.style.transform = 'scale(1.05)';
    currentSettingsDiv.style.transition = 'transform 0.3s ease';
    
    dpiElement.textContent = currentDPI;
    sensElement.textContent = currentSensitivity;
    
    const inchesPer360 = calculateInchesPer360(currentDPI, currentSensitivity);
    cmElement.textContent = inchesPer360.toFixed(1) + ' in';
    
    // Reset animation
    setTimeout(() => {
        currentSettingsDiv.style.transform = 'scale(1)';
    }, 300);
}

function showSuccessMessage(message) {
    // Remove existing success messages
    const existingMessage = document.querySelector('.success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <div class="success-content">
            ${message}
        </div>
    `;
    
    // Insert after the form
    const form = document.getElementById('profileForm');
    form.parentNode.insertBefore(successDiv, form.nextSibling);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.style.opacity = '0';
            successDiv.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                successDiv.remove();
            }, 300);
        }
    }, 4000);
}

function calculateInchesPer360(dpi, sensitivity) {
    const inchesPerRevolution = 10080 / (dpi * sensitivity);
    return inchesPerRevolution;
}

function startTest(testType) {
    if (!currentUser) {
        alert('Please set up your profile first');
        return;
    }
    
    localStorage.setItem('testSettings', JSON.stringify({
        user: currentUser,
        dpi: currentDPI,
        sensitivity: currentSensitivity,
        testType: testType
    }));
    
    window.location.href = `/${testType}`;
}

function updateTestStatus(testType, status) {
    const statusMap = {
        'circle-tracking': 'circleStatus',
        'grid-shot': 'gridStatus',
        'flick-test': 'flickStatus',
        'consistency-test': 'consistencyStatus'
    };
    
    const statusElement = document.getElementById(statusMap[testType]);
    if (statusElement) {
        statusElement.textContent = status;
        statusElement.className = 'test-status completed';
    }
    
    checkAllTestsCompleted();
}

function checkAllTestsCompleted() {
    const completedTests = localStorage.getItem('completedTests');
    if (completedTests) {
        const tests = JSON.parse(completedTests);
        if (tests.length >= 4) {
            document.getElementById('optimizeBtn').disabled = false;
        }
    }
}

// Global utility function to check if all 4 tests are completed
function areAllTestsCompleted() {
    const completedTests = localStorage.getItem('completedTests');
    if (completedTests) {
        const tests = JSON.parse(completedTests);
        return tests.length >= 4;
    }
    return false;
}

async function optimizeSensitivity() {
    if (!currentUser) {
        alert('Please set up your profile first');
        return;
    }
    
    try {
        const response = await fetch('/api/optimize-sensitivity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: currentUser })
        });
        
        const optimization = await response.json();
        
        if (response.ok) {
            showOptimizationResults(optimization);
        } else {
            alert('Error: ' + optimization.error);
        }
    } catch (error) {
        alert('Error optimizing sensitivity: ' + error.message);
    }
}

function showOptimizationResults(optimization) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'optimization-results';
    resultDiv.innerHTML = `
        <h3>Recommended Settings</h3>
        <div class="recommendation">
            <p><strong>DPI:</strong> ${optimization.dpi}</p>
            <p><strong>Sensitivity:</strong> ${optimization.sensitivity}</p>
            <p><strong>in/360°:</strong> ${optimization.inchesPer360} in</p>
            <p><strong>Confidence:</strong> ${optimization.confidence}%</p>
            <p><strong>Performance Score:</strong> ${optimization.topPerformanceScore}/100</p>
        </div>
        <button onclick="applyRecommendation(${optimization.dpi}, ${optimization.sensitivity})">
            Apply These Settings
        </button>
    `;
    
    const existingResults = document.querySelector('.optimization-results');
    if (existingResults) {
        existingResults.remove();
    }
    
    document.querySelector('.optimization-section').appendChild(resultDiv);
}

function applyRecommendation(dpi, sensitivity) {
    currentDPI = dpi;
    currentSensitivity = sensitivity;
    
    document.getElementById('currentDPI').value = dpi;
    document.getElementById('currentSensitivity').value = sensitivity;
    
    updateCurrentSettings();
    
    localStorage.setItem('currentDPI', currentDPI);
    localStorage.setItem('currentSensitivity', currentSensitivity);
    
    alert('Settings applied! You can now test with these new settings.');
}

function viewResults() {
    if (!currentUser) {
        alert('Please set up your profile first');
        return;
    }
    
    window.location.href = '/results';
}

window.addEventListener('load', function() {
    const savedUser = localStorage.getItem('currentUser');
    const savedDPI = localStorage.getItem('currentDPI');
    const savedSensitivity = localStorage.getItem('currentSensitivity');
    
    if (savedUser && savedDPI && savedSensitivity) {
        document.getElementById('userId').value = savedUser;
        document.getElementById('currentDPI').value = savedDPI;
        document.getElementById('currentSensitivity').value = savedSensitivity;
        
        currentUser = savedUser;
        currentDPI = parseInt(savedDPI);
        currentSensitivity = parseFloat(savedSensitivity);
        
        document.getElementById('testsSection').style.display = 'block';
        updateCurrentSettings();
        checkAllTestsCompleted();
    }
    
    // Add event listeners for test buttons
    document.querySelectorAll('.test-btn').forEach(button => {
        button.addEventListener('click', function() {
            const testType = this.getAttribute('data-test');
            startTest(testType);
        });
    });
    
    // Add event listener for optimize button
    document.getElementById('optimizeBtn').addEventListener('click', optimizeSensitivity);
    
    // Add event listener for view results button
    document.getElementById('viewResultsBtn').addEventListener('click', viewResults);
});