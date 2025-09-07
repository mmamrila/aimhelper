let currentUser = null;
let testResults = [];
let currentDPI = 800;
let currentSensitivity = 1.0;

document.getElementById('profileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    // Show loading state
    submitButton.innerHTML = '⏳ Saving Profile...';
    submitButton.disabled = true;
    
    // Simulate processing time for better UX
    setTimeout(() => {
        currentUser = document.getElementById('userId').value;
        currentDPI = parseInt(document.getElementById('currentDPI').value);
        currentSensitivity = parseFloat(document.getElementById('currentSensitivity').value);
        
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
    
    const cmPer360 = calculateCmPer360(currentDPI, currentSensitivity);
    cmElement.textContent = cmPer360.toFixed(1) + ' cm';
    
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

function calculateCmPer360(dpi, sensitivity) {
    const inchesPerRevolution = 360 / (dpi * sensitivity);
    const cmPerRevolution = inchesPerRevolution * 2.54;
    return cmPerRevolution;
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
            <p><strong>cm/360°:</strong> ${optimization.cmPer360} cm</p>
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