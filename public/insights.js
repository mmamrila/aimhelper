/**
 * AimHelper Pro - Training Insights System
 * AI-powered coaching and performance analysis
 */

class TrainingInsights {
    constructor() {
        this.results = JSON.parse(localStorage.getItem('aimhelper_results') || '[]');
    }

    generateInsights(results = null) {
        const data = results || this.results;
        const insights = [];

        if (data.length === 0) {
            return [{
                type: 'neutral',
                title: 'Welcome to AimHelper Pro',
                description: 'Complete your first aim test to receive personalized training insights.',
                priority: 1
            }];
        }

        // Generate performance insights
        insights.push(...this.analyzeAccuracyPatterns(data));
        insights.push(...this.analyzeReactionTimePatterns(data));
        insights.push(...this.analyzeConsistencyPatterns(data));
        insights.push(...this.analyzeProgressPatterns(data));
        insights.push(...this.analyzeTrainingHabits(data));

        // Sort by priority and return top insights
        return insights.sort((a, b) => (b.priority || 0) - (a.priority || 0)).slice(0, 8);
    }

    analyzeAccuracyPatterns(data) {
        const insights = [];
        const accuracies = data.map(d => d.metrics?.accuracy || 0);
        const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;

        if (avgAccuracy > 90) {
            insights.push({
                type: 'positive',
                title: 'Elite Accuracy',
                description: `Your ${avgAccuracy.toFixed(1)}% accuracy puts you in the top 1% of players. Consider competitive gaming!`,
                priority: 8
            });
        } else if (avgAccuracy > 80) {
            insights.push({
                type: 'positive',
                title: 'Excellent Precision',
                description: `${avgAccuracy.toFixed(1)}% accuracy shows exceptional control. Focus on speed to reach pro level.`,
                priority: 6
            });
        } else if (avgAccuracy > 70) {
            insights.push({
                type: 'warning',
                title: 'Good Foundation',
                description: `Your ${avgAccuracy.toFixed(1)}% accuracy is solid. Try smaller targets or higher difficulty to improve further.`,
                priority: 4
            });
        } else if (avgAccuracy > 50) {
            insights.push({
                type: 'warning',
                title: 'Accuracy Development',
                description: `${avgAccuracy.toFixed(1)}% accuracy shows potential. Lower your sensitivity and focus on smooth, deliberate movements.`,
                priority: 5
            });
        } else {
            insights.push({
                type: 'negative',
                title: 'Master the Basics',
                description: `${avgAccuracy.toFixed(1)}% accuracy suggests focusing on fundamentals. Try arm aiming and consistent crosshair placement.`,
                priority: 7
            });
        }

        // Analyze accuracy variance
        const accuracyVariance = this.calculateVariance(accuracies);
        if (accuracyVariance > 400) { // High variance
            insights.push({
                type: 'warning',
                title: 'Inconsistent Accuracy',
                description: 'Your accuracy varies significantly between sessions. Focus on warming up before training and maintaining consistent posture.',
                priority: 5
            });
        }

        return insights;
    }

    analyzeReactionTimePatterns(data) {
        const insights = [];
        const reactionTimes = [];

        data.forEach(session => {
            if (session.metrics?.reactionTimes) {
                reactionTimes.push(...session.metrics.reactionTimes);
            }
        });

        if (reactionTimes.length === 0) return insights;

        const avgReactionTime = reactionTimes.reduce((sum, rt) => sum + rt, 0) / reactionTimes.length;

        if (avgReactionTime < 180) {
            insights.push({
                type: 'positive',
                title: 'Lightning Reflexes',
                description: `${Math.round(avgReactionTime)}ms reaction time is exceptional. You have natural talent for fast-paced games.`,
                priority: 7
            });
        } else if (avgReactionTime < 250) {
            insights.push({
                type: 'positive',
                title: 'Quick Reactions',
                description: `${Math.round(avgReactionTime)}ms is a strong reaction time. You're well-suited for competitive gaming.`,
                priority: 5
            });
        } else if (avgReactionTime < 350) {
            insights.push({
                type: 'neutral',
                title: 'Average Response Time',
                description: `${Math.round(avgReactionTime)}ms reaction time is normal. Regular training can help you improve by 50-100ms.`,
                priority: 3
            });
        } else {
            insights.push({
                type: 'warning',
                title: 'Reaction Time Focus',
                description: `${Math.round(avgReactionTime)}ms suggests room for improvement. Try reaction time specific drills and ensure good sleep.`,
                priority: 6
            });
        }

        return insights;
    }

    analyzeConsistencyPatterns(data) {
        const insights = [];
        const scores = data.map(d => d.metrics?.score || 0);

        if (scores.length < 3) return insights;

        const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const scoreVariance = this.calculateVariance(scores);
        const consistencyScore = Math.max(0, 100 - (Math.sqrt(scoreVariance) / avgScore * 100));

        if (consistencyScore > 85) {
            insights.push({
                type: 'positive',
                title: 'Remarkable Consistency',
                description: `${consistencyScore.toFixed(1)}% consistency shows excellent muscle memory and mental fortitude.`,
                priority: 6
            });
        } else if (consistencyScore > 70) {
            insights.push({
                type: 'positive',
                title: 'Solid Consistency',
                description: `${consistencyScore.toFixed(1)}% consistency indicates good fundamentals. You're building reliable skills.`,
                priority: 4
            });
        } else if (consistencyScore > 50) {
            insights.push({
                type: 'warning',
                title: 'Developing Consistency',
                description: `${consistencyScore.toFixed(1)}% consistency shows room for improvement. Focus on warming up and maintaining consistent form.`,
                priority: 4
            });
        } else {
            insights.push({
                type: 'negative',
                title: 'Inconsistent Performance',
                description: `${consistencyScore.toFixed(1)}% consistency suggests focusing on routine and fundamentals. Try standardizing your setup and warm-up.`,
                priority: 6
            });
        }

        return insights;
    }

    analyzeProgressPatterns(data) {
        const insights = [];

        if (data.length < 6) return insights;

        const scores = data.map(d => d.metrics?.score || 0);
        const recentScores = scores.slice(-3);
        const olderScores = scores.slice(0, -3);

        const recentAvg = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
        const olderAvg = olderScores.reduce((sum, s) => sum + s, 0) / olderScores.length;
        const improvement = ((recentAvg - olderAvg) / olderAvg) * 100;

        if (improvement > 15) {
            insights.push({
                type: 'positive',
                title: 'Rapid Improvement',
                description: `${improvement.toFixed(1)}% score improvement shows excellent learning curve. You're on track for major gains!`,
                priority: 8
            });
        } else if (improvement > 5) {
            insights.push({
                type: 'positive',
                title: 'Steady Progress',
                description: `${improvement.toFixed(1)}% improvement demonstrates consistent growth. Keep up the regular training!`,
                priority: 6
            });
        } else if (improvement > -5) {
            insights.push({
                type: 'neutral',
                title: 'Plateau Phase',
                description: 'Your performance has stabilized. Try varying your training routine or increasing difficulty to break through.',
                priority: 4
            });
        } else {
            insights.push({
                type: 'warning',
                title: 'Performance Decline',
                description: `Recent scores dropped ${Math.abs(improvement).toFixed(1)}%. Consider taking a break or reviewing your fundamentals.`,
                priority: 7
            });
        }

        return insights;
    }

    analyzeTrainingHabits(data) {
        const insights = [];

        // Analyze session frequency
        const sessionsThisWeek = data.filter(session => {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return new Date(session.timestamp) > weekAgo;
        }).length;

        if (sessionsThisWeek >= 10) {
            insights.push({
                type: 'warning',
                title: 'High Training Volume',
                description: `${sessionsThisWeek} sessions this week is quite intensive. Ensure you're taking breaks to avoid burnout.`,
                priority: 5
            });
        } else if (sessionsThisWeek >= 5) {
            insights.push({
                type: 'positive',
                title: 'Dedicated Training',
                description: `${sessionsThisWeek} sessions this week shows great commitment. Consistency is key to improvement!`,
                priority: 4
            });
        } else if (sessionsThisWeek >= 2) {
            insights.push({
                type: 'neutral',
                title: 'Regular Practice',
                description: `${sessionsThisWeek} sessions this week is a good start. Try to increase frequency for faster improvement.`,
                priority: 2
            });
        } else if (sessionsThisWeek === 1) {
            insights.push({
                type: 'warning',
                title: 'Infrequent Training',
                description: 'Only 1 session this week. Aim for 3-5 sessions weekly for meaningful progress.',
                priority: 3
            });
        }

        // Analyze session timing patterns
        const sessionHours = data.map(session => new Date(session.timestamp).getHours());
        const morningCount = sessionHours.filter(hour => hour >= 6 && hour < 12).length;
        const afternoonCount = sessionHours.filter(hour => hour >= 12 && hour < 18).length;
        const eveningCount = sessionHours.filter(hour => hour >= 18 || hour < 6).length;

        const totalSessions = data.length;
        if (eveningCount / totalSessions > 0.7) {
            insights.push({
                type: 'neutral',
                title: 'Night Owl Training',
                description: 'You train mostly in the evening. Consider morning sessions when reaction times are typically faster.',
                priority: 2
            });
        } else if (morningCount / totalSessions > 0.6) {
            insights.push({
                type: 'positive',
                title: 'Morning Warrior',
                description: 'Morning training is excellent! You\'re taking advantage of peak cognitive performance hours.',
                priority: 3
            });
        }

        return insights;
    }

    calculateVariance(numbers) {
        if (numbers.length === 0) return 0;
        const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
        return variance;
    }

    generateCoachingTips(userLevel = 'beginner') {
        const tips = {
            beginner: [
                {
                    title: 'Proper Mouse Grip',
                    description: 'Use a relaxed claw or palm grip. Your wrist should rest on the mousepad, with fingers controlling precise movements.'
                },
                {
                    title: 'Crosshair Placement',
                    description: 'Keep your crosshair at head level and pre-aim common angles. This reduces the distance you need to flick to targets.'
                },
                {
                    title: 'Sensitivity Settings',
                    description: 'Start with lower sensitivity (8-16in/360°). This provides more control for precise aiming at the cost of some speed.'
                },
                {
                    title: 'Warm-up Routine',
                    description: 'Always warm up for 5-10 minutes before serious training. Start with slow, precise movements and gradually increase speed.'
                }
            ],
            intermediate: [
                {
                    title: 'Tracking Practice',
                    description: 'Focus on smooth tracking exercises. Practice following moving targets with consistent crosshair placement.'
                },
                {
                    title: 'Flick Consistency',
                    description: 'Work on flick shots to targets at various distances. Focus on stopping exactly on target rather than overshooting.'
                },
                {
                    title: 'Counter-Strafing',
                    description: 'Learn to stop movement instantly by tapping the opposite direction key. This improves first-shot accuracy significantly.'
                },
                {
                    title: 'Mental Game',
                    description: 'Stay calm under pressure. Practice breathing techniques and maintain consistent mouse grip even when stressed.'
                }
            ],
            advanced: [
                {
                    title: 'Micro-adjustments',
                    description: 'Master tiny corrections to your aim. Use small wrist movements for final target acquisition after large arm movements.'
                },
                {
                    title: 'Target Switching',
                    description: 'Practice rapid target acquisition between multiple targets. Focus on economy of movement and minimal overaim.'
                },
                {
                    title: 'Dynamic Positioning',
                    description: 'Combine movement with aiming. Practice shooting while strafing, jiggle-peeking, and other advanced techniques.'
                },
                {
                    title: 'Scenario Training',
                    description: 'Train specific game scenarios. Practice common dueling positions and angles you encounter in your main game.'
                }
            ]
        };

        return tips[userLevel] || tips.beginner;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrainingInsights;
} else {
    window.TrainingInsights = TrainingInsights;
}