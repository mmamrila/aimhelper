/**
 * AimHelper Pro - Comprehensive Help System
 * Context-sensitive help, tutorials, and guided tours
 */

class HelpSystem {
    constructor() {
        this.isActive = false;
        this.currentTour = null;
        this.tourStep = 0;
        this.helpData = this.initializeHelpData();

        this.initializeHelpSystem();
        this.createHelpUI();
    }

    initializeHelpSystem() {
        // Add global help styles
        this.addHelpStyles();

        // Listen for help shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F1' || (e.key === '?' && e.shiftKey)) {
                e.preventDefault();
                this.toggleHelp();
            }
            if (e.key === 'Escape' && this.isActive) {
                this.closeHelp();
            }
        });

        // Add help buttons to key elements
        this.addContextualHelpButtons();
    }

    addHelpStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .help-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                display: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .help-overlay.active {
                display: flex;
                opacity: 1;
            }

            .help-sidebar {
                width: 400px;
                height: 100%;
                background: var(--bg-card);
                border-right: 1px solid var(--border-primary);
                overflow-y: auto;
                transform: translateX(-400px);
                transition: transform 0.3s ease;
            }

            .help-overlay.active .help-sidebar {
                transform: translateX(0);
            }

            .help-content {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: var(--space-8);
            }

            .help-panel {
                background: var(--bg-card-elevated);
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-xl);
                padding: var(--space-8);
                max-width: 600px;
                width: 100%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: var(--shadow-xl);
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }

            .help-overlay.active .help-panel {
                transform: scale(1);
            }

            .help-header {
                display: flex;
                align-items: center;
                justify-content: between;
                margin-bottom: var(--space-6);
                padding-bottom: var(--space-4);
                border-bottom: 1px solid var(--border-secondary);
            }

            .help-title {
                font-size: var(--font-size-xl);
                font-weight: var(--font-weight-bold);
                color: var(--text-primary);
                margin: 0;
            }

            .help-close {
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                padding: var(--space-2);
                border-radius: var(--radius-base);
                transition: all 0.2s ease;
                margin-left: auto;
            }

            .help-close:hover {
                background: var(--bg-hover);
                color: var(--text-primary);
            }

            .help-search {
                width: 100%;
                padding: var(--space-3);
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-base);
                background: var(--bg-input);
                color: var(--text-primary);
                margin-bottom: var(--space-4);
            }

            .help-categories {
                display: flex;
                flex-direction: column;
                gap: var(--space-2);
                margin-bottom: var(--space-4);
            }

            .help-category {
                padding: var(--space-3);
                border: 1px solid var(--border-secondary);
                border-radius: var(--radius-base);
                background: var(--bg-hover);
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: var(--space-3);
            }

            .help-category:hover,
            .help-category.active {
                background: var(--current-category-color, var(--brand-primary));
                color: white;
                border-color: var(--current-category-color, var(--brand-primary));
            }

            .help-category-icon {
                font-size: var(--font-size-lg);
            }

            .help-category-content {
                flex: 1;
            }

            .help-category-title {
                font-weight: var(--font-weight-semibold);
                margin-bottom: var(--space-1);
            }

            .help-category-desc {
                font-size: var(--font-size-sm);
                opacity: 0.8;
            }

            .help-article {
                margin-bottom: var(--space-6);
            }

            .help-article-title {
                font-size: var(--font-size-lg);
                font-weight: var(--font-weight-semibold);
                color: var(--text-primary);
                margin-bottom: var(--space-3);
                display: flex;
                align-items: center;
                gap: var(--space-2);
            }

            .help-article-content {
                color: var(--text-secondary);
                line-height: 1.6;
            }

            .help-article-content h3 {
                color: var(--text-primary);
                margin: var(--space-4) 0 var(--space-2) 0;
            }

            .help-article-content ul {
                padding-left: var(--space-5);
                margin: var(--space-3) 0;
            }

            .help-article-content li {
                margin-bottom: var(--space-2);
            }

            .help-article-content code {
                background: var(--bg-tertiary);
                padding: var(--space-1) var(--space-2);
                border-radius: var(--radius-base);
                font-family: 'Courier New', monospace;
                font-size: var(--font-size-sm);
            }

            .help-btn {
                position: fixed;
                bottom: var(--space-4);
                right: var(--space-4);
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: var(--brand-primary);
                color: white;
                border: none;
                cursor: pointer;
                font-size: var(--font-size-lg);
                box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
                transition: all 0.3s ease;
                z-index: 1000;
            }

            .help-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(26, 115, 232, 0.4);
            }

            .help-tip {
                position: relative;
                display: inline-block;
                cursor: help;
            }

            .help-tip::after {
                content: '?';
                position: absolute;
                top: -5px;
                right: -5px;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: var(--brand-primary);
                color: white;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .help-tip:hover::after {
                opacity: 1;
            }

            .tour-highlight {
                position: relative;
                z-index: 10001;
                border-radius: var(--radius-base);
                box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.5), 0 0 0 2000px rgba(0, 0, 0, 0.8);
                animation: tourPulse 2s infinite;
            }

            @keyframes tourPulse {
                0%, 100% { box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.5), 0 0 0 2000px rgba(0, 0, 0, 0.8); }
                50% { box-shadow: 0 0 0 8px rgba(26, 115, 232, 0.7), 0 0 0 2000px rgba(0, 0, 0, 0.8); }
            }

            .tour-popup {
                position: absolute;
                background: var(--bg-card-elevated);
                border: 1px solid var(--brand-primary);
                border-radius: var(--radius-lg);
                padding: var(--space-4);
                max-width: 300px;
                box-shadow: var(--shadow-xl);
                z-index: 10002;
                transform: scale(0);
                transition: transform 0.3s ease;
            }

            .tour-popup.active {
                transform: scale(1);
            }

            .tour-popup-title {
                font-weight: var(--font-weight-semibold);
                color: var(--text-primary);
                margin-bottom: var(--space-2);
            }

            .tour-popup-content {
                color: var(--text-secondary);
                font-size: var(--font-size-sm);
                line-height: 1.4;
                margin-bottom: var(--space-4);
            }

            .tour-popup-actions {
                display: flex;
                gap: var(--space-2);
            }

            .tour-btn {
                padding: var(--space-2) var(--space-3);
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-base);
                background: var(--bg-secondary);
                color: var(--text-primary);
                cursor: pointer;
                font-size: var(--font-size-sm);
                transition: all 0.2s ease;
            }

            .tour-btn:hover {
                background: var(--bg-hover);
            }

            .tour-btn.primary {
                background: var(--brand-primary);
                color: white;
                border-color: var(--brand-primary);
            }

            @media (max-width: 768px) {
                .help-sidebar {
                    width: 100%;
                    transform: translateX(-100%);
                }

                .help-content {
                    display: none;
                }

                .help-overlay.active .help-sidebar {
                    transform: translateX(0);
                }
            }
        `;

        document.head.appendChild(style);
    }

    createHelpUI() {
        // Create help overlay
        const overlay = document.createElement('div');
        overlay.id = 'helpOverlay';
        overlay.className = 'help-overlay';

        overlay.innerHTML = `
            <div class="help-sidebar">
                <div style="padding: var(--space-6);">
                    <div class="help-header">
                        <h2 class="help-title">📚 Help Center</h2>
                        <button class="help-close" onclick="helpSystem.closeHelp()">✕</button>
                    </div>

                    <input type="text" class="help-search" placeholder="Search help topics..." id="helpSearch">

                    <div class="help-categories" id="helpCategories">
                        <!-- Dynamic content -->
                    </div>
                </div>
            </div>

            <div class="help-content">
                <div class="help-panel" id="helpPanel">
                    <!-- Dynamic content -->
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Create floating help button
        const helpBtn = document.createElement('button');
        helpBtn.className = 'help-btn';
        helpBtn.innerHTML = '?';
        helpBtn.title = 'Help (F1)';
        helpBtn.onclick = () => this.toggleHelp();

        document.body.appendChild(helpBtn);

        // Load help categories
        this.loadHelpCategories();

        // Setup search
        document.getElementById('helpSearch').addEventListener('input', (e) => {
            this.searchHelp(e.target.value);
        });
    }

    initializeHelpData() {
        return {
            'getting-started': {
                title: 'Getting Started',
                icon: '🚀',
                description: 'Learn the basics of AimHelper Pro',
                articles: [
                    {
                        id: 'welcome',
                        title: 'Welcome to AimHelper Pro',
                        content: `
                            <h3>What is AimHelper Pro?</h3>
                            <p>AimHelper Pro is a comprehensive aim training platform designed to help gamers improve their aiming skills across multiple games.</p>

                            <h3>Key Features:</h3>
                            <ul>
                                <li><strong>Sensitivity Converter:</strong> Convert sensitivity between 18+ games</li>
                                <li><strong>Professional Tests:</strong> Grid Shot, Flick, Track, and Switch scenarios</li>
                                <li><strong>Advanced Analytics:</strong> Heat maps, performance trends, and insights</li>
                                <li><strong>Community Features:</strong> Leaderboards, challenges, and Discord integration</li>
                            </ul>

                            <h3>Getting Started:</h3>
                            <ol>
                                <li>Convert your sensitivity from your main game</li>
                                <li>Take the Grid Shot test to establish a baseline</li>
                                <li>Review your analytics to identify areas for improvement</li>
                                <li>Join the community and participate in challenges</li>
                            </ol>
                        `
                    },
                    {
                        id: 'first-steps',
                        title: 'Your First Training Session',
                        content: `
                            <h3>Step 1: Set Up Your Sensitivity</h3>
                            <p>Visit the <strong>Converter</strong> page and convert your sensitivity from your main game. This ensures consistent muscle memory across games.</p>

                            <h3>Step 2: Baseline Test</h3>
                            <p>Take the <strong>Grid Shot</strong> test to establish your current skill level. This helps track your improvement over time.</p>

                            <h3>Step 3: Review Analytics</h3>
                            <p>Check your performance analytics to understand your strengths and areas for improvement.</p>

                            <h3>Tips for Success:</h3>
                            <ul>
                                <li>Warm up for 5-10 minutes before serious training</li>
                                <li>Maintain consistent posture and mouse grip</li>
                                <li>Focus on accuracy first, then speed</li>
                                <li>Train regularly but avoid overtraining</li>
                            </ul>
                        `
                    }
                ]
            },
            'sensitivity-converter': {
                title: 'Sensitivity Converter',
                icon: '🔄',
                description: 'Convert sensitivity between games',
                articles: [
                    {
                        id: 'how-to-convert',
                        title: 'How to Convert Sensitivity',
                        content: `
                            <h3>Basic Conversion:</h3>
                            <ol>
                                <li>Select your <strong>From Game</strong> (current game)</li>
                                <li>Select your <strong>To Game</strong> (target game)</li>
                                <li>Enter your current sensitivity and DPI</li>
                                <li>Copy the converted sensitivity</li>
                            </ol>

                            <h3>Understanding eDPI:</h3>
                            <p><strong>eDPI (effective DPI)</strong> = Mouse DPI × In-game Sensitivity</p>
                            <p>This value represents your true sensitivity across all games.</p>

                            <h3>in/360° Explained:</h3>
                            <p>This shows how many inches you need to move your mouse for a full 360° turn. Lower values = higher sensitivity.</p>

                            <h3>Pro Tips:</h3>
                            <ul>
                                <li>Most pro players use 8-20 in/360°</li>
                                <li>Lower sensitivity = better precision</li>
                                <li>Higher sensitivity = faster target switching</li>
                                <li>Find the balance that works for your playstyle</li>
                            </ul>
                        `
                    },
                    {
                        id: 'supported-games',
                        title: 'Supported Games',
                        content: `
                            <h3>Currently Supported Games:</h3>
                            <ul>
                                <li><strong>Valorant</strong> - Riot's tactical shooter</li>
                                <li><strong>CS2 / CS:GO</strong> - Counter-Strike series</li>
                                <li><strong>Apex Legends</strong> - Battle royale</li>
                                <li><strong>Overwatch 2</strong> - Hero shooter</li>
                                <li><strong>Fortnite</strong> - Battle royale</li>
                                <li><strong>Rainbow Six Siege</strong> - Tactical shooter</li>
                                <li><strong>Call of Duty</strong> - Arcade shooter</li>
                                <li><strong>PUBG</strong> - Battle royale</li>
                                <li>And 10+ more games!</li>
                            </ul>

                            <h3>Accuracy Guarantee:</h3>
                            <p>All conversion multipliers are verified against official game sources and tested by professional players.</p>
                        `
                    }
                ]
            },
            'aim-training': {
                title: 'Aim Training',
                icon: '🎯',
                description: 'Master different aim training scenarios',
                articles: [
                    {
                        id: 'grid-shot',
                        title: 'Grid Shot Training',
                        content: `
                            <h3>What is Grid Shot?</h3>
                            <p>Grid Shot is a fundamental aim training exercise that focuses on target acquisition and clicking precision.</p>

                            <h3>How to Practice:</h3>
                            <ol>
                                <li>Select your difficulty level</li>
                                <li>Choose test duration (30s, 60s, or 2 minutes)</li>
                                <li>Click targets as quickly and accurately as possible</li>
                                <li>Review your performance metrics</li>
                            </ol>

                            <h3>Key Metrics:</h3>
                            <ul>
                                <li><strong>Score:</strong> Overall performance rating</li>
                                <li><strong>Accuracy:</strong> Percentage of successful hits</li>
                                <li><strong>Reaction Time:</strong> Average time to click targets</li>
                                <li><strong>Kills/Second:</strong> Target elimination rate</li>
                                <li><strong>Consistency:</strong> Performance stability</li>
                            </ul>

                            <h3>Improvement Tips:</h3>
                            <ul>
                                <li>Focus on accuracy over speed initially</li>
                                <li>Use smooth, controlled mouse movements</li>
                                <li>Don't tense up - stay relaxed</li>
                                <li>Practice regularly for muscle memory</li>
                            </ul>
                        `
                    },
                    {
                        id: 'difficulty-levels',
                        title: 'Difficulty Levels Guide',
                        content: `
                            <h3>Easy Mode:</h3>
                            <ul>
                                <li>Target Size: 60px</li>
                                <li>Spawn Rate: Every 800ms</li>
                                <li>Target Lifetime: 2.5 seconds</li>
                                <li>Best for: Beginners, accuracy focus</li>
                            </ul>

                            <h3>Medium Mode:</h3>
                            <ul>
                                <li>Target Size: 45px</li>
                                <li>Spawn Rate: Every 600ms</li>
                                <li>Target Lifetime: 2 seconds</li>
                                <li>Best for: Intermediate players, balanced training</li>
                            </ul>

                            <h3>Hard Mode:</h3>
                            <ul>
                                <li>Target Size: 30px</li>
                                <li>Spawn Rate: Every 400ms</li>
                                <li>Target Lifetime: 1.5 seconds</li>
                                <li>Best for: Advanced players, precision training</li>
                            </ul>

                            <h3>Extreme Mode:</h3>
                            <ul>
                                <li>Target Size: 20px</li>
                                <li>Spawn Rate: Every 300ms</li>
                                <li>Target Lifetime: 1.2 seconds</li>
                                <li>Best for: Pro players, speed training</li>
                            </ul>
                        `
                    }
                ]
            },
            'analytics': {
                title: 'Analytics & Progress',
                icon: '📊',
                description: 'Understanding your performance data',
                articles: [
                    {
                        id: 'metrics-explained',
                        title: 'Understanding Your Metrics',
                        content: `
                            <h3>Core Metrics:</h3>

                            <h4>Accuracy</h4>
                            <p>Percentage of successful target hits. Higher is always better.</p>
                            <ul>
                                <li>90%+: Exceptional</li>
                                <li>80-89%: Very Good</li>
                                <li>70-79%: Good</li>
                                <li>60-69%: Average</li>
                                <li><60%: Needs improvement</li>
                            </ul>

                            <h4>Reaction Time</h4>
                            <p>Average time to click targets after they appear.</p>
                            <ul>
                                <li><200ms: Excellent</li>
                                <li>200-250ms: Very Good</li>
                                <li>250-300ms: Good</li>
                                <li>300-400ms: Average</li>
                                <li>>400ms: Slow</li>
                            </ul>

                            <h4>Consistency</h4>
                            <p>How stable your performance is across the session.</p>
                            <ul>
                                <li>85%+: Very consistent</li>
                                <li>70-84%: Consistent</li>
                                <li>50-69%: Somewhat inconsistent</li>
                                <li><50%: Inconsistent</li>
                            </ul>
                        `
                    },
                    {
                        id: 'heat-maps',
                        title: 'Heat Map Analysis (Pro Feature)',
                        content: `
                            <h3>What are Heat Maps?</h3>
                            <p>Heat maps visualize where you tend to miss targets most frequently, helping identify weak spots in your aim.</p>

                            <h3>Reading Heat Maps:</h3>
                            <ul>
                                <li><strong>Red/Hot areas:</strong> Frequent misses</li>
                                <li><strong>Blue/Cold areas:</strong> Accurate areas</li>
                                <li><strong>Patterns:</strong> Show systematic aiming errors</li>
                            </ul>

                            <h3>Common Patterns:</h3>
                            <ul>
                                <li><strong>Bottom-heavy:</strong> Undershooting vertically</li>
                                <li><strong>Right-heavy:</strong> Overshooting horizontally</li>
                                <li><strong>Scattered:</strong> Inconsistent mouse control</li>
                                <li><strong>Edge clustering:</strong> Difficulty with screen edges</li>
                            </ul>

                            <h3>Using Heat Maps for Improvement:</h3>
                            <ol>
                                <li>Identify your most common miss patterns</li>
                                <li>Practice specific movements to correct errors</li>
                                <li>Adjust sensitivity if patterns suggest over/undershooting</li>
                                <li>Focus on problematic screen areas</li>
                            </ol>
                        `
                    }
                ]
            },
            'community': {
                title: 'Community & Social',
                icon: '👥',
                description: 'Connect with other players',
                articles: [
                    {
                        id: 'discord-integration',
                        title: 'Discord Integration',
                        content: `
                            <h3>Join Our Discord Community</h3>
                            <p>Connect with over 8,000 gamers improving their aim together!</p>

                            <h3>Discord Bot Commands:</h3>
                            <ul>
                                <li><code>/aim-stats</code> - View your statistics</li>
                                <li><code>/leaderboard</code> - See community rankings</li>
                                <li><code>/challenge</code> - Join community challenges</li>
                                <li><code>/aim-tips</code> - Get personalized advice</li>
                                <li><code>/find-duo</code> - Find practice partners</li>
                                <li><code>/link-account</code> - Connect your AimHelper account</li>
                            </ul>

                            <h3>Community Features:</h3>
                            <ul>
                                <li>Practice partner matching</li>
                                <li>Professional player AMAs</li>
                                <li>Weekly challenges and tournaments</li>
                                <li>Coaching and tips sharing</li>
                                <li>Game-specific discussion channels</li>
                            </ul>
                        `
                    },
                    {
                        id: 'challenges',
                        title: 'Community Challenges',
                        content: `
                            <h3>Weekly Challenges:</h3>
                            <ul>
                                <li><strong>Accuracy Master:</strong> Achieve 80% average accuracy</li>
                                <li><strong>Speed Demon:</strong> Get sub-200ms reaction time</li>
                                <li><strong>Consistency King:</strong> Complete 20 training sessions</li>
                                <li><strong>Daily Grind:</strong> Complete 5 sessions in one day</li>
                            </ul>

                            <h3>Challenge Rewards:</h3>
                            <ul>
                                <li>Exclusive profile badges</li>
                                <li>Leaderboard recognition</li>
                                <li>Premium trial extensions</li>
                                <li>Discord role upgrades</li>
                            </ul>

                            <h3>How to Participate:</h3>
                            <ol>
                                <li>View active challenges in the Community section</li>
                                <li>Complete the challenge requirements</li>
                                <li>Track progress in real-time</li>
                                <li>Earn rewards automatically</li>
                            </ol>
                        `
                    }
                ]
            },
            'troubleshooting': {
                title: 'Troubleshooting',
                icon: '🔧',
                description: 'Solve common issues',
                articles: [
                    {
                        id: 'common-issues',
                        title: 'Common Issues & Solutions',
                        content: `
                            <h3>Test Won't Start</h3>
                            <p><strong>Solution:</strong> Check if you've reached your daily test limit (Free: 3 tests/day). Consider upgrading to Pro for unlimited tests.</p>

                            <h3>Sensitivity Feels Wrong</h3>
                            <p><strong>Solutions:</strong></p>
                            <ul>
                                <li>Double-check your DPI setting in mouse software</li>
                                <li>Verify in-game sensitivity is entered correctly</li>
                                <li>Ensure no mouse acceleration is enabled</li>
                                <li>Check for any DPI switching buttons on your mouse</li>
                            </ul>

                            <h3>Performance Issues</h3>
                            <p><strong>Solutions:</strong></p>
                            <ul>
                                <li>Close other browser tabs</li>
                                <li>Disable browser extensions temporarily</li>
                                <li>Update your browser to the latest version</li>
                                <li>Try a different browser (Chrome recommended)</li>
                            </ul>

                            <h3>Analytics Not Loading</h3>
                            <p><strong>Solution:</strong> Complete at least 3 tests to generate meaningful analytics data.</p>
                        `
                    },
                    {
                        id: 'browser-compatibility',
                        title: 'Browser Compatibility',
                        content: `
                            <h3>Recommended Browsers:</h3>
                            <ul>
                                <li><strong>Google Chrome</strong> - Best performance</li>
                                <li><strong>Microsoft Edge</strong> - Good performance</li>
                                <li><strong>Firefox</strong> - Good compatibility</li>
                                <li><strong>Safari</strong> - Basic functionality</li>
                            </ul>

                            <h3>Required Features:</h3>
                            <ul>
                                <li>JavaScript enabled</li>
                                <li>HTML5 Canvas support</li>
                                <li>LocalStorage for data saving</li>
                                <li>Clipboard API for copy functions</li>
                            </ul>

                            <h3>Optimal Settings:</h3>
                            <ul>
                                <li>Hardware acceleration enabled</li>
                                <li>Pop-up blocker disabled for this site</li>
                                <li>Cookies enabled</li>
                                <li>Full-screen mode for testing</li>
                            </ul>
                        `
                    }
                ]
            }
        };
    }

    loadHelpCategories() {
        const container = document.getElementById('helpCategories');
        container.innerHTML = '';

        Object.entries(this.helpData).forEach(([key, category]) => {
            const categoryEl = document.createElement('div');
            categoryEl.className = 'help-category';
            categoryEl.onclick = () => this.showCategory(key);

            categoryEl.innerHTML = `
                <div class="help-category-icon">${category.icon}</div>
                <div class="help-category-content">
                    <div class="help-category-title">${category.title}</div>
                    <div class="help-category-desc">${category.description}</div>
                </div>
            `;

            container.appendChild(categoryEl);
        });

        // Show getting started by default
        this.showCategory('getting-started');
    }

    showCategory(categoryKey) {
        // Update active category
        document.querySelectorAll('.help-category').forEach(cat => cat.classList.remove('active'));
        event?.target.closest('.help-category')?.classList.add('active');

        const category = this.helpData[categoryKey];
        const panel = document.getElementById('helpPanel');

        let content = `
            <div class="help-header">
                <h2 class="help-title">${category.icon} ${category.title}</h2>
            </div>
        `;

        category.articles.forEach(article => {
            content += `
                <div class="help-article">
                    <div class="help-article-title">
                        📄 ${article.title}
                    </div>
                    <div class="help-article-content">
                        ${article.content}
                    </div>
                </div>
            `;
        });

        panel.innerHTML = content;
    }

    searchHelp(query) {
        if (!query) {
            this.loadHelpCategories();
            return;
        }

        const results = [];
        Object.entries(this.helpData).forEach(([categoryKey, category]) => {
            category.articles.forEach(article => {
                if (
                    article.title.toLowerCase().includes(query.toLowerCase()) ||
                    article.content.toLowerCase().includes(query.toLowerCase())
                ) {
                    results.push({ categoryKey, category, article });
                }
            });
        });

        const panel = document.getElementById('helpPanel');
        let content = `
            <div class="help-header">
                <h2 class="help-title">🔍 Search Results for "${query}"</h2>
            </div>
        `;

        if (results.length === 0) {
            content += '<p style="text-align: center; color: var(--text-secondary);">No results found. Try a different search term.</p>';
        } else {
            results.forEach(({ category, article }) => {
                content += `
                    <div class="help-article">
                        <div class="help-article-title">
                            ${category.icon} ${article.title}
                        </div>
                        <div class="help-article-content">
                            ${article.content.substring(0, 300)}...
                        </div>
                    </div>
                `;
            });
        }

        panel.innerHTML = content;
    }

    toggleHelp() {
        if (this.isActive) {
            this.closeHelp();
        } else {
            this.openHelp();
        }
    }

    openHelp() {
        const overlay = document.getElementById('helpOverlay');
        overlay.classList.add('active');
        this.isActive = true;
    }

    closeHelp() {
        const overlay = document.getElementById('helpOverlay');
        overlay.classList.remove('active');
        this.isActive = false;
    }

    addContextualHelpButtons() {
        // Add help tips to key elements
        const helpTips = [
            {
                selector: '#inputSensitivity',
                tip: 'Enter your current in-game sensitivity value'
            },
            {
                selector: '#inputDPI',
                tip: 'Enter your mouse DPI (check mouse software)'
            },
            {
                selector: '.difficulty-btn',
                tip: 'Choose difficulty based on your skill level'
            },
            {
                selector: '#testDuration',
                tip: 'Longer tests provide more accurate results'
            }
        ];

        helpTips.forEach(({ selector, tip }) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (!element.hasAttribute('data-tooltip')) {
                    element.setAttribute('data-tooltip', tip);
                }
            });
        });
    }

    // Tour System
    startTour(tourName) {
        const tours = {
            'converter': [
                {
                    element: '#fromGame',
                    title: 'Select Source Game',
                    content: 'Choose the game you currently play and want to convert FROM.'
                },
                {
                    element: '#toGame',
                    title: 'Select Target Game',
                    content: 'Choose the game you want to convert your sensitivity TO.'
                },
                {
                    element: '#inputSensitivity',
                    title: 'Enter Your Sensitivity',
                    content: 'Input your current in-game sensitivity value.'
                },
                {
                    element: '#inputDPI',
                    title: 'Enter Mouse DPI',
                    content: 'Enter your mouse DPI setting (check mouse software).'
                }
            ],
            'grid-shot': [
                {
                    element: '.difficulty-selector',
                    title: 'Choose Difficulty',
                    content: 'Select difficulty level based on your skill. Start with Medium if unsure.'
                },
                {
                    element: '#testDuration',
                    title: 'Test Duration',
                    content: '60 seconds is recommended for accurate results.'
                },
                {
                    element: '#startTest',
                    title: 'Start Training',
                    content: 'Click to begin your aim training session!'
                }
            ]
        };

        if (!tours[tourName]) return;

        this.currentTour = tours[tourName];
        this.tourStep = 0;
        this.showTourStep();
    }

    showTourStep() {
        if (!this.currentTour || this.tourStep >= this.currentTour.length) {
            this.endTour();
            return;
        }

        const step = this.currentTour[this.tourStep];
        const element = document.querySelector(step.element);

        if (!element) {
            this.nextTourStep();
            return;
        }

        // Highlight element
        element.classList.add('tour-highlight');

        // Position popup
        const popup = this.createTourPopup(step);
        this.positionTourPopup(popup, element);

        document.body.appendChild(popup);
        setTimeout(() => popup.classList.add('active'), 100);
    }

    createTourPopup(step) {
        const popup = document.createElement('div');
        popup.className = 'tour-popup';
        popup.innerHTML = `
            <div class="tour-popup-title">${step.title}</div>
            <div class="tour-popup-content">${step.content}</div>
            <div class="tour-popup-actions">
                <button class="tour-btn" onclick="helpSystem.skipTour()">Skip Tour</button>
                <button class="tour-btn primary" onclick="helpSystem.nextTourStep()">
                    ${this.tourStep === this.currentTour.length - 1 ? 'Finish' : 'Next'}
                </button>
            </div>
        `;
        return popup;
    }

    positionTourPopup(popup, element) {
        const rect = element.getBoundingClientRect();
        const popupHeight = 150;
        const popupWidth = 300;

        let top = rect.bottom + 10;
        let left = rect.left;

        // Adjust if popup goes off screen
        if (top + popupHeight > window.innerHeight) {
            top = rect.top - popupHeight - 10;
        }
        if (left + popupWidth > window.innerWidth) {
            left = window.innerWidth - popupWidth - 20;
        }
        if (left < 20) {
            left = 20;
        }

        popup.style.top = `${top}px`;
        popup.style.left = `${left}px`;
    }

    nextTourStep() {
        this.cleanupTourStep();
        this.tourStep++;
        this.showTourStep();
    }

    skipTour() {
        this.endTour();
    }

    endTour() {
        this.cleanupTourStep();
        this.currentTour = null;
        this.tourStep = 0;
    }

    cleanupTourStep() {
        // Remove highlights and popups
        document.querySelectorAll('.tour-highlight').forEach(el => {
            el.classList.remove('tour-highlight');
        });
        document.querySelectorAll('.tour-popup').forEach(el => {
            el.remove();
        });
    }
}

// Initialize help system
const helpSystem = new HelpSystem();
window.helpSystem = helpSystem;