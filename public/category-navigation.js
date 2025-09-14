/**
 * AimHelper Pro - Page Category Navigation System
 * Automatically manages active navigation states and page categorization
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get current page path
    const currentPath = window.location.pathname;

    // Define page categories and their corresponding navigation items
    const pageCategories = {
        // Home pages
        '/': { category: 'home', navItem: 'home' },
        '/index.html': { category: 'home', navItem: 'home' },
        '/landing.html': { category: 'home', navItem: 'home' },

        // Authentication pages
        '/login.html': { category: 'auth', navItem: 'login' },
        '/register.html': { category: 'auth', navItem: 'register' },
        '/forgot-password.html': { category: 'auth', navItem: 'login' },
        '/reset-password.html': { category: 'auth', navItem: 'login' },

        // Test/Training pages
        '/grid-shot.html': { category: 'test', navItem: 'tests' },
        '/flick-test.html': { category: 'test', navItem: 'tests' },
        '/circle-tracking.html': { category: 'test', navItem: 'tests' },
        '/consistency-test.html': { category: 'test', navItem: 'tests' },
        '/test-interface.html': { category: 'test', navItem: 'tests' },
        '/valorant-crosshair-test.html': { category: 'test', navItem: 'tests' },
        '/apex-tracking-test.html': { category: 'test', navItem: 'tests' },

        // Information pages
        '/features.html': { category: 'info', navItem: 'features' },
        '/education.html': { category: 'info', navItem: 'education' },
        '/help.html': { category: 'info', navItem: 'help' },
        '/docs.html': { category: 'info', navItem: 'docs' },
        '/contact.html': { category: 'info', navItem: 'contact' },
        '/how-it-works.html': { category: 'info', navItem: 'features' },

        // Dashboard/User pages
        '/dashboard.html': { category: 'dashboard', navItem: 'dashboard' },
        '/results.html': { category: 'dashboard', navItem: 'dashboard' }
    };

    // Get page configuration
    const pageConfig = pageCategories[currentPath] || { category: 'home', navItem: 'home' };

    // Apply category class to body if not already present
    if (!document.body.className.includes('page-category-')) {
        document.body.classList.add(`page-category-${pageConfig.category}`);
    }

    // Set active navigation state
    setActiveNavigation(pageConfig.navItem);

    // Add breadcrumb if not present
    addBreadcrumbIfNeeded(pageConfig);
});

function setActiveNavigation(activeItem) {
    // Remove existing active states
    document.querySelectorAll('.nav-btn.active').forEach(btn => {
        btn.classList.remove('active');
    });

    // Navigation item mapping
    const navSelectors = {
        'home': 'a[href="/"], a[href="index.html"]',
        'features': 'a[href="/features"], a[href="features.html"]',
        'education': 'a[href="/education"], a[href="education.html"]',
        'login': 'a[href="/login"], a[href="login.html"]',
        'register': 'a[href="/register"], a[href="register.html"]',
        'dashboard': 'a[href="/dashboard"], a[href="dashboard.html"]',
        'tests': '.nav-btn' // Will be handled specially for test pages
    };

    // Set active state
    if (navSelectors[activeItem]) {
        if (activeItem === 'tests') {
            // For test pages, we might want to highlight a general "Tests" nav item if it exists
            // For now, we'll just ensure the styling is applied via CSS
            return;
        }

        const navItem = document.querySelector(navSelectors[activeItem]);
        if (navItem) {
            navItem.classList.add('active');
        }
    }
}

function addBreadcrumbIfNeeded(pageConfig) {
    // Check if breadcrumb already exists
    if (document.querySelector('.page-breadcrumb')) {
        return;
    }

    // Don't add breadcrumb to certain pages
    const skipBreadcrumb = ['/login.html', '/register.html', '/forgot-password.html', '/reset-password.html'];
    if (skipBreadcrumb.includes(window.location.pathname)) {
        return;
    }

    // Category icons
    const categoryIcons = {
        'home': '🏠',
        'auth': '🔐',
        'test': '🎯',
        'info': '📚',
        'dashboard': '📊'
    };

    // Page names
    const pageNames = {
        '/': 'Home',
        '/features.html': 'Features',
        '/education.html': 'Education',
        '/help.html': 'Help',
        '/docs.html': 'Documentation',
        '/contact.html': 'Contact',
        '/dashboard.html': 'Dashboard',
        '/results.html': 'Results',
        '/grid-shot.html': 'Grid Shot Test',
        '/flick-test.html': 'Flick Test',
        '/circle-tracking.html': 'Circle Tracking',
        '/consistency-test.html': 'Consistency Test'
    };

    const pageName = pageNames[window.location.pathname] || 'Page';
    const icon = categoryIcons[pageConfig.category] || '📄';

    // Create breadcrumb
    const breadcrumb = document.createElement('div');
    breadcrumb.className = 'page-breadcrumb';
    breadcrumb.innerHTML = `
        <span class="category-icon">${icon}</span>
        <span class="page-breadcrumb-current">${pageName}</span>
    `;

    // Insert breadcrumb
    const container = document.querySelector('.container');
    if (container) {
        const firstChild = container.firstElementChild;
        if (firstChild && !firstChild.classList.contains('page-breadcrumb')) {
            container.insertBefore(breadcrumb, firstChild);
        }
    }
}