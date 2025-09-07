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
    const modal = document.createElement('div');
    modal.id = 'authModal';
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
        background: linear-gradient(135deg, rgba(16, 16, 30, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%);
        border: 1px solid rgba(0, 210, 255, 0.2);
        border-radius: 20px;
        padding: 40px;
        max-width: 420px;
        width: 90%;
        text-align: left;
        transform: scale(0.9);
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    `;
    
    modalContent.innerHTML = `
        <div id="authTabs" style="display: flex; margin-bottom: 30px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <button class="auth-tab active" data-tab="login" style="
                flex: 1; padding: 12px; background: none; border: none; color: #00d2ff; 
                font-weight: 600; cursor: pointer; border-bottom: 2px solid #00d2ff;
                transition: all 0.3s ease;
            ">Sign In</button>
            <button class="auth-tab" data-tab="register" style="
                flex: 1; padding: 12px; background: none; border: none; color: rgba(255,255,255,0.6); 
                font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent;
                transition: all 0.3s ease;
            ">Sign Up</button>
        </div>

        <!-- Login Form -->
        <div id="loginForm" class="auth-form">
            <h3 style="font-size: 24px; margin-bottom: 20px; color: #ffffff;">Welcome Back</h3>
            <form id="loginFormElement">
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: #ffffff; font-weight: 500;">Email or Username</label>
                    <input type="text" id="loginEmailUsername" required style="
                        width: 100%; padding: 12px 16px; border: 2px solid rgba(255,255,255,0.1); 
                        border-radius: 10px; background: rgba(255,255,255,0.05); color: #ffffff;
                        font-size: 16px; transition: all 0.3s ease;
                    ">
                </div>
                <div style="margin-bottom: 25px;">
                    <label style="display: block; margin-bottom: 8px; color: #ffffff; font-weight: 500;">Password</label>
                    <input type="password" id="loginPassword" required style="
                        width: 100%; padding: 12px 16px; border: 2px solid rgba(255,255,255,0.1); 
                        border-radius: 10px; background: rgba(255,255,255,0.05); color: #ffffff;
                        font-size: 16px; transition: all 0.3s ease;
                    ">
                </div>
                <button type="submit" style="
                    width: 100%; background: linear-gradient(45deg, #00d2ff, #3a7bd5); color: white;
                    border: none; padding: 14px; border-radius: 10px; font-size: 16px; font-weight: 600;
                    cursor: pointer; transition: all 0.3s ease; margin-bottom: 15px;
                ">Sign In</button>
            </form>
        </div>

        <!-- Register Form -->
        <div id="registerForm" class="auth-form" style="display: none;">
            <h3 style="font-size: 24px; margin-bottom: 20px; color: #ffffff;">Create Account</h3>
            <form id="registerFormElement">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; color: #ffffff; font-weight: 500;">Username</label>
                    <input type="text" id="registerUsername" required style="
                        width: 100%; padding: 12px 16px; border: 2px solid rgba(255,255,255,0.1); 
                        border-radius: 10px; background: rgba(255,255,255,0.05); color: #ffffff;
                        font-size: 16px; transition: all 0.3s ease;
                    ">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; color: #ffffff; font-weight: 500;">Email</label>
                    <input type="email" id="registerEmail" required style="
                        width: 100%; padding: 12px 16px; border: 2px solid rgba(255,255,255,0.1); 
                        border-radius: 10px; background: rgba(255,255,255,0.05); color: #ffffff;
                        font-size: 16px; transition: all 0.3s ease;
                    ">
                </div>
                <div style="margin-bottom: 25px;">
                    <label style="display: block; margin-bottom: 8px; color: #ffffff; font-weight: 500;">Password</label>
                    <input type="password" id="registerPassword" required minlength="6" style="
                        width: 100%; padding: 12px 16px; border: 2px solid rgba(255,255,255,0.1); 
                        border-radius: 10px; background: rgba(255,255,255,0.05); color: #ffffff;
                        font-size: 16px; transition: all 0.3s ease;
                    ">
                    <small style="color: rgba(255,255,255,0.6); font-size: 14px;">Minimum 6 characters</small>
                </div>
                <button type="submit" style="
                    width: 100%; background: linear-gradient(45deg, #4caf50, #66bb6a); color: white;
                    border: none; padding: 14px; border-radius: 10px; font-size: 16px; font-weight: 600;
                    cursor: pointer; transition: all 0.3s ease; margin-bottom: 15px;
                ">Create Account</button>
            </form>
        </div>

        <div id="authError" style="
            background: rgba(244, 67, 54, 0.1); border: 1px solid rgba(244, 67, 54, 0.3);
            color: #f44336; padding: 12px; border-radius: 8px; margin-bottom: 20px;
            display: none; font-size: 14px;
        "></div>

        <button id="closeAuthModal" style="
            position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.1);
            border: none; color: rgba(255,255,255,0.6); width: 30px; height: 30px;
            border-radius: 50%; cursor: pointer; font-size: 18px;
            transition: all 0.3s ease;
        ">×</button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Setup auth functionality
    setupAuthModal();
    
    // Animate in
    setTimeout(() => {
        modal.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
    }, 10);
    
    function closeModal() {
        modal.style.opacity = '0';
        modalContent.style.transform = 'scale(0.9)';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
    
    // Close handlers
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    document.getElementById('closeAuthModal').addEventListener('click', closeModal);
}

function setupAuthModal() {
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const targetTab = e.target.dataset.tab;
            
            // Update active tab
            document.querySelectorAll('.auth-tab').forEach(t => {
                t.classList.remove('active');
                t.style.color = 'rgba(255,255,255,0.6)';
                t.style.borderBottomColor = 'transparent';
            });
            
            e.target.classList.add('active');
            e.target.style.color = '#00d2ff';
            e.target.style.borderBottomColor = '#00d2ff';
            
            // Show/hide forms
            document.querySelectorAll('.auth-form').forEach(form => {
                form.style.display = 'none';
            });
            document.getElementById(targetTab + 'Form').style.display = 'block';
            
            // Clear error
            document.getElementById('authError').style.display = 'none';
        });
    });
    
    // Form submissions
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    document.getElementById('registerFormElement').addEventListener('submit', handleRegister);
    
    // Input focus effects
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('focus', (e) => {
            e.target.style.borderColor = '#00d2ff';
            e.target.style.background = 'rgba(0, 210, 255, 0.1)';
        });
        
        input.addEventListener('blur', (e) => {
            e.target.style.borderColor = 'rgba(255,255,255,0.1)';
            e.target.style.background = 'rgba(255,255,255,0.05)';
        });
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    const emailOrUsername = document.getElementById('loginEmailUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('authError');
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ emailOrUsername, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success - close modal and update UI
            document.getElementById('authModal').remove();
            updateUIForAuthenticatedUser(data);
            showSuccessMessage('Welcome back! You\'re now signed in.');
        } else {
            // Show error
            errorDiv.textContent = data.error;
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const errorDiv = document.getElementById('authError');
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success - close modal and update UI
            document.getElementById('authModal').remove();
            updateUIForAuthenticatedUser(data);
            showSuccessMessage('Account created successfully! Welcome to AimHelper Pro.');
        } else {
            // Show error
            errorDiv.textContent = data.error;
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    }
}

function updateUIForAuthenticatedUser(user) {
    // Update navbar
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.textContent = user.username;
        loginBtn.onclick = showUserMenu;
    }
    
    // Store user info globally
    window.currentUser = user;
}

function showUserMenu() {
    // Simple user menu for now
    const menu = document.createElement('div');
    menu.style.cssText = `
        position: fixed;
        top: 60px;
        right: 20px;
        background: rgba(16, 16, 30, 0.95);
        border: 1px solid rgba(0, 210, 255, 0.2);
        border-radius: 10px;
        padding: 15px;
        z-index: 1000;
        min-width: 200px;
    `;
    
    menu.innerHTML = `
        <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div style="font-weight: 600; color: #00d2ff;">${window.currentUser.username}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.6);">${window.currentUser.email}</div>
        </div>
        <div style="margin-bottom: 8px;">
            <a href="/app" style="color: #ffffff; text-decoration: none; display: block; padding: 8px 0;">Dashboard</a>
        </div>
        <div style="margin-bottom: 8px;">
            <button onclick="handleLogout()" style="
                background: none; border: none; color: #ff6b6b; cursor: pointer;
                padding: 8px 0; width: 100%; text-align: left;
            ">Sign Out</button>
        </div>
    `;
    
    document.body.appendChild(menu);
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 10);
}

async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            // Reset UI
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.textContent = 'Sign In';
                loginBtn.onclick = showLoginModal;
            }
            
            window.currentUser = null;
            
            // Remove any open menus
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
    
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);