/**
 * AimHelper Pro - Pricing & Subscription Management
 * Handles plan selection, upgrades, and trial management
 */

class PricingManager {
    constructor() {
        this.currentPlan = localStorage.getItem('aimhelper_plan') || 'free';
        this.trialStartDate = localStorage.getItem('aimhelper_trial_start');
        this.subscriptionActive = localStorage.getItem('aimhelper_subscription') === 'true';

        this.initializePricing();
    }

    initializePricing() {
        this.updatePlanStatus();
        this.checkTrialStatus();
    }

    updatePlanStatus() {
        // Update UI based on current plan
        const planCards = document.querySelectorAll('.pricing-card');
        planCards.forEach(card => {
            const planName = card.querySelector('.plan-name').textContent.toLowerCase();
            if (planName.includes(this.currentPlan)) {
                card.classList.add('current-plan');
                const cta = card.querySelector('.plan-cta');
                if (cta) {
                    cta.textContent = 'Current Plan';
                    cta.disabled = true;
                }
            }
        });
    }

    checkTrialStatus() {
        if (this.trialStartDate) {
            const trialStart = new Date(this.trialStartDate);
            const now = new Date();
            const daysSinceStart = (now - trialStart) / (1000 * 60 * 60 * 24);

            if (daysSinceStart > 7) {
                // Trial expired
                if (!this.subscriptionActive) {
                    this.downgradeToPlan('free');
                    this.showTrialExpiredModal();
                }
            }
        }
    }

    startFreeTrial() {
        if (this.currentPlan !== 'free') {
            alert('You already have an active plan!');
            return;
        }

        // Check if user already used trial
        const hasUsedTrial = localStorage.getItem('aimhelper_trial_used') === 'true';
        if (hasUsedTrial) {
            alert('You have already used your free trial. Please purchase a subscription to continue.');
            return;
        }

        // Start trial
        this.upgradeToPlan('pro');
        localStorage.setItem('aimhelper_trial_start', new Date().toISOString());
        localStorage.setItem('aimhelper_trial_used', 'true');

        alert('🎉 Welcome to your 7-day Pro trial! Enjoy unlimited access to all features.');
        window.location.href = '/profile';
    }

    upgradeToPro() {
        if (this.currentPlan === 'pro') {
            alert('You are already on the Pro plan!');
            return;
        }

        // Check if trial is available
        const hasUsedTrial = localStorage.getItem('aimhelper_trial_used') === 'true';

        if (!hasUsedTrial) {
            this.startFreeTrial();
        } else {
            // Direct to payment (simulated)
            this.showPaymentModal('pro');
        }
    }


    upgradeToPlan(plan) {
        const previousPlan = this.currentPlan;
        this.currentPlan = plan;
        localStorage.setItem('aimhelper_plan', plan);

        // Trigger plan change event
        this.onPlanChanged(previousPlan, plan);
    }

    downgradeToPlan(plan) {
        const previousPlan = this.currentPlan;
        this.currentPlan = plan;
        localStorage.setItem('aimhelper_plan', plan);
        localStorage.removeItem('aimhelper_trial_start');

        this.onPlanChanged(previousPlan, plan);
    }

    onPlanChanged(oldPlan, newPlan) {
        // Update UI
        this.updatePlanStatus();

        // Show plan change notification
        this.showPlanChangeNotification(oldPlan, newPlan);

        // Update feature access throughout the app
        this.updateFeatureAccess(newPlan);
    }

    updateFeatureAccess(plan) {
        // Store feature access in localStorage for other pages to check
        const features = this.getPlanFeatures(plan);
        localStorage.setItem('aimhelper_features', JSON.stringify(features));
    }

    getPlanFeatures(plan) {
        const features = {
            free: {
                testsPerDay: 3,
                testTypes: ['gridshot'],
                analytics: 'basic',
                heatmaps: false,
                customRoutines: false,
                prioritySupport: false
            },
            pro: {
                testsPerDay: -1, // unlimited
                testTypes: ['gridshot', 'flick', 'track', 'switch'],
                analytics: 'advanced',
                heatmaps: true,
                customRoutines: true,
                prioritySupport: true
            }
        };

        return features[plan] || features.free;
    }

    showPaymentModal(plan) {
        // Simulate payment modal (in real app, integrate with Stripe/PayPal)
        const planPrices = {
            pro: '$9.99'
        };

        const confirmPayment = confirm(`Upgrade to ${plan.toUpperCase()} plan for ${planPrices[plan]}/month?\n\nThis is a demo - no actual payment will be processed.`);

        if (confirmPayment) {
            // Simulate successful payment
            this.simulatePaymentSuccess(plan);
        }
    }

    simulatePaymentSuccess(plan) {
        // Mark subscription as active
        localStorage.setItem('aimhelper_subscription', 'true');
        localStorage.setItem('aimhelper_subscription_date', new Date().toISOString());

        // Upgrade plan
        this.upgradeToPlan(plan);

        // Show success message
        alert(`🎉 Successfully upgraded to ${plan.toUpperCase()} plan! Welcome to AimHelper Pro.`);

        // Redirect to profile
        window.location.href = '/profile';
    }

    showTrialExpiredModal() {
        const continueWithPro = confirm(`Your 7-day Pro trial has expired!\n\nWould you like to continue with the Pro plan for $9.99/month?\n\nClick OK to upgrade or Cancel to continue with the Free plan.`);

        if (continueWithPro) {
            this.showPaymentModal('pro');
        } else {
            alert('You have been downgraded to the Free plan. You can upgrade anytime from your profile page.');
        }
    }

    showPlanChangeNotification(oldPlan, newPlan) {
        if (oldPlan === newPlan) return;

        const messages = {
            'free-to-pro': 'Welcome to Pro! You now have unlimited access to all features.',
            'pro-to-free': 'You have been downgraded to Free. Some features are now limited.'
        };

        const key = `${oldPlan}-to-${newPlan}`;
        const message = messages[key];

        if (message) {
            // Show notification (in real app, use a toast/notification system)
            setTimeout(() => alert(message), 500);
        }
    }

    // Static method to check if user has access to a feature
    static hasFeature(featureName) {
        const features = JSON.parse(localStorage.getItem('aimhelper_features') || '{}');
        return features[featureName] || false;
    }

    // Static method to get current plan
    static getCurrentPlan() {
        return localStorage.getItem('aimhelper_plan') || 'free';
    }

    // Static method to check tests remaining today
    static getTestsRemaining() {
        const plan = PricingManager.getCurrentPlan();
        const features = JSON.parse(localStorage.getItem('aimhelper_features') || '{}');

        if (features.testsPerDay === -1) return -1; // unlimited

        // Check tests taken today
        const today = new Date().toDateString();
        const testHistory = JSON.parse(localStorage.getItem('aimhelper_daily_tests') || '{}');
        const todayTests = testHistory[today] || 0;

        return Math.max(0, features.testsPerDay - todayTests);
    }

    // Static method to record test taken
    static recordTestTaken() {
        const today = new Date().toDateString();
        const testHistory = JSON.parse(localStorage.getItem('aimhelper_daily_tests') || '{}');
        testHistory[today] = (testHistory[today] || 0) + 1;
        localStorage.setItem('aimhelper_daily_tests', JSON.stringify(testHistory));
    }
}

// Global functions for pricing page
function startFreeTrial() {
    const pricingManager = new PricingManager();
    pricingManager.startFreeTrial();
}

function upgradeToPro() {
    const pricingManager = new PricingManager();
    pricingManager.upgradeToPro();
}


// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PricingManager();
});