/**
 * AimHelper Pro - Player Profile
 * Statistics tracking and progress visualization
 */

class PlayerProfile {
    constructor() {
        this.playerName = localStorage.getItem('aimhelper_username') || 'Anonymous Player';
        this.results = JSON.parse(localStorage.getItem('aimhelper_results') || '[]');
        this.leaderboard = JSON.parse(localStorage.getItem('aimhelper_leaderboard') || '[]');

        this.initializeProfile();
        this.updatePlanDisplay();
        this.loadStats();
        this.loadRecentTests();
        this.drawProgressChart();
        this.setupEventListeners();
    }

    initializeProfile() {
        // Set profile name and avatar
        document.getElementById('profileName').textContent = this.playerName;
        document.getElementById('usernameInput').value = this.playerName;

        // Generate avatar emoji based on username
        const avatarEmojis = ['🎯', '🏹', '🎪', '🔫', '⚡', '🎮', '🏆', '💎', '🔥', '⭐'];
        const avatarIndex = this.playerName.length % avatarEmojis.length;
        document.getElementById('profileAvatar').textContent = avatarEmojis[avatarIndex];
    }

    loadStats() {
        if (this.results.length === 0) {
            this.showNoDataMessage();
            return;
        }

        // Calculate overall statistics
        const stats = this.calculateOverallStats();

        // Update stat displays
        document.getElementById('totalTests').textContent = stats.totalTests;
        document.getElementById('bestScore').textContent = Math.round(stats.bestScore);
        document.getElementById('avgAccuracy').textContent = stats.avgAccuracy.toFixed(1) + '%';
        document.getElementById('avgReaction').textContent = Math.round(stats.avgReaction) + 'ms';
        document.getElementById('totalHours').textContent = stats.totalHours.toFixed(1) + 'h';
        document.getElementById('leaderboardRank').textContent = this.getPlayerRank();
    }

    calculateOverallStats() {
        let totalTests = this.results.length;
        let bestScore = 0;
        let totalAccuracy = 0;
        let totalReaction = 0;
        let totalDuration = 0;
        let validAccuracyCount = 0;
        let validReactionCount = 0;

        this.results.forEach(result => {
            if (result.metrics) {
                // Best score
                if (result.metrics.score > bestScore) {
                    bestScore = result.metrics.score;
                }

                // Accuracy
                if (result.metrics.accuracy && result.metrics.accuracy > 0) {
                    totalAccuracy += result.metrics.accuracy;
                    validAccuracyCount++;
                }

                // Reaction time
                if (result.metrics.averageReactionTime && result.metrics.averageReactionTime > 0) {
                    totalReaction += result.metrics.averageReactionTime;
                    validReactionCount++;
                }

                // Duration
                totalDuration += result.duration || 60;
            }
        });

        return {
            totalTests,
            bestScore,
            avgAccuracy: validAccuracyCount > 0 ? totalAccuracy / validAccuracyCount : 0,
            avgReaction: validReactionCount > 0 ? totalReaction / validReactionCount : 0,
            totalHours: totalDuration / 3600
        };
    }

    getPlayerRank() {
        const myBestScore = this.results.reduce((best, result) => {
            return Math.max(best, result.metrics?.score || 0);
        }, 0);

        if (myBestScore === 0) return '-';

        // Find rank in leaderboard
        const rank = this.leaderboard.findIndex(entry => entry.score <= myBestScore) + 1;
        return rank > 0 ? `#${rank}` : `#${this.leaderboard.length + 1}`;
    }

    loadRecentTests() {
        const recentTestsList = document.getElementById('recentTestsList');

        if (this.results.length === 0) {
            recentTestsList.innerHTML = `
                <div style="text-align: center; padding: var(--space-8); color: var(--text-secondary);">
                    <p>No test results yet. Take your first aim test!</p>
                    <a href="/grid-shot-enhanced" class="btn btn-primary" style="margin-top: var(--space-4);">
                        <span>🎯 Start Grid Shot</span>
                    </a>
                </div>
            `;
            return;
        }

        // Sort by timestamp (most recent first)
        const sortedResults = [...this.results].sort((a, b) => b.timestamp - a.timestamp);

        // Show last 10 tests
        const recentTests = sortedResults.slice(0, 10);

        recentTestsList.innerHTML = recentTests.map(result => {
            const date = new Date(result.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="test-item">
                    <div class="test-info">
                        <div class="test-name">Grid Shot - ${result.difficulty || 'Medium'}</div>
                        <div class="test-details">${formattedDate} • ${result.duration || 60}s • ${(result.metrics?.accuracy || 0).toFixed(1)}% accuracy</div>
                    </div>
                    <div class="test-score">${Math.round(result.metrics?.score || 0)}</div>
                </div>
            `;
        }).join('');
    }

    drawProgressChart() {
        const canvas = document.getElementById('progressChart');
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card');
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (this.results.length === 0) {
            // Show no data message
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
            ctx.font = '16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Complete some tests to see your progress chart', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Sort results by timestamp
        const sortedResults = [...this.results].sort((a, b) => a.timestamp - b.timestamp);

        // Extract scores for chart
        const scores = sortedResults.map(result => result.metrics?.score || 0);
        const maxScore = Math.max(...scores, 100);

        // Chart dimensions
        const margin = 40;
        const chartWidth = canvas.width - 2 * margin;
        const chartHeight = canvas.height - 2 * margin;

        // Draw axes
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-primary');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin, margin);
        ctx.lineTo(margin, margin + chartHeight);
        ctx.lineTo(margin + chartWidth, margin + chartHeight);
        ctx.stroke();

        // Draw score line
        if (scores.length > 1) {
            ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary');
            ctx.lineWidth = 3;
            ctx.beginPath();

            scores.forEach((score, index) => {
                const x = margin + (index / (scores.length - 1)) * chartWidth;
                const y = margin + chartHeight - (score / maxScore) * chartHeight;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();

            // Draw data points
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary');
            scores.forEach((score, index) => {
                const x = margin + (index / (scores.length - 1)) * chartWidth;
                const y = margin + chartHeight - (score / maxScore) * chartHeight;

                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
            });
        }

        // Draw labels
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Test Progress Over Time', canvas.width / 2, 30);

        // Y-axis label
        ctx.save();
        ctx.translate(15, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Score', 0, 0);
        ctx.restore();
    }

    setupEventListeners() {
        document.getElementById('updateUsername').addEventListener('click', () => {
            const newUsername = document.getElementById('usernameInput').value.trim();
            if (newUsername && newUsername !== this.playerName) {
                this.updateUsername(newUsername);
            }
        });

        document.getElementById('usernameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const newUsername = e.target.value.trim();
                if (newUsername && newUsername !== this.playerName) {
                    this.updateUsername(newUsername);
                }
            }
        });
    }

    updateUsername(newUsername) {
        this.playerName = newUsername;
        localStorage.setItem('aimhelper_username', newUsername);

        // Update displays
        document.getElementById('profileName').textContent = newUsername;

        // Update avatar
        const avatarEmojis = ['🎯', '🏹', '🎪', '🔫', '⚡', '🎮', '🏆', '💎', '🔥', '⭐'];
        const avatarIndex = newUsername.length % avatarEmojis.length;
        document.getElementById('profileAvatar').textContent = avatarEmojis[avatarIndex];

        // Show confirmation
        alert('Username updated successfully!');
    }

    updatePlanDisplay() {
        const planInfo = document.getElementById('planInfo');
        if (!planInfo) return;

        const currentPlan = localStorage.getItem('aimhelper_plan') || 'free';
        const trialStartDate = localStorage.getItem('aimhelper_trial_start');
        const subscriptionActive = localStorage.getItem('aimhelper_subscription') === 'true';

        let planHTML = '';

        // Plan badge
        const planBadges = {
            free: '<div class="plan-badge-large free">🆓 Free Trainer</div>',
            pro: '<div class="plan-badge-large pro">⚡ Pro Gamer</div>',
            team: '<div class="plan-badge-large team">🏆 Team Coach</div>'
        };

        planHTML += planBadges[currentPlan] || planBadges.free;

        // Trial information
        if (trialStartDate && !subscriptionActive) {
            const trialStart = new Date(trialStartDate);
            const now = new Date();
            const daysRemaining = Math.max(0, 7 - Math.floor((now - trialStart) / (1000 * 60 * 60 * 24)));

            if (daysRemaining > 0) {
                planHTML += `
                    <div class="trial-info">
                        ⏰ Pro trial: ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining
                    </div>
                `;
            }
        }

        // Plan actions
        planHTML += '<div class="plan-actions">';

        if (currentPlan === 'free') {
            planHTML += `
                <a href="/pricing" class="btn btn-primary">⚡ Upgrade to Pro</a>
                <a href="/pricing" class="btn btn-secondary">💳 View All Plans</a>
            `;
        } else if (currentPlan === 'pro') {
            planHTML += `
                <a href="/pricing" class="btn btn-secondary">🏆 Upgrade to Team</a>
                <button id="manageBilling" class="btn btn-ghost">⚙️ Manage Billing</button>
            `;
        } else if (currentPlan === 'team') {
            planHTML += `
                <button id="manageBilling" class="btn btn-secondary">⚙️ Manage Billing</button>
                <button id="teamDashboard" class="btn btn-primary">👥 Team Dashboard</button>
            `;
        }

        planHTML += '</div>';

        // Current usage for free users
        if (currentPlan === 'free') {
            const testsToday = this.getTestsToday();
            planHTML += `
                <div style="margin-top: var(--space-4); font-size: var(--font-size-sm); color: var(--text-secondary);">
                    Tests used today: ${testsToday}/3
                </div>
            `;
        }

        planInfo.innerHTML = planHTML;

        // Add event listeners for new buttons
        setTimeout(() => {
            if (document.getElementById('manageBilling')) {
                document.getElementById('manageBilling').addEventListener('click', () => this.manageBilling());
            }
            if (document.getElementById('teamDashboard')) {
                document.getElementById('teamDashboard').addEventListener('click', () => this.openTeamDashboard());
            }
        }, 100);
    }

    getTestsToday() {
        const today = new Date().toDateString();
        const testHistory = JSON.parse(localStorage.getItem('aimhelper_daily_tests') || '{}');
        return testHistory[today] || 0;
    }

    manageBilling() {
        alert('Billing management would integrate with your payment provider (Stripe, PayPal, etc.)\n\nThis is a demo - in production, this would open your billing dashboard.');
    }

    openTeamDashboard() {
        alert('Team dashboard feature coming soon!\n\nThis would show team member performance, challenges, and management tools.');
    }

    showNoDataMessage() {
        // Update all stat cards to show no data
        document.getElementById('totalTests').textContent = '0';
        document.getElementById('bestScore').textContent = '0';
        document.getElementById('avgAccuracy').textContent = '0%';
        document.getElementById('avgReaction').textContent = '0ms';
        document.getElementById('totalHours').textContent = '0.0h';
        document.getElementById('leaderboardRank').textContent = '-';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PlayerProfile();
});