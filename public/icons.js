/**
 * AimHelper Pro - Professional Icon System
 * Modern SVG icons to replace emoji navigation
 */

const ICONS = {
    home: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>`,

    converter: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
    </svg>`,

    education: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>`,

    analytics: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>`,

    community: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="m22 21-3-3m0 0-3-3m3 3 3-3m-3 3-3 3"/>
    </svg>`,

    profile: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
    </svg>`,

    pricing: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>`,

    login: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m15 3 4 4-4 4"/>
        <path d="M19 7H8"/>
        <path d="M7 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2"/>
    </svg>`,

    target: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
    </svg>`,

    settings: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>`,

    star: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>`,

    lightning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
    </svg>`,

    trophy: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/>
        <path d="M10 14.66V17c0 .55.47.98.97 1.21C12.15 18.75 13 19.24 14 19.24v0c1 0 1.85-.49 2.03-1.03.5-.23.97-.66.97-1.21v-2.34c0-1.06-.93-2.11-2.03-2.21-1-.1-1.97-.44-3.97-.44s-2.97.34-3.97.44C6.93 12.55 6 13.6 6 14.66v0"/>
        <path d="M18 6H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"/>
    </svg>`
};

class IconSystem {
    static render(iconName, className = '') {
        const icon = ICONS[iconName];
        if (!icon) {
            console.warn(`Icon "${iconName}" not found`);
            return '';
        }

        return `<span class="icon ${className}">${icon}</span>`;
    }

    static init() {
        // Add icon styles
        const style = document.createElement('style');
        style.textContent = `
            .icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                transition: var(--transition-all);
            }

            .icon svg {
                transition: inherit;
            }

            .icon:hover svg {
                transform: scale(1.1);
            }

            .nav-icon {
                width: 20px;
                height: 20px;
            }

            .nav-icon svg {
                width: 100%;
                height: 100%;
            }
        `;
        document.head.appendChild(style);
    }

    static updateNavigation() {
        // Update navigation buttons with proper icons
        const navMapping = {
            'Home': 'home',
            'Converter': 'converter',
            'Learn': 'education',
            'Analytics': 'analytics',
            'Community': 'community',
            'Profile': 'profile',
            'Pricing': 'pricing',
            'Sign In': 'login'
        };

        document.querySelectorAll('.nav-btn').forEach(btn => {
            const text = btn.textContent.trim();

            for (const [label, iconName] of Object.entries(navMapping)) {
                if (text.includes(label)) {
                    btn.innerHTML = `${this.render(iconName, 'nav-icon')} ${label}`;
                    break;
                }
            }
        });

        // Update logo
        const navLogo = document.querySelector('.nav-logo');
        if (navLogo) {
            navLogo.innerHTML = this.render('lightning');
        }

        // Update breadcrumb icons
        const categoryIcon = document.querySelector('.category-icon');
        if (categoryIcon) {
            const breadcrumbText = document.querySelector('.page-breadcrumb-current')?.textContent;
            if (breadcrumbText) {
                if (breadcrumbText.includes('Home')) {
                    categoryIcon.innerHTML = this.render('home');
                } else if (breadcrumbText.includes('Converter')) {
                    categoryIcon.innerHTML = this.render('converter');
                } else if (breadcrumbText.includes('Education') || breadcrumbText.includes('Learn')) {
                    categoryIcon.innerHTML = this.render('education');
                } else if (breadcrumbText.includes('Analytics')) {
                    categoryIcon.innerHTML = this.render('analytics');
                }
            }
        }

        // Update header badge icon
        const headerBadge = document.querySelector('.header-badge .icon');
        if (headerBadge) {
            headerBadge.innerHTML = this.render('target');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    IconSystem.init();
    IconSystem.updateNavigation();
});

// Export for use in other modules
window.IconSystem = IconSystem;
window.ICONS = ICONS;