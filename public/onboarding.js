/**
 * AimHelper Pro - Onboarding & Tutorial System
 * Comprehensive user onboarding with guided tutorials and progressive disclosure
 */

class OnboardingManager {
    constructor() {
        this.currentStep = 0;
        this.currentTutorial = null;
        this.onboardingData = null;
        this.tutorialData = new Map();
        this.userProgress = this.loadUserProgress();
        this.hasCompletedOnboarding = this.userProgress.completedOnboarding || false;
        this.completedTutorials = this.userProgress.completedTutorials || new Set();

        this.init();
    }

    init() {
        this.setupOnboardingData();
        this.setupTutorialData();
        this.createOnboardingUI();
        this.checkOnboardingStatus();
        this.bindEvents();
    }

    setupOnboardingData() {
        this.onboardingData = {
            steps: [
                {
                    id: 'welcome',
                    title: '🎯 Welcome to AimHelper Pro',
                    content: `
                        <div class="onboarding-hero">
                            <div class="hero-icon">⚡</div>
                            <h2>Welcome to AimHelper Pro</h2>
                            <p>The ultimate platform for FPS aim training and improvement.</p>
                        </div>
                        <div class="feature-highlights">
                            <div class="feature-item">
                                <div class="feature-icon">🎯</div>
                                <div>
                                    <h4>Advanced Training Modes</h4>
                                    <p>Grid Shot, Flick Shot, Target Tracking, and Target Switching</p>
                                </div>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">🔄</div>
                                <div>
                                    <h4>Multi-Game Converter</h4>
                                    <p>Convert sensitivity between 50+ popular FPS games</p>
                                </div>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">📊</div>
                                <div>
                                    <h4>Comprehensive Analytics</h4>
                                    <p>Track progress with detailed performance metrics</p>
                                </div>
                            </div>
                        </div>
                    `,
                    actions: [{
                        text: 'Get Started',
                        action: 'next',
                        primary: true
                    }, {
                        text: 'Skip Tutorial',
                        action: 'skip',
                        secondary: true
                    }]
                },
                {
                    id: 'profile-setup',
                    title: '👤 Set Up Your Profile',
                    content: `
                        <div class="profile-setup">
                            <h3>Tell us about your gaming setup</h3>
                            <p>This information helps us personalize your training experience.</p>

                            <div class="setup-form">
                                <div class="form-row">
                                    <label for="onboarding-main-game">Primary Game</label>
                                    <select id="onboarding-main-game" class="onboarding-select">
                                        <option value="">Select your main game</option>
                                        <option value="valorant">Valorant</option>
                                        <option value="cs2">CS2 / CS:GO</option>
                                        <option value="apex">Apex Legends</option>
                                        <option value="overwatch">Overwatch 2</option>
                                        <option value="fortnite">Fortnite</option>
                                        <option value="rainbow6">Rainbow Six Siege</option>
                                        <option value="cod">Call of Duty</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div class="form-row">
                                    <label for="onboarding-experience">Aim Training Experience</label>
                                    <select id="onboarding-experience" class="onboarding-select">
                                        <option value="">Select your level</option>
                                        <option value="beginner">Beginner - New to aim training</option>
                                        <option value="intermediate">Intermediate - Some experience</option>
                                        <option value="advanced">Advanced - Regular aim trainer user</option>
                                        <option value="expert">Expert - Competitive player/coach</option>
                                    </select>
                                </div>

                                <div class="form-row">
                                    <label for="onboarding-goals">Primary Goals</label>
                                    <div class="checkbox-group">
                                        <label class="checkbox-item">
                                            <input type="checkbox" value="accuracy"> Improve accuracy
                                        </label>
                                        <label class="checkbox-item">
                                            <input type="checkbox" value="speed"> Increase reaction speed
                                        </label>
                                        <label class="checkbox-item">
                                            <input type="checkbox" value="consistency"> Better consistency
                                        </label>
                                        <label class="checkbox-item">
                                            <input type="checkbox" value="tracking"> Target tracking
                                        </label>
                                        <label class="checkbox-item">
                                            <input type="checkbox" value="flicking"> Flick shots
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `,
                    actions: [{
                        text: 'Continue',
                        action: 'next',
                        primary: true,
                        validate: true
                    }, {
                        text: 'Back',
                        action: 'previous',
                        secondary: true
                    }]
                },
                {
                    id: 'sensitivity-setup',
                    title: '🖱️ Configure Your Sensitivity',
                    content: `
                        <div class="sensitivity-setup">
                            <h3>Set up your mouse sensitivity</h3>
                            <p>We'll use this to provide accurate cross-game conversions.</p>

                            <div class="setup-form">
                                <div class="form-row">
                                    <label for="onboarding-dpi">Mouse DPI</label>
                                    <input type="number" id="onboarding-dpi" class="onboarding-input"
                                           placeholder="800" min="100" max="10000" value="800">
                                    <small>Common values: 400, 800, 1600, 3200</small>
                                </div>

                                <div class="form-row">
                                    <label for="onboarding-sensitivity">In-Game Sensitivity</label>
                                    <input type="number" id="onboarding-sensitivity" class="onboarding-input"
                                           placeholder="1.0" step="0.001" min="0.001" max="50" value="1.0">
                                    <small>Your sensitivity in your primary game</small>
                                </div>

                                <div class="form-row">
                                    <label for="onboarding-windows-sens">Windows Sensitivity</label>
                                    <select id="onboarding-windows-sens" class="onboarding-select">
                                        <option value="6" selected>6/11 (Recommended)</option>
                                        <option value="1">1/11</option>
                                        <option value="2">2/11</option>
                                        <option value="3">3/11</option>
                                        <option value="4">4/11</option>
                                        <option value="5">5/11</option>
                                        <option value="7">7/11</option>
                                        <option value="8">8/11</option>
                                        <option value="9">9/11</option>
                                        <option value="10">10/11</option>
                                        <option value="11">11/11</option>
                                    </select>
                                </div>
                            </div>

                            <div class="sensitivity-preview">
                                <h4>Your Settings Summary</h4>
                                <div id="sensitivity-summary">
                                    <div>Effective DPI: <span id="edpi-preview">800</span></div>
                                    <div>360° Distance: <span id="distance-preview">11.8"</span></div>
                                </div>
                            </div>
                        </div>
                    `,
                    actions: [{
                        text: 'Continue',
                        action: 'next',
                        primary: true
                    }, {
                        text: 'Back',
                        action: 'previous',
                        secondary: true
                    }]
                },
                {
                    id: 'training-intro',
                    title: '🏃‍♂️ Training Overview',
                    content: `
                        <div class="training-intro">
                            <h3>Your Training Arsenal</h3>
                            <p>AimHelper Pro offers four specialized training modes to improve different aiming skills.</p>

                            <div class="training-modes">
                                <div class="training-mode">
                                    <div class="mode-icon">🎯</div>
                                    <h4>Grid Shot</h4>
                                    <p>Classic precision training with static targets. Perfect for building fundamental accuracy.</p>
                                    <div class="mode-skills">
                                        <span class="skill-tag">Precision</span>
                                        <span class="skill-tag">Reaction Time</span>
                                    </div>
                                </div>

                                <div class="training-mode">
                                    <div class="mode-icon">⚡</div>
                                    <h4>Flick Shot</h4>
                                    <p>Large movement training to improve quick target acquisition across distance.</p>
                                    <div class="mode-skills">
                                        <span class="skill-tag">Flick Accuracy</span>
                                        <span class="skill-tag">Mouse Control</span>
                                    </div>
                                </div>

                                <div class="training-mode">
                                    <div class="mode-icon">🔄</div>
                                    <h4>Target Tracking</h4>
                                    <p>Follow moving targets to develop smooth mouse movement and prediction skills.</p>
                                    <div class="mode-skills">
                                        <span class="skill-tag">Tracking</span>
                                        <span class="skill-tag">Smoothness</span>
                                    </div>
                                </div>

                                <div class="training-mode">
                                    <div class="mode-icon">🎪</div>
                                    <h4>Target Switching</h4>
                                    <p>Rapidly switch between multiple targets to improve target recognition and acquisition.</p>
                                    <div class="mode-skills">
                                        <span class="skill-tag">Target Recognition</span>
                                        <span class="skill-tag">Switching Speed</span>
                                    </div>
                                </div>
                            </div>

                            <div class="recommendation">
                                <h4>💡 Recommendation</h4>
                                <p>Start with Grid Shot to establish baseline accuracy, then progress to specialized modes based on your goals.</p>
                            </div>
                        </div>
                    `,
                    actions: [{
                        text: 'Try Training Now',
                        action: 'start-training',
                        primary: true
                    }, {
                        text: 'Continue Tour',
                        action: 'next',
                        secondary: true
                    }]
                },
                {
                    id: 'features-tour',
                    title: '🛠️ Essential Features',
                    content: `
                        <div class="features-tour">
                            <h3>Explore Key Features</h3>
                            <p>Let's highlight the most important tools to accelerate your improvement.</p>

                            <div class="feature-tours">
                                <div class="feature-tour" data-tour="sensitivity-converter">
                                    <div class="tour-icon">🔄</div>
                                    <div class="tour-content">
                                        <h4>Sensitivity Converter</h4>
                                        <p>Convert your sensitivity between 50+ games with professional accuracy.</p>
                                        <button class="tour-btn">Take Tour</button>
                                    </div>
                                </div>

                                <div class="feature-tour" data-tour="analytics">
                                    <div class="tour-icon">📊</div>
                                    <div class="tour-content">
                                        <h4>Performance Analytics</h4>
                                        <p>Track your progress with detailed metrics and performance insights.</p>
                                        <button class="tour-btn">Take Tour</button>
                                    </div>
                                </div>

                                <div class="feature-tour" data-tour="help-system">
                                    <div class="tour-icon">❓</div>
                                    <div class="tour-content">
                                        <h4>Help & Shortcuts</h4>
                                        <p>Access comprehensive help and keyboard shortcuts anytime.</p>
                                        <button class="tour-btn">Take Tour</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `,
                    actions: [{
                        text: 'Finish Setup',
                        action: 'complete',
                        primary: true
                    }, {
                        text: 'Back',
                        action: 'previous',
                        secondary: true
                    }]
                }
            ]
        };
    }

    setupTutorialData() {
        // Sensitivity converter tutorial
        this.tutorialData.set('sensitivity-converter', {
            title: '🔄 Sensitivity Converter Tutorial',
            description: 'Learn how to use the professional sensitivity converter',
            steps: [
                {
                    target: '#fromGame',
                    title: 'Select Source Game',
                    content: 'Choose the game you\'re converting FROM. This should be your current game where you know your sensitivity.',
                    position: 'bottom'
                },
                {
                    target: '#toGame',
                    title: 'Choose Target Game',
                    content: 'Select the game you want to convert TO. This is where you want to use the converted sensitivity.',
                    position: 'bottom'
                },
                {
                    target: '#inputSensitivity',
                    title: 'Enter Your Sensitivity',
                    content: 'Input your current in-game sensitivity value. Be precise for accurate conversion.',
                    position: 'top'
                },
                {
                    target: '#inputDPI',
                    title: 'Set Your Mouse DPI',
                    content: 'Enter your mouse DPI setting. Check your mouse software if you\'re unsure.',
                    position: 'top'
                },
                {
                    target: '#convertedSensitivity',
                    title: 'Your Converted Sensitivity',
                    content: 'This is your converted sensitivity! Copy this value and use it in your target game.',
                    position: 'top'
                },
                {
                    target: '#copyResult',
                    title: 'Copy & Save',
                    content: 'Use this button to copy the result to your clipboard, or save it to your profile.',
                    position: 'top'
                }
            ]
        });

        // Training tutorial
        this.tutorialData.set('training', {
            title: '🎯 Training Tutorial',
            description: 'Master the aim training interface',
            steps: [
                {
                    target: '#testMode',
                    title: 'Choose Training Mode',
                    content: 'Select from Grid Shot, Flick Shot, Target Tracking, or Target Switching based on what you want to improve.',
                    position: 'bottom'
                },
                {
                    target: '#testDuration',
                    title: 'Set Duration',
                    content: 'Choose how long you want to train. Start with shorter sessions and build up.',
                    position: 'bottom'
                },
                {
                    target: '.difficulty-selector',
                    title: 'Select Difficulty',
                    content: 'Pick a difficulty that challenges you but isn\'t frustrating. You can always adjust later.',
                    position: 'top'
                },
                {
                    target: '#targetSize',
                    title: 'Target Size',
                    content: 'Smaller targets are harder but improve precision. Start medium and progress down.',
                    position: 'top'
                },
                {
                    target: '#startTest',
                    title: 'Start Training',
                    content: 'Click here to begin your training session. Remember: accuracy first, speed second!',
                    position: 'top'
                }
            ]
        });

        // Help system tutorial
        this.tutorialData.set('help-system', {
            title: '❓ Help System Tutorial',
            description: 'Get help whenever you need it',
            steps: [
                {
                    target: 'body',
                    title: 'Press F1 Anytime',
                    content: 'Press F1 from anywhere to open the comprehensive help system with searchable documentation.',
                    position: 'center'
                },
                {
                    target: 'body',
                    title: 'Keyboard Shortcuts',
                    content: 'Press Shift+? to see all available keyboard shortcuts. These will speed up your workflow significantly.',
                    position: 'center'
                },
                {
                    target: '#accessibilityToggle',
                    title: 'Accessibility Features',
                    content: 'Click here or press Ctrl+Shift+A to access accessibility options including high contrast and large text.',
                    position: 'bottom'
                }
            ]
        });

        // Analytics tutorial
        this.tutorialData.set('analytics', {
            title: '📊 Analytics Tutorial',
            description: 'Understand your performance data',
            steps: [
                {
                    target: '#liveMetrics',
                    title: 'Live Performance',
                    content: 'Monitor your real-time accuracy, kills per second, reaction time, and streak during training.',
                    position: 'top'
                },
                {
                    target: '#radarChart',
                    title: 'Performance Radar',
                    content: 'This radar chart shows your balanced performance across different skill areas.',
                    position: 'left'
                },
                {
                    target: '#recentScores',
                    title: 'Score History',
                    content: 'Track your improvement over time by comparing with previous sessions and global rankings.',
                    position: 'left'
                },
                {
                    target: '#saveResults',
                    title: 'Save Progress',
                    content: 'Always save your results to track long-term progress and identify improvement trends.',
                    position: 'top'
                }
            ]
        });
    }

    createOnboardingUI() {
        // Create onboarding overlay
        const overlay = document.createElement('div');
        overlay.id = 'onboarding-overlay';
        overlay.className = 'onboarding-overlay';
        overlay.innerHTML = `
            <div class="onboarding-container">
                <div class="onboarding-content">
                    <div class="onboarding-header">
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <div class="step-indicator">
                            <span class="current-step">1</span> / <span class="total-steps">5</span>
                        </div>
                    </div>

                    <div class="onboarding-body">
                        <!-- Dynamic content -->
                    </div>

                    <div class="onboarding-footer">
                        <div class="onboarding-actions">
                            <!-- Dynamic actions -->
                        </div>
                        <div class="onboarding-skip">
                            <button class="skip-onboarding">Skip for now</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.onboardingOverlay = overlay;

        // Create tutorial overlay
        const tutorialOverlay = document.createElement('div');
        tutorialOverlay.id = 'tutorial-overlay';
        tutorialOverlay.className = 'tutorial-overlay';
        tutorialOverlay.innerHTML = `
            <div class="tutorial-spotlight"></div>
            <div class="tutorial-tooltip">
                <div class="tooltip-content">
                    <h3 class="tooltip-title"></h3>
                    <div class="tooltip-body"></div>
                    <div class="tooltip-actions">
                        <button class="tutorial-prev" disabled>Previous</button>
                        <div class="tutorial-progress">
                            <span class="tutorial-current">1</span> / <span class="tutorial-total">6</span>
                        </div>
                        <button class="tutorial-next">Next</button>
                        <button class="tutorial-close">Skip</button>
                    </div>
                </div>
                <div class="tooltip-arrow"></div>
            </div>
        `;

        document.body.appendChild(tutorialOverlay);
        this.tutorialOverlay = tutorialOverlay;

        // Create tutorial trigger button
        const triggerBtn = document.createElement('button');
        triggerBtn.id = 'tutorial-trigger';
        triggerBtn.className = 'tutorial-trigger floating-action';
        triggerBtn.innerHTML = '🎓';
        triggerBtn.title = 'Start guided tutorial';
        triggerBtn.setAttribute('aria-label', 'Start guided tutorial');
        document.body.appendChild(triggerBtn);
        this.tutorialTrigger = triggerBtn;
    }

    bindEvents() {
        // Onboarding events
        if (this.onboardingOverlay) {
            this.onboardingOverlay.addEventListener('click', (e) => {
                if (e.target.classList.contains('onboarding-action')) {
                    this.handleOnboardingAction(e.target.dataset.action);
                } else if (e.target.classList.contains('skip-onboarding')) {
                    this.skipOnboarding();
                }
            });

            // Form events for profile setup
            this.onboardingOverlay.addEventListener('input', (e) => {
                if (e.target.id === 'onboarding-dpi' || e.target.id === 'onboarding-sensitivity') {
                    this.updateSensitivityPreview();
                }
            });
        }

        // Tutorial events
        if (this.tutorialOverlay) {
            this.tutorialOverlay.addEventListener('click', (e) => {
                if (e.target.classList.contains('tutorial-next')) {
                    this.nextTutorialStep();
                } else if (e.target.classList.contains('tutorial-prev')) {
                    this.previousTutorialStep();
                } else if (e.target.classList.contains('tutorial-close')) {
                    this.closeTutorial();
                }
            });
        }

        // Tutorial trigger
        if (this.tutorialTrigger) {
            this.tutorialTrigger.addEventListener('click', () => {
                this.showTutorialMenu();
            });
        }

        // Feature tour buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tour-btn')) {
                const tourType = e.target.closest('.feature-tour').dataset.tour;
                this.startTutorial(tourType);
            }
        });

        // Keyboard shortcuts for tutorials
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentTutorial) {
                this.closeTutorial();
            }
        });
    }

    checkOnboardingStatus() {
        // Check if this is a new user
        const isNewUser = !localStorage.getItem('aimhelper_visited');

        if (isNewUser && !this.hasCompletedOnboarding) {
            // Show onboarding for new users
            setTimeout(() => this.startOnboarding(), 1000);
            localStorage.setItem('aimhelper_visited', 'true');
        } else if (!this.hasCompletedOnboarding) {
            // Show welcome back message for returning users
            this.showWelcomeBack();
        } else {
            // Show tutorial trigger for completed users
            this.showTutorialTrigger();
        }
    }

    startOnboarding() {
        this.currentStep = 0;
        this.showOnboardingStep();
        this.onboardingOverlay.classList.add('active');

        // Announce for screen readers
        if (window.accessibility) {
            window.accessibility.announce('Starting onboarding tutorial', true);
        }
    }

    showOnboardingStep() {
        const step = this.onboardingData.steps[this.currentStep];
        if (!step) return;

        // Update progress
        const progressFill = this.onboardingOverlay.querySelector('.progress-fill');
        const currentStepEl = this.onboardingOverlay.querySelector('.current-step');
        const totalStepsEl = this.onboardingOverlay.querySelector('.total-steps');

        const progress = ((this.currentStep + 1) / this.onboardingData.steps.length) * 100;
        progressFill.style.width = progress + '%';
        currentStepEl.textContent = this.currentStep + 1;
        totalStepsEl.textContent = this.onboardingData.steps.length;

        // Update content
        const body = this.onboardingOverlay.querySelector('.onboarding-body');
        body.innerHTML = step.content;

        // Update actions
        const actions = this.onboardingOverlay.querySelector('.onboarding-actions');
        actions.innerHTML = step.actions.map(action => `
            <button class="onboarding-action btn ${action.primary ? 'btn-primary' : action.secondary ? 'btn-secondary' : 'btn-ghost'}"
                    data-action="${action.action}"
                    ${action.validate ? 'data-validate="true"' : ''}>
                ${action.text}
            </button>
        `).join('');

        // Setup step-specific logic
        if (step.id === 'sensitivity-setup') {
            this.updateSensitivityPreview();
        }
    }

    handleOnboardingAction(action) {
        switch (action) {
            case 'next':
                if (this.validateCurrentStep()) {
                    this.nextOnboardingStep();
                }
                break;
            case 'previous':
                this.previousOnboardingStep();
                break;
            case 'skip':
                this.skipOnboarding();
                break;
            case 'complete':
                this.completeOnboarding();
                break;
            case 'start-training':
                this.completeOnboarding();
                window.location.href = '/grid-shot-enhanced.html';
                break;
        }
    }

    validateCurrentStep() {
        const step = this.onboardingData.steps[this.currentStep];

        if (step.id === 'profile-setup') {
            const mainGame = document.getElementById('onboarding-main-game').value;
            const experience = document.getElementById('onboarding-experience').value;
            const goals = document.querySelectorAll('.checkbox-group input:checked').length;

            if (!mainGame || !experience || goals === 0) {
                this.showValidationError('Please complete all required fields to continue.');
                return false;
            }

            // Save profile data
            this.saveProfileData();
        }

        return true;
    }

    saveProfileData() {
        const profileData = {
            mainGame: document.getElementById('onboarding-main-game').value,
            experience: document.getElementById('onboarding-experience').value,
            goals: Array.from(document.querySelectorAll('.checkbox-group input:checked')).map(cb => cb.value),
            dpi: parseInt(document.getElementById('onboarding-dpi')?.value || '800'),
            sensitivity: parseFloat(document.getElementById('onboarding-sensitivity')?.value || '1.0'),
            windowsSensitivity: parseInt(document.getElementById('onboarding-windows-sens')?.value || '6')
        };

        localStorage.setItem('aimhelper_profile', JSON.stringify(profileData));

        // Apply settings to sensitivity converter if on that page
        if (window.location.href.includes('converter')) {
            setTimeout(() => {
                const fromGame = document.getElementById('fromGame');
                const inputDPI = document.getElementById('inputDPI');
                const inputSensitivity = document.getElementById('inputSensitivity');

                if (fromGame) fromGame.value = profileData.mainGame;
                if (inputDPI) inputDPI.value = profileData.dpi;
                if (inputSensitivity) inputSensitivity.value = profileData.sensitivity;
            }, 100);
        }
    }

    updateSensitivityPreview() {
        const dpi = parseInt(document.getElementById('onboarding-dpi')?.value || '800');
        const sensitivity = parseFloat(document.getElementById('onboarding-sensitivity')?.value || '1.0');

        const edpi = dpi * sensitivity;
        const inches360 = (11.8 * 800) / edpi; // Approximate calculation

        document.getElementById('edpi-preview').textContent = Math.round(edpi);
        document.getElementById('distance-preview').textContent = inches360.toFixed(1) + '"';
    }

    showValidationError(message) {
        // Create or update error message
        let errorEl = this.onboardingOverlay.querySelector('.validation-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'validation-error';
            this.onboardingOverlay.querySelector('.onboarding-footer').prepend(errorEl);
        }

        errorEl.textContent = message;
        errorEl.style.display = 'block';

        // Hide after 5 seconds
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);

        // Announce for screen readers
        if (window.accessibility) {
            window.accessibility.announce(message, true);
        }
    }

    nextOnboardingStep() {
        if (this.currentStep < this.onboardingData.steps.length - 1) {
            this.currentStep++;
            this.showOnboardingStep();
        }
    }

    previousOnboardingStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showOnboardingStep();
        }
    }

    skipOnboarding() {
        this.onboardingOverlay.classList.remove('active');
        this.hasCompletedOnboarding = true;
        this.saveUserProgress();
        this.showTutorialTrigger();

        if (window.accessibility) {
            window.accessibility.announce('Onboarding skipped. You can restart it anytime from the help menu.');
        }
    }

    completeOnboarding() {
        this.onboardingOverlay.classList.remove('active');
        this.hasCompletedOnboarding = true;
        this.saveUserProgress();
        this.showTutorialTrigger();

        // Show completion message
        if (window.uiSystem) {
            window.uiSystem.showSuccess(
                'Welcome to AimHelper Pro!',
                'Your setup is complete. Start training to improve your aim!',
                {
                    duration: 5000,
                    actions: [
                        { text: 'Start Training', action: () => window.location.href = '/grid-shot-enhanced.html' },
                        { text: 'Take a Tour', action: () => this.showTutorialMenu() }
                    ]
                }
            );
        }

        if (window.accessibility) {
            window.accessibility.announce('Onboarding completed successfully. Welcome to AimHelper Pro!');
        }
    }

    showWelcomeBack() {
        if (window.uiSystem) {
            window.uiSystem.showInfo(
                'Welcome back!',
                'Complete your setup to get the most out of AimHelper Pro.',
                {
                    actions: [
                        { text: 'Complete Setup', action: () => this.startOnboarding() },
                        { text: 'Skip for Now', action: () => this.skipOnboarding() }
                    ]
                }
            );
        }
    }

    showTutorialTrigger() {
        if (this.tutorialTrigger) {
            this.tutorialTrigger.style.display = 'block';
            this.tutorialTrigger.classList.add('pulse');
        }
    }

    showTutorialMenu() {
        const menu = document.createElement('div');
        menu.className = 'tutorial-menu modal';
        menu.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📚 Guided Tutorials</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Choose a tutorial to learn specific features:</p>

                    <div class="tutorial-list">
                        ${Array.from(this.tutorialData.entries()).map(([key, tutorial]) => `
                            <div class="tutorial-item">
                                <h3>${tutorial.title}</h3>
                                <p>${tutorial.description}</p>
                                <button class="btn btn-primary start-tutorial" data-tutorial="${key}">
                                    Start Tutorial
                                </button>
                            </div>
                        `).join('')}
                    </div>

                    <div class="tutorial-options">
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            Maybe Later
                        </button>
                        <button class="btn btn-ghost restart-onboarding">
                            Restart Onboarding
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(menu);
        setTimeout(() => menu.classList.add('active'), 10);

        // Bind events
        menu.addEventListener('click', (e) => {
            if (e.target.classList.contains('start-tutorial')) {
                const tutorialKey = e.target.dataset.tutorial;
                menu.remove();
                this.startTutorial(tutorialKey);
            } else if (e.target.classList.contains('restart-onboarding')) {
                menu.remove();
                this.startOnboarding();
            } else if (e.target.classList.contains('modal-close') || e.target === menu) {
                menu.remove();
            }
        });
    }

    startTutorial(tutorialKey) {
        const tutorial = this.tutorialData.get(tutorialKey);
        if (!tutorial) return;

        this.currentTutorial = {
            key: tutorialKey,
            data: tutorial,
            currentStep: 0
        };

        this.showTutorialStep();
        this.tutorialOverlay.classList.add('active');

        if (window.accessibility) {
            window.accessibility.announce(`Starting ${tutorial.title}`, true);
        }
    }

    showTutorialStep() {
        const tutorial = this.currentTutorial.data;
        const step = tutorial.steps[this.currentTutorial.currentStep];
        if (!step) return;

        // Update progress
        this.tutorialOverlay.querySelector('.tutorial-current').textContent = this.currentTutorial.currentStep + 1;
        this.tutorialOverlay.querySelector('.tutorial-total').textContent = tutorial.steps.length;

        // Update content
        this.tutorialOverlay.querySelector('.tooltip-title').textContent = step.title;
        this.tutorialOverlay.querySelector('.tooltip-body').innerHTML = step.content;

        // Position tooltip
        this.positionTutorialTooltip(step);

        // Update navigation buttons
        const prevBtn = this.tutorialOverlay.querySelector('.tutorial-prev');
        const nextBtn = this.tutorialOverlay.querySelector('.tutorial-next');

        prevBtn.disabled = this.currentTutorial.currentStep === 0;
        nextBtn.textContent = this.currentTutorial.currentStep === tutorial.steps.length - 1 ? 'Finish' : 'Next';
    }

    positionTutorialTooltip(step) {
        const tooltip = this.tutorialOverlay.querySelector('.tutorial-tooltip');
        const spotlight = this.tutorialOverlay.querySelector('.tutorial-spotlight');

        if (step.target === 'body') {
            // Center positioning for general instructions
            tooltip.className = 'tutorial-tooltip center';
            spotlight.style.display = 'none';
            return;
        }

        const targetElement = document.querySelector(step.target);
        if (!targetElement) {
            console.warn(`Tutorial target not found: ${step.target}`);
            return;
        }

        const rect = targetElement.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        // Show and position spotlight
        spotlight.style.display = 'block';
        spotlight.style.left = (rect.left - 10) + 'px';
        spotlight.style.top = (rect.top - 10) + 'px';
        spotlight.style.width = (rect.width + 20) + 'px';
        spotlight.style.height = (rect.height + 20) + 'px';

        // Position tooltip based on step.position
        let tooltipX, tooltipY;

        switch (step.position) {
            case 'top':
                tooltipX = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                tooltipY = rect.top - tooltipRect.height - 20;
                tooltip.className = 'tutorial-tooltip position-top';
                break;
            case 'bottom':
                tooltipX = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                tooltipY = rect.bottom + 20;
                tooltip.className = 'tutorial-tooltip position-bottom';
                break;
            case 'left':
                tooltipX = rect.left - tooltipRect.width - 20;
                tooltipY = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                tooltip.className = 'tutorial-tooltip position-left';
                break;
            case 'right':
                tooltipX = rect.right + 20;
                tooltipY = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                tooltip.className = 'tutorial-tooltip position-right';
                break;
            default:
                tooltipX = rect.right + 20;
                tooltipY = rect.top;
                tooltip.className = 'tutorial-tooltip position-right';
        }

        // Ensure tooltip stays within viewport
        tooltipX = Math.max(10, Math.min(tooltipX, window.innerWidth - tooltipRect.width - 10));
        tooltipY = Math.max(10, Math.min(tooltipY, window.innerHeight - tooltipRect.height - 10));

        tooltip.style.left = tooltipX + 'px';
        tooltip.style.top = tooltipY + 'px';

        // Scroll target into view if needed
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    nextTutorialStep() {
        const tutorial = this.currentTutorial.data;

        if (this.currentTutorial.currentStep < tutorial.steps.length - 1) {
            this.currentTutorial.currentStep++;
            this.showTutorialStep();
        } else {
            this.completeTutorial();
        }
    }

    previousTutorialStep() {
        if (this.currentTutorial.currentStep > 0) {
            this.currentTutorial.currentStep--;
            this.showTutorialStep();
        }
    }

    completeTutorial() {
        const tutorialKey = this.currentTutorial.key;
        this.completedTutorials.add(tutorialKey);
        this.saveUserProgress();

        this.closeTutorial();

        if (window.uiSystem) {
            window.uiSystem.showSuccess(
                'Tutorial Complete!',
                `You've mastered the ${this.currentTutorial.data.title}!`
            );
        }

        if (window.accessibility) {
            window.accessibility.announce(`Tutorial completed: ${this.currentTutorial.data.title}`);
        }
    }

    closeTutorial() {
        this.tutorialOverlay.classList.remove('active');
        this.currentTutorial = null;
    }

    restartOnboarding() {
        this.hasCompletedOnboarding = false;
        this.currentStep = 0;
        this.startOnboarding();
    }

    saveUserProgress() {
        const progress = {
            completedOnboarding: this.hasCompletedOnboarding,
            completedTutorials: Array.from(this.completedTutorials),
            lastUpdated: Date.now()
        };

        localStorage.setItem('aimhelper_onboarding_progress', JSON.stringify(progress));
    }

    loadUserProgress() {
        const saved = localStorage.getItem('aimhelper_onboarding_progress');
        if (saved) {
            try {
                const progress = JSON.parse(saved);
                return {
                    completedOnboarding: progress.completedOnboarding || false,
                    completedTutorials: new Set(progress.completedTutorials || [])
                };
            } catch (e) {
                return { completedOnboarding: false, completedTutorials: new Set() };
            }
        }
        return { completedOnboarding: false, completedTutorials: new Set() };
    }
}

// Initialize onboarding manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.onboardingManager = new OnboardingManager();

    // Make it globally accessible
    window.onboarding = window.onboardingManager;
});