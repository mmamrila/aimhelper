function updateCalculator() {
    const dpi = parseFloat(document.getElementById('dpiInput').value) || 800;
    const sens = parseFloat(document.getElementById('sensInput').value) || 1.0;
    
    const edpi = dpi * sens;
    const cm360 = (360 / edpi) * 2.54;
    
    document.getElementById('edpiResult').textContent = Math.round(edpi);
    document.getElementById('cm360Result').textContent = cm360.toFixed(1) + ' cm';
    
    let category = 'Medium';
    if (cm360 < 25) {
        category = 'High';
    } else if (cm360 > 35) {
        category = 'Low';
    }
    
    document.getElementById('categoryResult').textContent = category;
    
    // Update result item colors based on category
    const categoryElement = document.getElementById('categoryResult');
    categoryElement.className = 'result-value category-' + category.toLowerCase();
}

function goBack() {
    // Check if we came from a specific page
    const referrer = document.referrer;
    if (referrer && referrer.includes(window.location.origin)) {
        window.history.back();
    } else {
        window.location.href = '/app';
    }
}

// Smooth scroll to sections
function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({
        behavior: 'smooth'
    });
}

// Add interactive animations
function addInteractiveAnimations() {
    // Animate concept cards on scroll
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
    
    // Observe all concept cards and tip cards
    const animatedElements = document.querySelectorAll('.concept-card, .tip-card, .range-item, .mistake-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Add hover effects to concept cards
function addHoverEffects() {
    const conceptCards = document.querySelectorAll('.concept-card');
    
    conceptCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Progressive content loading
function loadProgressiveContent() {
    const sections = document.querySelectorAll('.education-section');
    
    sections.forEach((section, index) => {
        setTimeout(() => {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, index * 150);
    });
}

window.addEventListener('load', function() {
    // Initialize calculator
    updateCalculator();
    
    // Add event listeners
    document.getElementById('backBtn').addEventListener('click', goBack);
    document.getElementById('dpiInput').addEventListener('input', updateCalculator);
    document.getElementById('sensInput').addEventListener('input', updateCalculator);
    
    // Add interactive animations
    setTimeout(() => {
        addInteractiveAnimations();
        addHoverEffects();
        loadProgressiveContent();
    }, 100);
    
    // Initial content setup
    const sections = document.querySelectorAll('.education-section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    });
});