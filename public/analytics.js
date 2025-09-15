/**
 * AimHelper Pro - Advanced Analytics System
 * Professional-grade performance analysis and visualizations
 */

class AdvancedAnalytics {
    constructor() {
        this.results = JSON.parse(localStorage.getItem('aimhelper_results') || '[]');
        this.currentFilter = '7d';
        this.currentPlan = PricingManager.getCurrentPlan();

        this.initializeAnalytics();
        this.setupEventListeners();
        this.loadAnalytics();
    }

    initializeAnalytics() {
        // Check premium features access
        this.isPremium = this.currentPlan === 'pro' || this.currentPlan === 'team';

        // Hide premium overlays if user has access
        if (this.isPremium) {
            const overlays = document.querySelectorAll('.premium-overlay');
            overlays.forEach(overlay => overlay.style.display = 'none');
        }
    }

    setupEventListeners() {
        // Time filter buttons
        document.getElementById('filter7d').addEventListener('click', () => this.changeFilter('7d'));
        document.getElementById('filter30d').addEventListener('click', () => this.changeFilter('30d'));
        document.getElementById('filter90d').addEventListener('click', () => this.changeFilter('90d'));
        document.getElementById('filterAll').addEventListener('click', () => this.changeFilter('all'));
    }

    changeFilter(filter) {
        this.currentFilter = filter;

        // Update active button
        document.querySelectorAll('.time-filter button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`filter${filter === 'all' ? 'All' : filter}`).classList.add('active');

        // Reload analytics with new filter
        this.loadAnalytics();
    }

    loadAnalytics() {
        const filteredResults = this.getFilteredResults();

        this.updatePerformanceTrends(filteredResults);
        this.updateReactionTimeAnalysis(filteredResults);
        this.generatePerformanceInsights(filteredResults);
        this.updateSessionTimeline(filteredResults);

        if (this.isPremium) {
            this.updateHeatMap(filteredResults);
            this.updateTargetZoneAnalysis(filteredResults);
        }
    }

    getFilteredResults() {
        const now = new Date();
        const cutoffDates = {
            '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
            'all': new Date(0)
        };

        const cutoff = cutoffDates[this.currentFilter];

        return this.results.filter(result => {
            return new Date(result.timestamp) >= cutoff;
        });
    }

    updatePerformanceTrends(results) {
        const canvas = document.getElementById('trendsChart');
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card');
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (results.length === 0) {
            this.showNoDataMessage(ctx, canvas, 'No performance data available');
            return;
        }

        // Sort by timestamp
        const sortedResults = results.sort((a, b) => a.timestamp - b.timestamp);

        // Extract data
        const scores = sortedResults.map(r => r.metrics?.score || 0);
        const accuracies = sortedResults.map(r => r.metrics?.accuracy || 0);

        // Calculate trends
        this.updateMetricTrends(scores, accuracies);

        // Draw performance trends
        this.drawTrendChart(ctx, canvas, sortedResults, scores, accuracies);
    }

    updateMetricTrends(scores, accuracies) {
        if (scores.length < 2) {
            document.getElementById('avgScore').textContent = scores[0] ? Math.round(scores[0]) : '0';
            document.getElementById('avgAccuracy').textContent = accuracies[0] ? accuracies[0].toFixed(1) + '%' : '0%';
            return;
        }

        // Calculate averages
        const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const avgAccuracy = accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length;

        // Calculate trends (last half vs first half)
        const mid = Math.floor(scores.length / 2);
        const firstHalfScore = scores.slice(0, mid).reduce((sum, s) => sum + s, 0) / mid;
        const secondHalfScore = scores.slice(mid).reduce((sum, s) => sum + s, 0) / (scores.length - mid);
        const firstHalfAcc = accuracies.slice(0, mid).reduce((sum, a) => sum + a, 0) / mid;
        const secondHalfAcc = accuracies.slice(mid).reduce((sum, a) => sum + a, 0) / (accuracies.length - mid);

        // Update displays
        document.getElementById('avgScore').textContent = Math.round(avgScore);
        document.getElementById('avgAccuracy').textContent = avgAccuracy.toFixed(1) + '%';

        // Update trend indicators
        const scoreTrend = ((secondHalfScore - firstHalfScore) / firstHalfScore * 100);
        const accTrend = ((secondHalfAcc - firstHalfAcc) / firstHalfAcc * 100);

        this.updateTrendDisplay('scoreTrend', scoreTrend);
        this.updateTrendDisplay('accuracyTrend', accTrend);
    }

    updateTrendDisplay(elementId, trendPercent) {
        const element = document.getElementById(elementId);
        const absPercent = Math.abs(trendPercent);

        if (absPercent < 2) {
            element.textContent = 'Stable';
            element.className = 'metric-trend neutral';
        } else if (trendPercent > 0) {
            element.textContent = `↗ +${absPercent.toFixed(1)}%`;
            element.className = 'metric-trend positive';
        } else {
            element.textContent = `↘ -${absPercent.toFixed(1)}%`;
            element.className = 'metric-trend negative';
        }
    }

    drawTrendChart(ctx, canvas, results, scores, accuracies) {
        const margin = 40;
        const chartWidth = canvas.width - 2 * margin;
        const chartHeight = canvas.height - 2 * margin;

        // Find max values for scaling
        const maxScore = Math.max(...scores, 100);
        const maxAccuracy = Math.max(...accuracies, 100);

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
        }

        // Draw accuracy line
        if (accuracies.length > 1) {
            ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--brand-secondary');
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();

            accuracies.forEach((accuracy, index) => {
                const x = margin + (index / (accuracies.length - 1)) * chartWidth;
                const y = margin + chartHeight - (accuracy / maxAccuracy) * chartHeight;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Add legend
        this.drawChartLegend(ctx, canvas);

        // Add labels
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Performance Over Time', canvas.width / 2, 25);
    }

    drawChartLegend(ctx, canvas) {
        ctx.font = '10px Inter';
        ctx.textAlign = 'left';

        // Score legend
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary');
        ctx.fillRect(canvas.width - 120, 20, 15, 3);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
        ctx.fillText('Score', canvas.width - 100, 25);

        // Accuracy legend
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--brand-secondary');
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(canvas.width - 120, 35);
        ctx.lineTo(canvas.width - 105, 35);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillText('Accuracy', canvas.width - 100, 39);
    }

    updateReactionTimeAnalysis(results) {
        const canvas = document.getElementById('reactionChart');
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card');
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (results.length === 0) {
            this.showNoDataMessage(ctx, canvas, 'No reaction time data available');
            return;
        }

        // Extract reaction times
        const allReactionTimes = [];
        results.forEach(result => {
            if (result.metrics?.reactionTimes && result.metrics.reactionTimes.length > 0) {
                allReactionTimes.push(...result.metrics.reactionTimes);
            }
        });

        if (allReactionTimes.length === 0) {
            this.showNoDataMessage(ctx, canvas, 'No reaction time data available');
            return;
        }

        // Calculate statistics
        const sortedTimes = allReactionTimes.sort((a, b) => a - b);
        const bestTime = sortedTimes[0];
        const avgTime = sortedTimes.reduce((sum, t) => sum + t, 0) / sortedTimes.length;
        const stdDev = Math.sqrt(sortedTimes.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / sortedTimes.length);
        const consistency = Math.max(0, 100 - (stdDev / avgTime * 100));

        // Update displays
        document.getElementById('bestReaction').textContent = Math.round(bestTime) + 'ms';
        document.getElementById('avgReaction').textContent = Math.round(avgTime) + 'ms';
        document.getElementById('consistency').textContent = consistency.toFixed(1) + '%';

        // Draw reaction time distribution histogram
        this.drawReactionTimeHistogram(ctx, canvas, sortedTimes);
    }

    drawReactionTimeHistogram(ctx, canvas, reactionTimes) {
        const margin = 40;
        const chartWidth = canvas.width - 2 * margin;
        const chartHeight = canvas.height - 2 * margin;

        // Create histogram bins
        const minTime = Math.min(...reactionTimes);
        const maxTime = Math.max(...reactionTimes);
        const binCount = 10;
        const binSize = (maxTime - minTime) / binCount;
        const bins = new Array(binCount).fill(0);

        // Populate bins
        reactionTimes.forEach(time => {
            const binIndex = Math.min(Math.floor((time - minTime) / binSize), binCount - 1);
            bins[binIndex]++;
        });

        const maxBinValue = Math.max(...bins);

        // Draw axes
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-primary');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin, margin);
        ctx.lineTo(margin, margin + chartHeight);
        ctx.lineTo(margin + chartWidth, margin + chartHeight);
        ctx.stroke();

        // Draw histogram bars
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary');
        const barWidth = chartWidth / binCount;

        bins.forEach((count, index) => {
            const barHeight = (count / maxBinValue) * chartHeight;
            const x = margin + index * barWidth;
            const y = margin + chartHeight - barHeight;

            ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
        });

        // Add title
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Reaction Time Distribution', canvas.width / 2, 25);
    }

    updateHeatMap(results) {
        if (!this.isPremium) return;

        const canvas = document.getElementById('heatmapCanvas');
        const ctx = canvas.getContext('2d');

        // Simulate heat map data (in real implementation, track click positions)
        this.drawHeatMap(ctx, canvas, results);
    }

    drawHeatMap(ctx, canvas, results) {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Simulate heat map zones based on accuracy
        const zones = [
            { x: 200, y: 150, intensity: 0.9, radius: 50 }, // Center hot spot
            { x: 100, y: 80, intensity: 0.6, radius: 30 },   // Top left
            { x: 300, y: 220, intensity: 0.7, radius: 40 },  // Bottom right
            { x: 350, y: 100, intensity: 0.4, radius: 35 },  // Top right
            { x: 50, y: 200, intensity: 0.5, radius: 25 }    // Left side
        ];

        // Draw heat map
        zones.forEach(zone => {
            const gradient = ctx.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, zone.radius);
            const alpha = zone.intensity;

            gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(255, 255, 0, ${alpha * 0.7})`);
            gradient.addColorStop(1, `rgba(0, 0, 255, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(zone.x, zone.y, zone.radius, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Add overlay blend mode effect
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
    }

    updateTargetZoneAnalysis(results) {
        if (!this.isPremium) return;

        // Simulate zone analysis data
        const centerHits = 75;
        const edgeHits = 25;

        document.getElementById('centerHits').textContent = centerHits + '%';
        document.getElementById('edgeHits').textContent = edgeHits + '%';

        // Draw zone chart
        const canvas = document.getElementById('zoneChart');
        const ctx = canvas.getContext('2d');
        this.drawZoneChart(ctx, canvas, centerHits, edgeHits);
    }

    drawZoneChart(ctx, canvas, centerHits, edgeHits) {
        // Clear canvas
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card');
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) - 20;

        // Draw target zones
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-primary');
        ctx.lineWidth = 2;

        // Outer circle (edge zone)
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--brand-accent');
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();

        // Inner circle (center zone)
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius * 0.6, 0, 2 * Math.PI);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--brand-secondary');
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();

        // Add labels
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`${centerHits}%`, centerX, centerY);
        ctx.fillText(`${edgeHits}%`, centerX, centerY + maxRadius * 0.8);
    }

    generatePerformanceInsights(results) {
        const insights = [];

        if (results.length === 0) {
            insights.push({
                type: 'neutral',
                title: 'Start Your Journey',
                description: 'Complete some aim training tests to get personalized insights about your performance.'
            });
        } else {
            // Calculate insights based on performance data
            const avgAccuracy = results.reduce((sum, r) => sum + (r.metrics?.accuracy || 0), 0) / results.length;
            const avgReactionTime = results.reduce((sum, r) => sum + (r.metrics?.averageReactionTime || 0), 0) / results.length;
            const recentTests = results.slice(-5);
            const olderTests = results.slice(0, -5);

            // Accuracy insight
            if (avgAccuracy > 85) {
                insights.push({
                    type: 'positive',
                    title: 'Excellent Accuracy',
                    description: `Your average accuracy of ${avgAccuracy.toFixed(1)}% is exceptional. You're in the top tier of players!`
                });
            } else if (avgAccuracy > 70) {
                insights.push({
                    type: 'positive',
                    title: 'Strong Accuracy',
                    description: `Your ${avgAccuracy.toFixed(1)}% accuracy shows solid fundamentals. Focus on speed to reach the next level.`
                });
            } else if (avgAccuracy > 50) {
                insights.push({
                    type: 'warning',
                    title: 'Improving Accuracy',
                    description: `Your ${avgAccuracy.toFixed(1)}% accuracy has room for improvement. Try lowering your sensitivity and focusing on precision.`
                });
            } else {
                insights.push({
                    type: 'negative',
                    title: 'Focus on Fundamentals',
                    description: `Your ${avgAccuracy.toFixed(1)}% accuracy suggests you should focus on basic aim mechanics and crosshair placement.`
                });
            }

            // Reaction time insight
            if (avgReactionTime < 200) {
                insights.push({
                    type: 'positive',
                    title: 'Lightning Reflexes',
                    description: `Your ${Math.round(avgReactionTime)}ms average reaction time is extremely fast. You have great potential for competitive play.`
                });
            } else if (avgReactionTime < 300) {
                insights.push({
                    type: 'positive',
                    title: 'Good Reaction Time',
                    description: `Your ${Math.round(avgReactionTime)}ms reaction time is solid. Work on consistency to improve further.`
                });
            } else {
                insights.push({
                    type: 'warning',
                    title: 'Reaction Time Focus',
                    description: `Your ${Math.round(avgReactionTime)}ms reaction time could be improved with regular training and proper warm-up routines.`
                });
            }

            // Progress insight
            if (recentTests.length >= 3 && olderTests.length >= 3) {
                const recentAvg = recentTests.reduce((sum, r) => sum + (r.metrics?.score || 0), 0) / recentTests.length;
                const olderAvg = olderTests.reduce((sum, r) => sum + (r.metrics?.score || 0), 0) / olderTests.length;
                const improvement = ((recentAvg - olderAvg) / olderAvg) * 100;

                if (improvement > 10) {
                    insights.push({
                        type: 'positive',
                        title: 'Great Progress',
                        description: `Your recent scores have improved by ${improvement.toFixed(1)}%! Keep up the consistent training.`
                    });
                } else if (improvement < -10) {
                    insights.push({
                        type: 'negative',
                        title: 'Performance Dip',
                        description: `Your scores have decreased by ${Math.abs(improvement).toFixed(1)}% recently. Consider taking a break or adjusting your training routine.`
                    });
                }
            }

            // Session consistency insight
            const sessionsToday = results.filter(r => {
                const today = new Date().toDateString();
                const testDate = new Date(r.timestamp).toDateString();
                return today === testDate;
            }).length;

            if (sessionsToday >= 3) {
                insights.push({
                    type: 'positive',
                    title: 'Dedicated Training',
                    description: `You've completed ${sessionsToday} sessions today. Consistent practice is key to improvement!`
                });
            }
        }

        this.displayInsights(insights);
    }

    displayInsights(insights) {
        const insightsList = document.getElementById('insightsList');

        if (insights.length === 0) {
            insightsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No insights available yet.</p>';
            return;
        }

        insightsList.innerHTML = insights.map(insight => {
            const iconMap = {
                positive: '✅',
                warning: '⚠️',
                negative: '❌',
                neutral: 'ℹ️'
            };

            return `
                <div class="insight-item">
                    <div class="insight-icon ${insight.type}">
                        ${iconMap[insight.type]}
                    </div>
                    <div class="insight-content">
                        <div class="insight-title">${insight.title}</div>
                        <div class="insight-description">${insight.description}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateSessionTimeline(results) {
        const timelineList = document.getElementById('timelineList');

        if (results.length === 0) {
            timelineList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: var(--space-6);">No sessions found.</p>';
            return;
        }

        // Sort by timestamp (most recent first)
        const sortedResults = results.sort((a, b) => b.timestamp - a.timestamp);

        timelineList.innerHTML = sortedResults.slice(0, 15).map(result => {
            const date = new Date(result.timestamp);
            const timeAgo = this.getTimeAgo(date);
            const score = result.metrics?.score || 0;
            const accuracy = result.metrics?.accuracy || 0;

            return `
                <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div style="font-weight: var(--font-weight-semibold);">
                            ${result.testType || 'Grid Shot'} - ${result.difficulty || 'Medium'}
                        </div>
                        <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                            ${timeAgo} • ${accuracy.toFixed(1)}% accuracy • ${result.duration || 60}s
                        </div>
                    </div>
                    <div class="timeline-score">${Math.round(score)}</div>
                </div>
            `;
        }).join('');
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    showNoDataMessage(ctx, canvas, message) {
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedAnalytics();
});