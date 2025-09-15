/**
 * AimHelper Pro - Community Features
 * Social features, Discord integration, and community challenges
 */

class CommunityManager {
    constructor() {
        this.playerName = localStorage.getItem('aimhelper_username') || 'Anonymous';
        this.results = JSON.parse(localStorage.getItem('aimhelper_results') || '[]');
        this.leaderboard = JSON.parse(localStorage.getItem('aimhelper_leaderboard') || '[]');
        this.challenges = JSON.parse(localStorage.getItem('aimhelper_challenges') || '[]');
        this.communityFeed = JSON.parse(localStorage.getItem('aimhelper_community_feed') || '[]');

        this.initializeCommunity();
        this.loadCommunityFeed();
        this.loadChallenges();
        this.loadLeaderboardPreview();
        this.setupEventListeners();
    }

    initializeCommunity() {
        // Initialize default challenges if none exist
        if (this.challenges.length === 0) {
            this.challenges = this.getDefaultChallenges();
            localStorage.setItem('aimhelper_challenges', JSON.stringify(this.challenges));
        }

        // Generate community feed if empty
        if (this.communityFeed.length === 0) {
            this.communityFeed = this.generateSampleFeed();
            localStorage.setItem('aimhelper_community_feed', JSON.stringify(this.communityFeed));
        }

        // Update community stats
        this.updateCommunityStats();
    }

    updateCommunityStats() {
        // Simulate growing community stats
        const baseStats = {
            totalUsers: 15247,
            totalTests: 2100000,
            avgImprovement: 34,
            discordMembers: 8450
        };

        // Add some realistic variation based on current time
        const variance = Math.sin(Date.now() / (1000 * 60 * 60 * 24)) * 0.1;

        document.getElementById('totalUsers').textContent = Math.floor(baseStats.totalUsers * (1 + variance)).toLocaleString();
        document.getElementById('totalTests').textContent = (baseStats.totalTests / 1000000).toFixed(1) + 'M';
        document.getElementById('avgImprovement').textContent = Math.floor(baseStats.avgImprovement * (1 + variance * 0.5)) + '%';
        document.getElementById('discordMembers').textContent = Math.floor(baseStats.discordMembers * (1 + variance * 0.3)).toLocaleString();
    }

    loadCommunityFeed() {
        const feedContainer = document.getElementById('communityFeed');

        if (this.communityFeed.length === 0) {
            feedContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: var(--space-4);">No community activity yet. Be the first to share!</p>';
            return;
        }

        // Sort by timestamp (most recent first)
        const sortedFeed = [...this.communityFeed].sort((a, b) => b.timestamp - a.timestamp);

        feedContainer.innerHTML = sortedFeed.slice(0, 10).map(item => {
            const timeAgo = this.getTimeAgo(new Date(item.timestamp));
            const avatar = this.generateAvatar(item.username);

            let content = '';
            switch (item.type) {
                case 'achievement':
                    content = `
                        <div class="feed-header">
                            <span class="feed-username">${item.username}</span>
                            <span class="feed-action">earned an achievement</span>
                            <span class="feed-time">${timeAgo}</span>
                        </div>
                        <div class="achievement-badge">
                            ${item.achievement.icon} ${item.achievement.title}
                        </div>
                        <div class="feed-details">${item.achievement.description}</div>
                    `;
                    break;
                case 'score':
                    content = `
                        <div class="feed-header">
                            <span class="feed-username">${item.username}</span>
                            <span class="feed-action">set a new personal best</span>
                            <span class="feed-time">${timeAgo}</span>
                        </div>
                        <div class="feed-details">
                            <strong>${item.score}</strong> points in Grid Shot • ${item.accuracy}% accuracy
                        </div>
                    `;
                    break;
                case 'milestone':
                    content = `
                        <div class="feed-header">
                            <span class="feed-username">${item.username}</span>
                            <span class="feed-action">reached a milestone</span>
                            <span class="feed-time">${timeAgo}</span>
                        </div>
                        <div class="feed-details">${item.description}</div>
                    `;
                    break;
                case 'challenge':
                    content = `
                        <div class="feed-header">
                            <span class="feed-username">${item.username}</span>
                            <span class="feed-action">completed a challenge</span>
                            <span class="feed-time">${timeAgo}</span>
                        </div>
                        <div class="feed-details">
                            <strong>${item.challengeName}</strong> • Rank: #${item.rank}
                        </div>
                    `;
                    break;
                default:
                    content = `
                        <div class="feed-header">
                            <span class="feed-username">${item.username}</span>
                            <span class="feed-action">${item.action || 'shared an update'}</span>
                            <span class="feed-time">${timeAgo}</span>
                        </div>
                        <div class="feed-details">${item.description || item.content}</div>
                    `;
            }

            return `
                <div class="feed-item">
                    <div class="feed-avatar">${avatar}</div>
                    <div class="feed-content">${content}</div>
                </div>
            `;
        }).join('');
    }

    loadChallenges() {
        const challengesList = document.getElementById('challengesList');

        if (this.challenges.length === 0) {
            challengesList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No active challenges right now. Check back soon!</p>';
            return;
        }

        challengesList.innerHTML = this.challenges.map(challenge => {
            const progress = this.calculateChallengeProgress(challenge);
            const isCompleted = progress >= 100;
            const statusClass = isCompleted ? 'completed' : 'active';
            const statusText = isCompleted ? 'Completed' : 'Active';

            return `
                <div class="challenge-card">
                    <div class="challenge-header">
                        <div class="challenge-title">
                            ${challenge.icon} ${challenge.title}
                        </div>
                        <div class="challenge-status ${statusClass}">
                            ${statusText}
                        </div>
                    </div>
                    <div class="challenge-description">
                        ${challenge.description}
                    </div>
                    <div class="challenge-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                        </div>
                        <div class="progress-text">
                            ${challenge.current || 0} / ${challenge.target} ${challenge.unit}
                        </div>
                    </div>
                    <div class="challenge-rewards">
                        ${challenge.rewards.map(reward => `
                            <span class="reward-badge">${reward.icon} ${reward.name}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    loadLeaderboardPreview() {
        const leaderboardContainer = document.getElementById('leaderboardPreview');

        // Get top 5 players from leaderboard
        const topPlayers = this.leaderboard.slice(0, 5);

        if (topPlayers.length === 0) {
            leaderboardContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No rankings yet. Complete some tests to join the leaderboard!</p>';
            return;
        }

        leaderboardContainer.innerHTML = topPlayers.map((player, index) => {
            const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';

            return `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank ${rankClass}">${index + 1}</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">${player.playerName}</div>
                        <div class="leaderboard-score">
                            ${player.accuracy?.toFixed(1)}% accuracy • ${Math.round(player.reactionTime)}ms
                        </div>
                    </div>
                    <div class="leaderboard-value">${player.score}</div>
                </div>
            `;
        }).join('');
    }

    setupEventListeners() {
        // Discord integration
        document.getElementById('joinDiscord').addEventListener('click', (e) => {
            e.preventDefault();
            this.joinDiscord();
        });

        // Social actions
        document.getElementById('shareAchievement').addEventListener('click', (e) => {
            e.preventDefault();
            this.shareAchievement();
        });

        document.getElementById('findFriends').addEventListener('click', (e) => {
            e.preventDefault();
            this.findFriends();
        });

        document.getElementById('createGroup').addEventListener('click', (e) => {
            e.preventDefault();
            this.createGroup();
        });
    }

    joinDiscord() {
        // Simulate Discord integration
        const discordInvite = 'https://discord.gg/aimhelperpro'; // This would be a real Discord invite

        // In a real implementation, this would open the Discord invite
        const message = `Join our Discord community!\n\nIn a real implementation, this would open:\n${discordInvite}\n\nFeatures:\n• Get aim training tips from pros\n• Participate in community events\n• Find practice partners\n• Share your progress\n• Get support from the community`;

        alert(message);

        // Track Discord join attempt
        this.addCommunityActivity({
            type: 'social',
            username: this.playerName,
            action: 'attempted to join Discord',
            description: 'Clicked Discord invite link',
            timestamp: Date.now()
        });
    }

    shareAchievement() {
        // Get user's best achievement to share
        const bestScore = Math.max(...this.results.map(r => r.metrics?.score || 0));
        const bestAccuracy = Math.max(...this.results.map(r => r.metrics?.accuracy || 0));

        if (bestScore === 0) {
            alert('Complete some aim tests first to earn achievements to share!');
            return;
        }

        const achievement = this.determineAchievement(bestScore, bestAccuracy);

        const shareText = `🎯 Just ${achievement.action} in AimHelper Pro!\n\n${achievement.icon} ${achievement.title}\n📊 Best Score: ${bestScore}\n🎯 Best Accuracy: ${bestAccuracy.toFixed(1)}%\n\nTrain your aim: ${window.location.origin}`;

        // Copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Achievement copied to clipboard! Share it anywhere you like.');
        });

        // Add to community feed
        this.addCommunityActivity({
            type: 'achievement',
            username: this.playerName,
            achievement: achievement,
            score: bestScore,
            accuracy: bestAccuracy.toFixed(1),
            timestamp: Date.now()
        });
    }

    findFriends() {
        alert('🔍 Find Friends Feature\n\nConnect with other players:\n\n• Find players with similar skill levels\n• Add friends from Discord community\n• Compare progress and compete\n• Form practice groups\n\nThis feature would integrate with your Discord/Steam profiles in a full implementation.');
    }

    createGroup() {
        const groupName = prompt('Enter a name for your practice group:');
        if (!groupName) return;

        alert(`🏆 Group "${groupName}" Created!\n\nFeatures:\n• Invite up to 10 friends\n• Group leaderboards\n• Shared challenges\n• Practice sessions\n• Progress tracking\n\nInvite link: aimhelperpro.com/group/${groupName.toLowerCase().replace(/\s+/g, '-')}\n\n(This is a demo - full implementation would create real groups)`);

        this.addCommunityActivity({
            type: 'social',
            username: this.playerName,
            action: 'created a practice group',
            description: `"${groupName}" - Join the community to connect!`,
            timestamp: Date.now()
        });
    }

    calculateChallengeProgress(challenge) {
        // Calculate progress based on user's results
        const current = challenge.current || 0;
        const target = challenge.target;

        // Simulate some progress based on actual user data
        if (challenge.id === 'accuracy-master') {
            const avgAccuracy = this.results.length > 0 ?
                this.results.reduce((sum, r) => sum + (r.metrics?.accuracy || 0), 0) / this.results.length : 0;
            challenge.current = Math.floor(avgAccuracy);
        } else if (challenge.id === 'speed-demon') {
            const bestReactionTime = Math.min(...this.results.map(r => r.metrics?.averageReactionTime || 1000));
            challenge.current = Math.max(0, 500 - bestReactionTime);
        } else if (challenge.id === 'consistency-king') {
            challenge.current = Math.min(this.results.length, challenge.target);
        } else if (challenge.id === 'daily-grind') {
            const today = new Date().toDateString();
            const todayTests = this.results.filter(r => new Date(r.timestamp).toDateString() === today).length;
            challenge.current = todayTests;
        }

        return (challenge.current / target) * 100;
    }

    getDefaultChallenges() {
        return [
            {
                id: 'accuracy-master',
                title: 'Accuracy Master',
                icon: '🎯',
                description: 'Achieve 80% average accuracy across all sessions to unlock the Precision Pro badge.',
                target: 80,
                current: 0,
                unit: '% accuracy',
                rewards: [
                    { icon: '🏆', name: 'Precision Pro Badge' },
                    { icon: '⚡', name: '+50 XP' }
                ]
            },
            {
                id: 'speed-demon',
                title: 'Speed Demon',
                icon: '⚡',
                description: 'Get your average reaction time under 200ms to prove your lightning reflexes.',
                target: 300,
                current: 0,
                unit: 'ms improvement',
                rewards: [
                    { icon: '🔥', name: 'Lightning Badge' },
                    { icon: '💎', name: 'Premium Trial' }
                ]
            },
            {
                id: 'consistency-king',
                title: 'Consistency King',
                icon: '👑',
                description: 'Complete 20 training sessions to build muscle memory and earn the Dedication badge.',
                target: 20,
                current: 0,
                unit: 'sessions',
                rewards: [
                    { icon: '🎖️', name: 'Dedication Badge' },
                    { icon: '📊', name: 'Advanced Analytics' }
                ]
            },
            {
                id: 'daily-grind',
                title: 'Daily Grind',
                icon: '📅',
                description: 'Complete 5 training sessions today to maintain your streak and earn bonus XP.',
                target: 5,
                current: 0,
                unit: 'sessions today',
                rewards: [
                    { icon: '🔄', name: 'Streak Bonus' },
                    { icon: '⭐', name: '+25 XP' }
                ]
            }
        ];
    }

    generateSampleFeed() {
        const sampleUsers = ['AimGod2024', 'SniperElite', 'HeadshotHero', 'FlickMaster', 'PrecisionPro', 'QuickScope', 'AimBot_Real', 'TargetDestroyer'];
        const achievements = [
            { icon: '🎯', title: 'Bullseye Master', description: 'Hit 100 consecutive targets' },
            { icon: '⚡', title: 'Lightning Reflexes', description: 'Sub-150ms average reaction time' },
            { icon: '🔥', title: 'Hot Streak', description: '50 target killing spree' },
            { icon: '👑', title: 'Accuracy King', description: '95%+ accuracy for 10 sessions' },
            { icon: '💎', title: 'Diamond Tier', description: 'Reached top 1% of players' }
        ];

        const feed = [];
        const now = Date.now();

        // Generate 20 sample feed items
        for (let i = 0; i < 20; i++) {
            const user = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
            const timeOffset = Math.random() * 7 * 24 * 60 * 60 * 1000; // Last 7 days
            const timestamp = now - timeOffset;

            const activityType = Math.random();

            if (activityType < 0.3) {
                // Achievement
                const achievement = achievements[Math.floor(Math.random() * achievements.length)];
                feed.push({
                    type: 'achievement',
                    username: user,
                    achievement: achievement,
                    timestamp: timestamp
                });
            } else if (activityType < 0.6) {
                // Score
                feed.push({
                    type: 'score',
                    username: user,
                    score: Math.floor(Math.random() * 2000) + 500,
                    accuracy: (Math.random() * 30 + 70).toFixed(1),
                    timestamp: timestamp
                });
            } else if (activityType < 0.8) {
                // Challenge completion
                const challenges = ['Weekly Accuracy Challenge', 'Speed Demon Challenge', 'Consistency Master', 'Daily Grind'];
                feed.push({
                    type: 'challenge',
                    username: user,
                    challengeName: challenges[Math.floor(Math.random() * challenges.length)],
                    rank: Math.floor(Math.random() * 100) + 1,
                    timestamp: timestamp
                });
            } else {
                // Milestone
                const milestones = [
                    '1000th training session completed!',
                    'Joined the 90% accuracy club',
                    '30-day training streak achieved',
                    'First sub-200ms reaction time!',
                    'Reached Diamond tier ranking'
                ];
                feed.push({
                    type: 'milestone',
                    username: user,
                    description: milestones[Math.floor(Math.random() * milestones.length)],
                    timestamp: timestamp
                });
            }
        }

        return feed;
    }

    addCommunityActivity(activity) {
        this.communityFeed.unshift(activity);
        // Keep only the latest 50 activities
        this.communityFeed = this.communityFeed.slice(0, 50);
        localStorage.setItem('aimhelper_community_feed', JSON.stringify(this.communityFeed));

        // Refresh the feed display
        this.loadCommunityFeed();
    }

    determineAchievement(score, accuracy) {
        if (accuracy >= 95) {
            return { icon: '👑', title: 'Accuracy King', action: 'achieved 95%+ accuracy' };
        } else if (accuracy >= 90) {
            return { icon: '🎯', title: 'Bullseye Master', action: 'joined the 90% accuracy club' };
        } else if (score >= 1500) {
            return { icon: '🔥', title: 'Score Beast', action: 'scored over 1500 points' };
        } else if (accuracy >= 80) {
            return { icon: '⚡', title: 'Sharp Shooter', action: 'achieved 80%+ accuracy' };
        } else if (score >= 1000) {
            return { icon: '💪', title: 'Rising Star', action: 'broke 1000 points' };
        } else {
            return { icon: '🎮', title: 'Aim Trainer', action: 'completed their training' };
        }
    }

    generateAvatar(username) {
        // Generate a consistent emoji avatar based on username
        const emojis = ['🎯', '🔥', '⚡', '💎', '🏆', '👑', '🎮', '🚀', '⭐', '💫'];
        const index = username.length % emojis.length;
        return emojis[index];
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CommunityManager();
});