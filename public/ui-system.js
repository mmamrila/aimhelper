/**
 * AimHelper Pro - UI System
 * Loading states, notifications, tooltips, and interactive feedback
 */

class UISystem {
    constructor() {
        this.notifications = [];
        this.tooltips = new Map();
        this.loadingStates = new Set();

        this.initializeUISystem();
        this.setupGlobalEventListeners();
        this.initializeIntersectionObserver();
    }

    initializeUISystem() {
        // Create notification container
        this.createNotificationContainer();

        // Create loading overlay
        this.createLoadingOverlay();

        // Initialize tooltips
        this.initializeTooltips();

        // Add UI enhancements CSS
        this.loadUIEnhancements();
    }

    createNotificationContainer() {
        if (document.getElementById('notificationContainer')) return;

        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        container.innerHTML = '';

        const style = document.createElement('style');
        style.textContent = `
            .notification-container {
                position: fixed;
                top: var(--space-4);
                right: var(--space-4);
                z-index: 10000;
                pointer-events: none;
            }

            .notification {
                background: var(--bg-card-elevated);
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-lg);
                padding: var(--space-4);
                margin-bottom: var(--space-2);
                min-width: 300px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                transform: translateX(400px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: auto;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }

            .notification.show {
                transform: translateX(0);
            }

            .notification.success {
                border-left: 4px solid var(--brand-secondary);
            }

            .notification.error {
                border-left: 4px solid var(--brand-accent);
            }

            .notification.warning {
                border-left: 4px solid #ffc107;
            }

            .notification.info {
                border-left: 4px solid var(--brand-primary);
            }

            .notification-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: var(--space-2);
            }

            .notification-title {
                font-weight: var(--font-weight-semibold);
                color: var(--text-primary);
                display: flex;
                align-items: center;
                gap: var(--space-2);
            }

            .notification-close {
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                padding: var(--space-1);
                border-radius: var(--radius-base);
                transition: all 0.2s ease;
            }

            .notification-close:hover {
                background: var(--bg-hover);
                color: var(--text-primary);
            }

            .notification-message {
                color: var(--text-secondary);
                font-size: var(--font-size-sm);
                line-height: 1.4;
            }

            .notification-actions {
                display: flex;
                gap: var(--space-2);
                margin-top: var(--space-3);
            }

            .notification-btn {
                padding: var(--space-1) var(--space-3);
                border: 1px solid var(--border-primary);
                background: var(--bg-secondary);
                color: var(--text-primary);
                border-radius: var(--radius-base);
                cursor: pointer;
                font-size: var(--font-size-sm);
                transition: all 0.2s ease;
            }

            .notification-btn:hover {
                background: var(--bg-hover);
            }

            .notification-btn.primary {
                background: var(--brand-primary);
                color: white;
                border-color: var(--brand-primary);
            }

            @media (max-width: 480px) {
                .notification-container {
                    top: var(--space-2);
                    right: var(--space-2);
                    left: var(--space-2);
                }

                .notification {
                    min-width: auto;
                    transform: translateY(-100px);
                }

                .notification.show {
                    transform: translateY(0);
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(container);
    }

    createLoadingOverlay() {
        if (document.getElementById('loadingOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.style.display = 'none';

        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading...</div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
                -webkit-backdrop-filter: blur(5px);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .loading-overlay.show {
                opacity: 1;
            }

            .loading-content {
                text-align: center;
                color: white;
            }

            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-top: 3px solid var(--brand-primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto var(--space-4) auto;
            }

            .loading-text {
                font-size: var(--font-size-lg);
                font-weight: var(--font-weight-medium);
                animation: pulse 1.5s ease-in-out infinite;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(overlay);
    }

    loadUIEnhancements() {
        // Load the UI enhancements CSS if not already loaded
        if (!document.querySelector('link[href*="ui-enhancements.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'ui-enhancements.css';
            document.head.appendChild(link);
        }
    }

    // Notification System
    showNotification(options) {
        const {
            type = 'info',
            title,
            message,
            duration = 5000,
            actions = [],
            persistent = false
        } = options;

        const id = 'notification_' + Date.now();
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.id = id;

        const iconMap = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <div class="notification-header">
                <div class="notification-title">
                    <span>${iconMap[type]}</span>
                    <span>${title}</span>
                </div>
                <button class="notification-close" onclick="uiSystem.closeNotification('${id}')">
                    ✕
                </button>
            </div>
            ${message ? `<div class="notification-message">${message}</div>` : ''}
            ${actions.length > 0 ? `
                <div class="notification-actions">
                    ${actions.map(action => `
                        <button class="notification-btn ${action.primary ? 'primary' : ''}"
                                onclick="${action.onclick}">
                            ${action.text}
                        </button>
                    `).join('')}
                </div>
            ` : ''}
        `;

        const container = document.getElementById('notificationContainer');
        container.appendChild(notification);

        // Trigger show animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto-remove if not persistent
        if (!persistent && duration > 0) {
            setTimeout(() => this.closeNotification(id), duration);
        }

        this.notifications.push({ id, element: notification, persistent });

        return id;
    }

    closeNotification(id) {
        const notification = document.getElementById(id);
        if (!notification) return;

        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
            this.notifications = this.notifications.filter(n => n.id !== id);
        }, 300);
    }

    // Loading System
    showLoading(text = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = overlay.querySelector('.loading-text');

        if (loadingText) loadingText.textContent = text;

        overlay.style.display = 'flex';
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.remove('show');
        setTimeout(() => overlay.style.display = 'none', 300);
    }

    // Element Loading States
    setElementLoading(element, loading = true) {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }

        if (!element) return;

        if (loading) {
            element.classList.add('loading-state');
            this.loadingStates.add(element);
        } else {
            element.classList.remove('loading-state');
            this.loadingStates.delete(element);
        }
    }

    // Tooltip System
    initializeTooltips() {
        this.updateTooltips();
    }

    updateTooltips() {
        // Find all elements with data-tooltip attribute
        const tooltipElements = document.querySelectorAll('[data-tooltip]');

        tooltipElements.forEach(element => {
            if (!this.tooltips.has(element)) {
                element.classList.add('tooltip');
                this.tooltips.set(element, element.getAttribute('data-tooltip'));
            }
        });
    }

    addTooltip(element, text) {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }

        if (!element) return;

        element.setAttribute('data-tooltip', text);
        element.classList.add('tooltip');
        this.tooltips.set(element, text);
    }

    removeTooltip(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }

        if (!element) return;

        element.removeAttribute('data-tooltip');
        element.classList.remove('tooltip');
        this.tooltips.delete(element);
    }

    // Animation System
    animateElement(element, animation = 'fadeInScale', delay = 0) {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }

        if (!element) return;

        element.style.animationDelay = delay + 'ms';
        element.style.animation = `${animation} 0.6s ease-out`;
    }

    staggerAnimate(selector, animation = 'slideInUp', baseDelay = 100) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element, index) => {
            this.animateElement(element, animation, index * baseDelay);
        });
    }

    // Intersection Observer for scroll animations
    initializeIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');

                    // Stagger child animations if requested
                    if (entry.target.hasAttribute('data-stagger')) {
                        const children = entry.target.children;
                        Array.from(children).forEach((child, index) => {
                            child.style.animationDelay = (index * 100) + 'ms';
                        });
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        // Observe elements with animate class
        const animateElements = document.querySelectorAll('.animate-on-scroll');
        animateElements.forEach(el => observer.observe(el));
    }

    // Global Event Listeners
    setupGlobalEventListeners() {
        // Enhanced button feedback
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn')) {
                this.createRippleEffect(e.target, e);
            }
        });

        // Enhanced form interactions
        document.addEventListener('input', (e) => {
            if (e.target.matches('.converter-input, .converter-select')) {
                this.handleInputChange(e.target);
            }
        });

        // Keyboard navigation improvements
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // Update tooltips when DOM changes
        const observer = new MutationObserver(() => {
            this.updateTooltips();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-tooltip']
        });
    }

    createRippleEffect(button, event) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;

        if (!document.head.querySelector('style[data-ripple]')) {
            style.setAttribute('data-ripple', '');
            document.head.appendChild(style);
        }

        button.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    handleInputChange(input) {
        const group = input.closest('.converter-input-group');
        if (group) {
            if (input.value) {
                group.classList.add('filled');
            } else {
                group.classList.remove('filled');
            }
        }
    }

    handleKeyboardNavigation(e) {
        // Enhanced keyboard shortcuts will be handled here
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'k':
                    e.preventDefault();
                    // Future: Open command palette
                    break;
            }
        }
    }

    // Utility Methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let lastFunc;
        let lastRan;
        return function() {
            const context = this;
            const args = arguments;
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function() {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }

    // Success/Error Helpers
    showSuccess(title, message, actions) {
        return this.showNotification({
            type: 'success',
            title,
            message,
            actions
        });
    }

    showError(title, message, actions) {
        return this.showNotification({
            type: 'error',
            title,
            message,
            persistent: true,
            actions
        });
    }

    showWarning(title, message, actions) {
        return this.showNotification({
            type: 'warning',
            title,
            message,
            actions
        });
    }

    showInfo(title, message, actions) {
        return this.showNotification({
            type: 'info',
            title,
            message,
            actions
        });
    }
}

// Global UI System Instance
const uiSystem = new UISystem();

// Make it available globally
window.uiSystem = uiSystem;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add animate-on-scroll class to elements that should animate in
    const animateElements = document.querySelectorAll(`
        .converter-card,
        .analytics-card,
        .metric-card,
        .stat-card,
        .pricing-card,
        .community-feed,
        .discord-section,
        .challenges-section
    `);

    animateElements.forEach(el => {
        el.classList.add('animate-on-scroll');
    });

    // Add stagger animation to grids
    const gridElements = document.querySelectorAll(`
        .metrics-grid,
        .stats-grid,
        .pricing-grid,
        .analytics-grid
    `);

    gridElements.forEach(el => {
        el.setAttribute('data-stagger', 'true');
    });
});