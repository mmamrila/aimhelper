// Landing page interactions and animations
document.addEventListener('DOMContentLoaded', function() {
    initAnimations();
    setupEventListeners();
    handleScrollEffects();
});

function initAnimations() {
    // Animate hero elements on load
    const heroElements = document.querySelectorAll('.hero-badge, .hero-title, .hero-subtitle, .hero-stats, .hero-actions, .trust-indicators');
    heroElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        setTimeout(() => {
            el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 100 * index);
    });

    // Animate dashboard mockup
    const mockup = document.querySelector('.dashboard-mockup');
    if (mockup) {
        setTimeout(() => {
            mockup.style.opacity = '0';
            mockup.style.transform = 'rotateY(-20deg) rotateX(10deg) scale(0.8)';
            mockup.style.transition = 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
            
            setTimeout(() => {
                mockup.style.opacity = '1';
                mockup.style.transform = 'rotateY(-10deg) rotateX(5deg) scale(1)';
            }, 500);
        }, 800);
    }

    // Animate bars in the chart
    const bars = document.querySelectorAll('.bar');
    bars.forEach((bar, index) => {
        const height = bar.style.height;
        bar.style.setProperty('--final-height', height);
        bar.style.height = '0';
        setTimeout(() => {
            bar.style.height = height;
        }, 1200 + (index * 100));
    });

    // Stagger floating cards
    const floatingCards = document.querySelectorAll('.floating-card');
    floatingCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px) scale(0.8)';
        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
        }, 1500 + (index * 200));
    });
}

function setupEventListeners() {
    // CTA buttons
    const startButtons = document.querySelectorAll('#startAnalysisBtn, #getStartedBtn, #startNowBtn');
    startButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Add click animation
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = '';
                // Navigate to main app
                window.location.href = '/app';
            }, 150);
        });
    });

    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            showLoginModal();
        });
    }


    // Add hover effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add click effects to step cards
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        step.addEventListener('click', () => {
            // Add ripple effect
            addRippleEffect(step, event);
            
            // Highlight step briefly
            step.style.background = 'rgba(79, 172, 254, 0.1)';
            step.style.borderColor = 'rgba(79, 172, 254, 0.3)';
            
            setTimeout(() => {
                step.style.background = '';
                step.style.borderColor = '';
            }, 1000);
        });
    });
}

function handleScrollEffects() {
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 15, 0.95)';
            navbar.style.backdropFilter = 'blur(25px)';
        } else {
            navbar.style.background = 'rgba(10, 10, 15, 0.9)';
            navbar.style.backdropFilter = 'blur(20px)';
        }

        // Hide/show navbar based on scroll direction
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Special handling for different elements
                if (entry.target.classList.contains('step')) {
                    const steps = document.querySelectorAll('.step');
                    const index = Array.from(steps).indexOf(entry.target);
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 150);
                }
                
                if (entry.target.classList.contains('feature-card')) {
                    const cards = document.querySelectorAll('.feature-card');
                    const index = Array.from(cards).indexOf(entry.target);
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 100);
                }
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const elementsToAnimate = document.querySelectorAll('.step, .feature-card, .section-header');
    elementsToAnimate.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(el);
    });
}

function addRippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: radial-gradient(circle, rgba(79, 172, 254, 0.3) 0%, transparent 70%);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
        z-index: 1;
    `;
    
    element.style.position = 'relative';
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

function showLoginModal() {
    // Create simple login modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 2000;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        border-radius: 20px;
        padding: 40px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        transform: scale(0.9);
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;
    
    modalContent.innerHTML = `
        <h3 style="font-size: 24px; margin-bottom: 16px;">Coming Soon</h3>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">User accounts are currently in development. For now, you can use the app without signing up!</p>
        <button id="closeModal" style="
            background: var(--accent-gradient);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
        ">Got it</button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Animate in
    setTimeout(() => {
        modal.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
    }, 10);
    
    // Close handlers
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    modalContent.querySelector('#closeModal').addEventListener('click', closeModal);
    
    function closeModal() {
        modal.style.opacity = '0';
        modalContent.style.transform = 'scale(0.9)';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}


// Add custom CSS for ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);