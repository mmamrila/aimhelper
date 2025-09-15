/**
 * AimHelper Pro - Accessibility & Keyboard Shortcuts System
 * Comprehensive accessibility features and keyboard navigation
 */

class AccessibilityManager {
    constructor() {
        this.shortcuts = new Map();
        this.focusableElements = [];
        this.currentFocusIndex = 0;
        this.announcements = [];
        this.highContrastMode = false;
        this.reducedMotion = false;
        this.largeText = false;
        this.screenReaderMode = false;

        this.init();
    }

    init() {
        this.setupKeyboardShortcuts();
        this.setupAccessibilityControls();
        this.setupFocusManagement();
        this.setupScreenReader();
        this.loadUserPreferences();
        this.createAccessibilityPanel();
        this.enhanceExistingElements();
    }

    setupKeyboardShortcuts() {
        // Global shortcuts
        this.addShortcut('F1', () => this.toggleHelp(), 'Open help system');
        this.addShortcut('Shift+?', () => this.showShortcutsModal(), 'Show keyboard shortcuts');
        this.addShortcut('Alt+1', () => this.navigateToSection('home'), 'Navigate to home');
        this.addShortcut('Alt+2', () => this.navigateToSection('converter'), 'Navigate to converter');
        this.addShortcut('Alt+3', () => this.navigateToSection('training'), 'Navigate to training');
        this.addShortcut('Alt+4', () => this.navigateToSection('education'), 'Navigate to education');

        // Accessibility shortcuts
        this.addShortcut('Alt+H', () => this.toggleHighContrast(), 'Toggle high contrast mode');
        this.addShortcut('Alt+M', () => this.toggleReducedMotion(), 'Toggle reduced motion');
        this.addShortcut('Alt+T', () => this.toggleLargeText(), 'Toggle large text');
        this.addShortcut('Alt+S', () => this.toggleScreenReader(), 'Toggle screen reader mode');

        // Navigation shortcuts
        this.addShortcut('Tab', (e) => this.handleTabNavigation(e), 'Navigate forward');
        this.addShortcut('Shift+Tab', (e) => this.handleShiftTabNavigation(e), 'Navigate backward');
        this.addShortcut('Enter', (e) => this.handleEnterKey(e), 'Activate focused element');
        this.addShortcut('Space', (e) => this.handleSpaceKey(e), 'Activate buttons or scroll');
        this.addShortcut('Escape', () => this.handleEscape(), 'Close modal or cancel action');

        // Test-specific shortcuts (when in training mode)
        this.addShortcut('Space', (e) => this.handleTestPause(e), 'Pause/resume test');
        this.addShortcut('R', () => this.restartTest(), 'Restart current test');
        this.addShortcut('N', () => this.nextTest(), 'Move to next test');
        this.addShortcut('Q', () => this.quitTest(), 'Quit current test');

        // Results shortcuts
        this.addShortcut('Ctrl+C', (e) => this.copyResults(e), 'Copy results to clipboard');
        this.addShortcut('Ctrl+S', () => this.saveResults(), 'Save results');
        this.addShortcut('Ctrl+Shift+S', () => this.shareResults(), 'Share results');

        // Settings shortcuts
        this.addShortcut('Ctrl+,', () => this.openSettings(), 'Open settings');
        this.addShortcut('Ctrl+Shift+A', () => this.toggleAccessibilityPanel(), 'Toggle accessibility panel');

        // Bind all shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    addShortcut(keys, action, description) {
        const normalizedKeys = this.normalizeKeys(keys);
        this.shortcuts.set(normalizedKeys, { action, description });
    }

    normalizeKeys(keys) {
        return keys.toLowerCase()
            .replace(/\+/g, '+')
            .split('+')
            .sort((a, b) => {
                const order = ['ctrl', 'alt', 'shift', 'meta'];
                const aIndex = order.indexOf(a);
                const bIndex = order.indexOf(b);
                if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                return a.localeCompare(b);
            })
            .join('+');
    }

    handleKeyDown(e) {
        const keys = [];

        if (e.ctrlKey) keys.push('ctrl');
        if (e.altKey) keys.push('alt');
        if (e.shiftKey) keys.push('shift');
        if (e.metaKey) keys.push('meta');

        // Add the main key
        if (e.key === ' ') {
            keys.push('space');
        } else if (e.key === 'Tab') {
            keys.push('tab');
        } else if (e.key === 'Enter') {
            keys.push('enter');
        } else if (e.key === 'Escape') {
            keys.push('escape');
        } else if (e.key.length === 1) {
            keys.push(e.key.toLowerCase());
        } else if (e.key.startsWith('F') && /F\d+/.test(e.key)) {
            keys.push(e.key.toLowerCase());
        }

        const keyCombo = keys.join('+');
        const shortcut = this.shortcuts.get(keyCombo);

        if (shortcut) {
            // Don't prevent default for navigation keys unless specifically handled
            if (!['tab', 'shift+tab'].includes(keyCombo) || this.shouldPreventDefault(e)) {
                e.preventDefault();
            }
            shortcut.action(e);
        }
    }

    shouldPreventDefault(e) {
        // Allow default tab behavior for standard form navigation
        // Only prevent when we want custom focus management
        return e.target.closest('.custom-focus-container') ||
               e.target.closest('.test-arena') ||
               document.querySelector('.modal.active');
    }

    setupAccessibilityControls() {
        // Detect user preferences from system
        this.detectSystemPreferences();

        // Listen for preference changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
                if (e.matches) this.enableReducedMotion();
            });

            window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
                if (e.matches) this.enableHighContrast();
            });
        }
    }

    detectSystemPreferences() {
        if (window.matchMedia) {
            // Reduced motion
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                this.enableReducedMotion();
            }

            // High contrast
            if (window.matchMedia('(prefers-contrast: high)').matches) {
                this.enableHighContrast();
            }

            // Color scheme
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.body.classList.add('dark-mode');
            }
        }
    }

    setupFocusManagement() {
        // Create focus indicator
        this.createFocusIndicator();

        // Track focusable elements
        this.updateFocusableElements();

        // Handle focus events
        document.addEventListener('focusin', (e) => this.handleFocusIn(e));
        document.addEventListener('focusout', (e) => this.handleFocusOut(e));

        // Update focusable elements when DOM changes
        const observer = new MutationObserver(() => this.updateFocusableElements());
        observer.observe(document.body, { childList: true, subtree: true });
    }

    createFocusIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'focus-indicator';
        indicator.style.cssText = `
            position: fixed;
            border: 2px solid var(--brand-primary, #1a73e8);
            border-radius: 4px;
            pointer-events: none;
            z-index: 10000;
            transition: all 0.15s ease;
            opacity: 0;
            background: transparent;
            box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.3);
        `;
        document.body.appendChild(indicator);
        this.focusIndicator = indicator;
    }

    updateFocusableElements() {
        const selectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])',
            '[role="button"]:not([disabled])',
            '[role="link"]',
            '.focusable'
        ].join(',');

        this.focusableElements = Array.from(document.querySelectorAll(selectors))
            .filter(el => this.isVisible(el) && !el.closest('[aria-hidden="true"]'));
    }

    isVisible(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               element.offsetParent !== null;
    }

    handleFocusIn(e) {
        this.showFocusIndicator(e.target);
        this.announceElement(e.target);
    }

    handleFocusOut(e) {
        if (!e.relatedTarget) {
            this.hideFocusIndicator();
        }
    }

    showFocusIndicator(element) {
        if (!this.focusIndicator || !element) return;

        const rect = element.getBoundingClientRect();
        const indicator = this.focusIndicator;

        indicator.style.left = (rect.left - 4) + 'px';
        indicator.style.top = (rect.top - 4) + 'px';
        indicator.style.width = (rect.width + 8) + 'px';
        indicator.style.height = (rect.height + 8) + 'px';
        indicator.style.opacity = '1';
    }

    hideFocusIndicator() {
        if (this.focusIndicator) {
            this.focusIndicator.style.opacity = '0';
        }
    }

    setupScreenReader() {
        // Create live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(liveRegion);
        this.liveRegion = liveRegion;

        // Create assertive live region for urgent announcements
        const assertiveRegion = document.createElement('div');
        assertiveRegion.id = 'aria-assertive-region';
        assertiveRegion.setAttribute('aria-live', 'assertive');
        assertiveRegion.setAttribute('aria-atomic', 'true');
        assertiveRegion.style.cssText = liveRegion.style.cssText;
        document.body.appendChild(assertiveRegion);
        this.assertiveRegion = assertiveRegion;
    }

    announce(message, urgent = false) {
        const region = urgent ? this.assertiveRegion : this.liveRegion;
        if (region) {
            // Clear and then set message to ensure it's announced
            region.textContent = '';
            setTimeout(() => {
                region.textContent = message;
            }, 10);
        }

        // Store announcement for screen reader mode
        this.announcements.push({
            message,
            urgent,
            timestamp: Date.now()
        });

        // Limit stored announcements
        if (this.announcements.length > 50) {
            this.announcements.splice(0, 10);
        }
    }

    announceElement(element) {
        if (!this.screenReaderMode || !element) return;

        const tag = element.tagName.toLowerCase();
        let announcement = '';

        // Get element text or label
        const text = element.textContent ||
                    element.value ||
                    element.getAttribute('aria-label') ||
                    element.getAttribute('title') ||
                    element.getAttribute('placeholder') || '';

        // Determine element type
        if (tag === 'button') {
            announcement = `Button: ${text}`;
        } else if (tag === 'input') {
            const type = element.type || 'text';
            announcement = `${type} input: ${text}`;
        } else if (tag === 'select') {
            announcement = `Dropdown: ${text}`;
        } else if (tag === 'a') {
            announcement = `Link: ${text}`;
        } else if (element.getAttribute('role')) {
            const role = element.getAttribute('role');
            announcement = `${role}: ${text}`;
        } else {
            announcement = text;
        }

        if (announcement.trim()) {
            this.announce(announcement);
        }
    }

    createAccessibilityPanel() {
        const panel = document.createElement('div');
        panel.id = 'accessibility-panel';
        panel.className = 'accessibility-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-labelledby', 'accessibility-title');
        panel.setAttribute('aria-hidden', 'true');

        panel.innerHTML = `
            <div class="accessibility-panel-content">
                <div class="accessibility-header">
                    <h2 id="accessibility-title">Accessibility Settings</h2>
                    <button class="close-panel" aria-label="Close accessibility panel">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <div class="accessibility-controls">
                    <div class="control-group">
                        <h3>Visual Accessibility</h3>

                        <label class="accessibility-toggle">
                            <input type="checkbox" id="high-contrast-toggle">
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">High Contrast Mode</span>
                            <span class="toggle-description">Increases contrast for better visibility</span>
                        </label>

                        <label class="accessibility-toggle">
                            <input type="checkbox" id="large-text-toggle">
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Large Text</span>
                            <span class="toggle-description">Increases text size throughout the app</span>
                        </label>

                        <label class="accessibility-toggle">
                            <input type="checkbox" id="reduced-motion-toggle">
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Reduced Motion</span>
                            <span class="toggle-description">Reduces animations and motion effects</span>
                        </label>
                    </div>

                    <div class="control-group">
                        <h3>Screen Reader Support</h3>

                        <label class="accessibility-toggle">
                            <input type="checkbox" id="screen-reader-toggle">
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Enhanced Screen Reader Mode</span>
                            <span class="toggle-description">Provides additional announcements and descriptions</span>
                        </label>

                        <button class="btn btn-secondary" id="test-announcement">
                            Test Screen Reader Announcement
                        </button>
                    </div>

                    <div class="control-group">
                        <h3>Keyboard Navigation</h3>

                        <button class="btn btn-secondary" id="show-shortcuts">
                            View Keyboard Shortcuts
                        </button>

                        <button class="btn btn-secondary" id="focus-test">
                            Test Focus Navigation
                        </button>
                    </div>

                    <div class="control-group">
                        <h3>Reset Settings</h3>

                        <button class="btn btn-ghost" id="reset-accessibility">
                            Reset All Accessibility Settings
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        this.accessibilityPanel = panel;

        // Bind panel events
        this.bindPanelEvents();
    }

    bindPanelEvents() {
        const panel = this.accessibilityPanel;

        // Close panel
        panel.querySelector('.close-panel').addEventListener('click', () => {
            this.toggleAccessibilityPanel();
        });

        // Toggle controls
        panel.querySelector('#high-contrast-toggle').addEventListener('change', (e) => {
            if (e.target.checked) this.enableHighContrast();
            else this.disableHighContrast();
        });

        panel.querySelector('#large-text-toggle').addEventListener('change', (e) => {
            if (e.target.checked) this.enableLargeText();
            else this.disableLargeText();
        });

        panel.querySelector('#reduced-motion-toggle').addEventListener('change', (e) => {
            if (e.target.checked) this.enableReducedMotion();
            else this.disableReducedMotion();
        });

        panel.querySelector('#screen-reader-toggle').addEventListener('change', (e) => {
            if (e.target.checked) this.enableScreenReader();
            else this.disableScreenReader();
        });

        // Action buttons
        panel.querySelector('#test-announcement').addEventListener('click', () => {
            this.announce('This is a test announcement for screen readers', true);
        });

        panel.querySelector('#show-shortcuts').addEventListener('click', () => {
            this.showShortcutsModal();
        });

        panel.querySelector('#focus-test').addEventListener('click', () => {
            this.startFocusTest();
        });

        panel.querySelector('#reset-accessibility').addEventListener('click', () => {
            this.resetAllSettings();
        });
    }

    enhanceExistingElements() {
        // Add ARIA labels to elements missing them
        this.addMissingAriaLabels();

        // Ensure proper heading hierarchy
        this.validateHeadingHierarchy();

        // Add skip links
        this.addSkipLinks();

        // Enhance form controls
        this.enhanceFormControls();

        // Add status announcements for dynamic content
        this.setupStatusAnnouncements();
    }

    addMissingAriaLabels() {
        // Add labels to buttons without text
        document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(button => {
            const text = button.textContent.trim();
            if (!text) {
                const icon = button.querySelector('[class*="icon"], svg, img');
                if (icon) {
                    button.setAttribute('aria-label', 'Button');
                }
            }
        });

        // Add labels to input fields without labels
        document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').forEach(input => {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (!label && input.placeholder) {
                input.setAttribute('aria-label', input.placeholder);
            }
        });
    }

    addSkipLinks() {
        if (document.querySelector('.skip-links')) return; // Already exists

        const skipLinks = document.createElement('div');
        skipLinks.className = 'skip-links';
        skipLinks.innerHTML = `
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <a href="#navigation" class="skip-link">Skip to navigation</a>
            <a href="#accessibility-panel" class="skip-link">Accessibility settings</a>
        `;

        document.body.insertBefore(skipLinks, document.body.firstChild);
    }

    // Accessibility feature toggles
    toggleHighContrast() {
        if (this.highContrastMode) {
            this.disableHighContrast();
        } else {
            this.enableHighContrast();
        }
    }

    enableHighContrast() {
        this.highContrastMode = true;
        document.body.classList.add('high-contrast');
        this.announce('High contrast mode enabled');
        this.saveUserPreferences();
    }

    disableHighContrast() {
        this.highContrastMode = false;
        document.body.classList.remove('high-contrast');
        this.announce('High contrast mode disabled');
        this.saveUserPreferences();
    }

    toggleReducedMotion() {
        if (this.reducedMotion) {
            this.disableReducedMotion();
        } else {
            this.enableReducedMotion();
        }
    }

    enableReducedMotion() {
        this.reducedMotion = true;
        document.body.classList.add('reduced-motion');
        this.announce('Reduced motion enabled');
        this.saveUserPreferences();
    }

    disableReducedMotion() {
        this.reducedMotion = false;
        document.body.classList.remove('reduced-motion');
        this.announce('Reduced motion disabled');
        this.saveUserPreferences();
    }

    toggleLargeText() {
        if (this.largeText) {
            this.disableLargeText();
        } else {
            this.enableLargeText();
        }
    }

    enableLargeText() {
        this.largeText = true;
        document.body.classList.add('large-text');
        this.announce('Large text enabled');
        this.saveUserPreferences();
    }

    disableLargeText() {
        this.largeText = false;
        document.body.classList.remove('large-text');
        this.announce('Large text disabled');
        this.saveUserPreferences();
    }

    toggleScreenReader() {
        if (this.screenReaderMode) {
            this.disableScreenReader();
        } else {
            this.enableScreenReader();
        }
    }

    enableScreenReader() {
        this.screenReaderMode = true;
        document.body.classList.add('screen-reader-mode');
        this.announce('Enhanced screen reader mode enabled', true);
        this.saveUserPreferences();
    }

    disableScreenReader() {
        this.screenReaderMode = false;
        document.body.classList.remove('screen-reader-mode');
        this.announce('Enhanced screen reader mode disabled');
        this.saveUserPreferences();
    }

    toggleAccessibilityPanel() {
        const panel = this.accessibilityPanel;
        const isVisible = panel.getAttribute('aria-hidden') === 'false';

        if (isVisible) {
            panel.setAttribute('aria-hidden', 'true');
            panel.style.transform = 'translateX(100%)';
        } else {
            panel.setAttribute('aria-hidden', 'false');
            panel.style.transform = 'translateX(0)';

            // Focus first control
            const firstControl = panel.querySelector('input, button');
            if (firstControl) {
                setTimeout(() => firstControl.focus(), 100);
            }
        }
    }

    // Navigation shortcuts
    navigateToSection(section) {
        const routes = {
            home: '/',
            converter: '/converter',
            training: '/grid-shot-enhanced',
            education: '/education'
        };

        if (routes[section]) {
            window.location.href = routes[section];
        }
    }

    // Test-specific functions
    handleTestPause(e) {
        if (document.getElementById('testArena')?.style.display !== 'none') {
            // Only handle if we're in a test
            e.preventDefault();
            if (window.advancedAimTrainer) {
                window.advancedAimTrainer.pauseTest();
                this.announce(window.advancedAimTrainer.isPaused ? 'Test paused' : 'Test resumed');
            }
        }
    }

    restartTest() {
        if (window.advancedAimTrainer) {
            window.advancedAimTrainer.retryTest();
            this.announce('Test restarted');
        }
    }

    nextTest() {
        if (window.advancedAimTrainer) {
            window.advancedAimTrainer.nextTest();
            this.announce('Moved to next test');
        }
    }

    quitTest() {
        if (window.advancedAimTrainer) {
            window.advancedAimTrainer.exitTest();
            this.announce('Test exited');
        }
    }

    copyResults(e) {
        if (document.getElementById('testResults')?.style.display !== 'none') {
            e.preventDefault();
            if (window.advancedAimTrainer) {
                window.advancedAimTrainer.copyShareText();
            }
        }
    }

    saveResults() {
        if (window.advancedAimTrainer) {
            window.advancedAimTrainer.saveResults();
        }
    }

    shareResults() {
        if (window.advancedAimTrainer) {
            window.advancedAimTrainer.shareResults();
        }
    }

    // Modal and help functions
    toggleHelp() {
        if (window.helpSystem) {
            window.helpSystem.toggle();
        }
    }

    showShortcutsModal() {
        this.createShortcutsModal();
    }

    createShortcutsModal() {
        // Remove existing modal
        const existing = document.querySelector('#shortcuts-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'shortcuts-modal';
        modal.className = 'modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'shortcuts-title');
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
                    <button class="modal-close" aria-label="Close shortcuts modal">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <div class="modal-body shortcuts-list">
                    ${this.generateShortcutsList()}
                </div>

                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
                        Got it!
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Show modal
        setTimeout(() => {
            modal.classList.add('active');
            modal.querySelector('.modal-close').focus();
        }, 10);

        // Close handlers
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
            }
        });
    }

    generateShortcutsList() {
        const categories = {
            'General Navigation': [
                { keys: 'F1', description: 'Open help system' },
                { keys: 'Shift + ?', description: 'Show keyboard shortcuts' },
                { keys: 'Alt + 1', description: 'Navigate to home' },
                { keys: 'Alt + 2', description: 'Navigate to converter' },
                { keys: 'Alt + 3', description: 'Navigate to training' },
                { keys: 'Alt + 4', description: 'Navigate to education' },
            ],
            'Accessibility': [
                { keys: 'Alt + H', description: 'Toggle high contrast mode' },
                { keys: 'Alt + M', description: 'Toggle reduced motion' },
                { keys: 'Alt + T', description: 'Toggle large text' },
                { keys: 'Alt + S', description: 'Toggle screen reader mode' },
                { keys: 'Ctrl + Shift + A', description: 'Toggle accessibility panel' },
            ],
            'Test Controls': [
                { keys: 'Space', description: 'Pause/resume test' },
                { keys: 'R', description: 'Restart current test' },
                { keys: 'N', description: 'Move to next test' },
                { keys: 'Q', description: 'Quit current test' },
            ],
            'Results': [
                { keys: 'Ctrl + C', description: 'Copy results to clipboard' },
                { keys: 'Ctrl + S', description: 'Save results' },
                { keys: 'Ctrl + Shift + S', description: 'Share results' },
            ],
            'Settings': [
                { keys: 'Ctrl + ,', description: 'Open settings' },
                { keys: 'Escape', description: 'Close modal or cancel action' },
            ]
        };

        return Object.entries(categories).map(([category, shortcuts]) => `
            <div class="shortcut-category">
                <h3>${category}</h3>
                <div class="shortcuts-grid">
                    ${shortcuts.map(shortcut => `
                        <div class="shortcut-item">
                            <kbd class="shortcut-keys">${shortcut.keys}</kbd>
                            <span class="shortcut-description">${shortcut.description}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    handleEscape() {
        // Close any open modals
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
            setTimeout(() => {
                if (activeModal.id === 'shortcuts-modal') {
                    activeModal.remove();
                }
            }, 300);
            return;
        }

        // Close accessibility panel if open
        if (this.accessibilityPanel?.getAttribute('aria-hidden') === 'false') {
            this.toggleAccessibilityPanel();
            return;
        }

        // Exit test if running
        if (document.getElementById('testArena')?.style.display !== 'none') {
            this.quitTest();
        }
    }

    handleTabNavigation(e) {
        // Custom tab handling for specific containers
        if (e.target.closest('.custom-focus-container')) {
            e.preventDefault();
            this.focusNextElement();
        }
    }

    handleShiftTabNavigation(e) {
        // Custom shift+tab handling
        if (e.target.closest('.custom-focus-container')) {
            e.preventDefault();
            this.focusPreviousElement();
        }
    }

    handleEnterKey(e) {
        // Custom enter key handling
        const target = e.target;
        if (target.getAttribute('role') === 'button' && !target.disabled) {
            e.preventDefault();
            target.click();
        }
    }

    handleSpaceKey(e) {
        // Handle space key for buttons and custom controls
        const target = e.target;
        if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
            if (!target.disabled) {
                e.preventDefault();
                target.click();
            }
        }
    }

    focusNextElement() {
        this.updateFocusableElements();
        const currentIndex = this.focusableElements.indexOf(document.activeElement);
        const nextIndex = (currentIndex + 1) % this.focusableElements.length;
        this.focusableElements[nextIndex]?.focus();
    }

    focusPreviousElement() {
        this.updateFocusableElements();
        const currentIndex = this.focusableElements.indexOf(document.activeElement);
        const previousIndex = currentIndex <= 0 ? this.focusableElements.length - 1 : currentIndex - 1;
        this.focusableElements[previousIndex]?.focus();
    }

    startFocusTest() {
        this.announce('Starting focus navigation test. Use Tab to move forward, Shift+Tab to move backward.', true);
        const firstFocusable = this.focusableElements[0];
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }

    resetAllSettings() {
        this.disableHighContrast();
        this.disableReducedMotion();
        this.disableLargeText();
        this.disableScreenReader();
        this.announce('All accessibility settings reset to default');

        // Update panel toggles
        if (this.accessibilityPanel) {
            this.accessibilityPanel.querySelector('#high-contrast-toggle').checked = false;
            this.accessibilityPanel.querySelector('#reduced-motion-toggle').checked = false;
            this.accessibilityPanel.querySelector('#large-text-toggle').checked = false;
            this.accessibilityPanel.querySelector('#screen-reader-toggle').checked = false;
        }
    }

    saveUserPreferences() {
        const preferences = {
            highContrast: this.highContrastMode,
            reducedMotion: this.reducedMotion,
            largeText: this.largeText,
            screenReader: this.screenReaderMode
        };

        localStorage.setItem('aimhelper_accessibility', JSON.stringify(preferences));
    }

    loadUserPreferences() {
        const saved = localStorage.getItem('aimhelper_accessibility');
        if (saved) {
            try {
                const preferences = JSON.parse(saved);

                if (preferences.highContrast) this.enableHighContrast();
                if (preferences.reducedMotion) this.enableReducedMotion();
                if (preferences.largeText) this.enableLargeText();
                if (preferences.screenReader) this.enableScreenReader();

                // Update panel toggles
                setTimeout(() => this.updatePanelToggles(), 100);
            } catch (e) {
                console.log('Could not load accessibility preferences');
            }
        }
    }

    updatePanelToggles() {
        if (!this.accessibilityPanel) return;

        this.accessibilityPanel.querySelector('#high-contrast-toggle').checked = this.highContrastMode;
        this.accessibilityPanel.querySelector('#reduced-motion-toggle').checked = this.reducedMotion;
        this.accessibilityPanel.querySelector('#large-text-toggle').checked = this.largeText;
        this.accessibilityPanel.querySelector('#screen-reader-toggle').checked = this.screenReaderMode;
    }
}

// Initialize accessibility manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityManager = new AccessibilityManager();

    // Make it available globally for other scripts
    window.accessibility = window.accessibilityManager;

    // Connect accessibility toggle button if it exists
    const accessibilityToggle = document.getElementById('accessibilityToggle');
    if (accessibilityToggle) {
        accessibilityToggle.addEventListener('click', () => {
            window.accessibilityManager.toggleAccessibilityPanel();
        });
    }
});