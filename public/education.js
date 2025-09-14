/**
 * AimHelper Pro - Education Page Interactive Features
 */

function updateCalculator() {
    const dpi = parseFloat(document.getElementById('dpiInput').value) || 800;
    const sens = parseFloat(document.getElementById('sensInput').value) || 1.0;

    // Calculate values
    const edpi = dpi * sens;
    // Gaming sensitivity formula with proper scaling factor
    // Based on research: 800 DPI × 1.0 sens should ≈ 30cm/360 (12 inches/360)
    // Reverse engineering: 30 = K / 800, so K = 24000
    // This suggests the formula is: cm/360 = 24000 / eDPI
    // Converting to inches: inches/360 = (24000 / eDPI) / 2.54
    const in360 = 24000 / edpi / 2.54;

    // Update display values
    const edpiElement = document.getElementById('edpiResult');
    const in360Element = document.getElementById('in360Result');
    const categoryElement = document.getElementById('categoryResult');

    if (edpiElement) edpiElement.textContent = Math.round(edpi);
    if (in360Element) in360Element.textContent = in360.toFixed(1) + ' in';

    // Determine category based on inches (corrected logic)
    let category = 'Medium';
    if (in360 <= 10) {
        category = 'High';    // Less distance = higher sensitivity
    } else if (in360 >= 14) {
        category = 'Low';     // More distance = lower sensitivity
    }

    // Update category display
    if (categoryElement) {
        categoryElement.textContent = category;
    }

    // Update result card styling based on category
    const featuredCard = document.querySelector('.result-card.featured');
    if (featuredCard) {
        // Remove existing category classes
        featuredCard.classList.remove('high-sens', 'medium-sens', 'low-sens');

        // Add appropriate category class for styling
        if (category === 'High') {
            featuredCard.classList.add('high-sens');
        } else if (category === 'Low') {
            featuredCard.classList.add('low-sens');
        } else {
            featuredCard.classList.add('medium-sens');
        }
    }

    // Debug logging (can be removed in production)
    console.log(`DPI: ${dpi}, Sens: ${sens}, eDPI: ${edpi}, in/360: ${in360.toFixed(1)}, Category: ${category}`);
}

// Smooth scroll to sections
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Add interactive animations
function addScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe content sections for scroll animations
    const animatedElements = document.querySelectorAll('.content-section, .card, .range-card, .tip-card, .mistake-card');
    animatedElements.forEach((el, index) => {
        // Initial state
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;

        // Observe for animation
        observer.observe(el);
    });
}

// Add hover effects to interactive elements
function addHoverEffects() {
    // Range cards hover effects
    const rangeCards = document.querySelectorAll('.range-card');
    rangeCards.forEach(card => {
        const originalTransform = card.style.transform;

        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
            this.style.transition = 'transform 0.3s ease';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = originalTransform || 'translateY(0)';
        });
    });

    // Tip cards hover effects
    const tipCards = document.querySelectorAll('.tip-card');
    tipCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.02)';
            this.style.transition = 'transform 0.2s ease';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add subtle pulse effect to step numbers
    const stepNumbers = document.querySelectorAll('.step-number');
    stepNumbers.forEach((step, index) => {
        step.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
            this.style.transition = 'transform 0.2s ease';
        });

        step.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// Initialize progressive content loading
function initProgressiveLoading() {
    const sections = document.querySelectorAll('.content-section');

    sections.forEach((section, index) => {
        setTimeout(() => {
            section.classList.add('loaded');
        }, index * 200);
    });
}

// Add input validation and feedback
function addInputValidation() {
    const dpiInput = document.getElementById('dpiInput');
    const sensInput = document.getElementById('sensInput');

    function validateInput(input, min, max) {
        const value = parseFloat(input.value);
        if (value < min || value > max || isNaN(value)) {
            input.style.borderColor = 'var(--brand-accent)';
            return false;
        } else {
            input.style.borderColor = 'var(--current-category-color, var(--border-focus))';
            return true;
        }
    }

    dpiInput.addEventListener('blur', () => validateInput(dpiInput, 100, 10000));
    sensInput.addEventListener('blur', () => validateInput(sensInput, 0.01, 10));
}

// Add keyboard navigation support
function addKeyboardSupport() {
    document.addEventListener('keydown', (e) => {
        // Press 'c' to focus calculator
        if (e.key === 'c' && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const calculatorSection = document.querySelector('.calculator-card');
            if (calculatorSection && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                e.preventDefault();
                calculatorSection.scrollIntoView({ behavior: 'smooth' });
                document.getElementById('dpiInput').focus();
            }
        }
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing calculator...');

    // Add calculator event listeners first
    const dpiInput = document.getElementById('dpiInput');
    const sensInput = document.getElementById('sensInput');

    if (dpiInput && sensInput) {
        console.log('Calculator inputs found, adding event listeners...');

        dpiInput.addEventListener('input', function() {
            console.log('DPI input changed:', this.value);
            updateCalculator();
        });

        sensInput.addEventListener('input', function() {
            console.log('Sensitivity input changed:', this.value);
            updateCalculator();
        });

        // Add input validation
        addInputValidation();

        // Initialize calculator with default values
        setTimeout(() => {
            console.log('Running initial calculator update...');
            updateCalculator();
        }, 100);
    } else {
        console.error('Calculator inputs not found!', {
            dpiInput: dpiInput,
            sensInput: sensInput
        });
    }

    // Initialize interactive features
    setTimeout(() => {
        addScrollAnimations();
        addHoverEffects();
        addKeyboardSupport();
        initProgressiveLoading();
    }, 100);

    // Add smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });

    // Add copy functionality to calculator results
    const resultCards = document.querySelectorAll('.result-card');
    resultCards.forEach(card => {
        card.addEventListener('click', function() {
            const value = this.querySelector('.result-value').textContent;
            const label = this.querySelector('.result-label').textContent;

            if (navigator.clipboard) {
                navigator.clipboard.writeText(`${label}: ${value}`).then(() => {
                    // Visual feedback
                    const originalBorder = this.style.borderColor;
                    this.style.borderColor = 'var(--brand-secondary)';
                    this.style.transition = 'border-color 0.3s ease';

                    setTimeout(() => {
                        this.style.borderColor = originalBorder;
                    }, 1000);
                });
            }
        });
    });
});