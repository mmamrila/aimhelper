/**
 * AimHelper Pro - Discord Integration
 * Bot commands, webhooks, and community features for Discord server
 */

class DiscordIntegration {
    constructor() {
        this.botToken = 'DEMO_BOT_TOKEN'; // Would be real bot token in production
        this.guildId = 'DEMO_GUILD_ID'; // Would be real Discord server ID
        this.webhookUrl = 'DEMO_WEBHOOK_URL'; // Would be real webhook URL

        this.commands = this.getDiscordCommands();
        this.eventHandlers = this.setupEventHandlers();
    }

    // Discord Slash Commands
    getDiscordCommands() {
        return [
            {
                name: 'aim-stats',
                description: 'Get your aim training statistics',
                type: 'CHAT_INPUT',
                options: [
                    {
                        name: 'username',
                        description: 'Your AimHelper username',
                        type: 'STRING',
                        required: false
                    }
                ],
                handler: this.handleStatsCommand.bind(this)
            },
            {
                name: 'leaderboard',
                description: 'View the community leaderboard',
                type: 'CHAT_INPUT',
                options: [
                    {
                        name: 'category',
                        description: 'Leaderboard category',
                        type: 'STRING',
                        required: false,
                        choices: [
                            { name: 'Overall Score', value: 'score' },
                            { name: 'Accuracy', value: 'accuracy' },
                            { name: 'Reaction Time', value: 'reaction' }
                        ]
                    }
                ],
                handler: this.handleLeaderboardCommand.bind(this)
            },
            {
                name: 'challenge',
                description: 'View or join community challenges',
                type: 'CHAT_INPUT',
                options: [
                    {
                        name: 'action',
                        description: 'What to do with challenges',
                        type: 'STRING',
                        required: false,
                        choices: [
                            { name: 'List Active', value: 'list' },
                            { name: 'Join Challenge', value: 'join' },
                            { name: 'My Progress', value: 'progress' }
                        ]
                    }
                ],
                handler: this.handleChallengeCommand.bind(this)
            },
            {
                name: 'link-account',
                description: 'Link your AimHelper account to Discord',
                type: 'CHAT_INPUT',
                options: [
                    {
                        name: 'username',
                        description: 'Your AimHelper username',
                        type: 'STRING',
                        required: true
                    }
                ],
                handler: this.handleLinkCommand.bind(this)
            },
            {
                name: 'aim-tips',
                description: 'Get personalized aim training tips',
                type: 'CHAT_INPUT',
                options: [
                    {
                        name: 'skill_level',
                        description: 'Your current skill level',
                        type: 'STRING',
                        required: false,
                        choices: [
                            { name: 'Beginner', value: 'beginner' },
                            { name: 'Intermediate', value: 'intermediate' },
                            { name: 'Advanced', value: 'advanced' }
                        ]
                    }
                ],
                handler: this.handleTipsCommand.bind(this)
            },
            {
                name: 'find-duo',
                description: 'Find a practice partner with similar skill level',
                type: 'CHAT_INPUT',
                options: [
                    {
                        name: 'game',
                        description: 'Which game you want to practice for',
                        type: 'STRING',
                        required: false,
                        choices: [
                            { name: 'Valorant', value: 'valorant' },
                            { name: 'CS2', value: 'cs2' },
                            { name: 'Apex Legends', value: 'apex' },
                            { name: 'Any Game', value: 'any' }
                        ]
                    }
                ],
                handler: this.handleFindDuoCommand.bind(this)
            }
        ];
    }

    // Event Handlers
    setupEventHandlers() {
        return {
            // When someone joins the server
            guildMemberAdd: this.handleNewMember.bind(this),

            // When someone posts a message
            messageCreate: this.handleMessage.bind(this),

            // When someone reacts to a message
            messageReactionAdd: this.handleReaction.bind(this),

            // Voice channel events for practice sessions
            voiceStateUpdate: this.handleVoiceUpdate.bind(this)
        };
    }

    // Command Handlers
    async handleStatsCommand(interaction) {
        const username = interaction.options.getString('username') || this.getLinkedUsername(interaction.user.id);

        if (!username) {
            return this.createResponse({
                content: '❌ No username provided and no linked account found. Use `/link-account` first or provide a username.',
                ephemeral: true
            });
        }

        const stats = this.getUserStats(username);

        if (!stats) {
            return this.createResponse({
                content: `❌ No statistics found for username: ${username}`,
                ephemeral: true
            });
        }

        const embed = {
            color: 0x1A73E8,
            title: `🎯 Aim Stats for ${username}`,
            thumbnail: { url: 'https://aimhelperpro.com/assets/aim-icon.png' },
            fields: [
                { name: '📊 Total Tests', value: stats.totalTests.toString(), inline: true },
                { name: '🏆 Best Score', value: stats.bestScore.toString(), inline: true },
                { name: '🎯 Best Accuracy', value: `${stats.bestAccuracy.toFixed(1)}%`, inline: true },
                { name: '⚡ Avg Reaction', value: `${Math.round(stats.avgReaction)}ms`, inline: true },
                { name: '📈 Improvement', value: `+${stats.improvement.toFixed(1)}%`, inline: true },
                { name: '🏅 Global Rank', value: `#${stats.globalRank}`, inline: true }
            ],
            footer: { text: 'Train at aimhelperpro.com' },
            timestamp: new Date().toISOString()
        };

        return this.createResponse({ embeds: [embed] });
    }

    async handleLeaderboardCommand(interaction) {
        const category = interaction.options.getString('category') || 'score';
        const leaderboard = this.getLeaderboard(category);

        const embed = {
            color: 0x34A853,
            title: `🏆 Community Leaderboard - ${category.charAt(0).toUpperCase() + category.slice(1)}`,
            description: leaderboard.slice(0, 10).map((player, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                return `${medal} **${player.name}** - ${this.formatLeaderboardValue(player.value, category)}`;
            }).join('\n'),
            footer: { text: 'View full leaderboard at aimhelperpro.com/community' },
            timestamp: new Date().toISOString()
        };

        return this.createResponse({ embeds: [embed] });
    }

    async handleChallengeCommand(interaction) {
        const action = interaction.options.getString('action') || 'list';
        const challenges = this.getActiveChallenges();

        if (action === 'list') {
            const embed = {
                color: 0xEA4335,
                title: '🎯 Active Community Challenges',
                description: challenges.map(challenge =>
                    `**${challenge.icon} ${challenge.title}**\n${challenge.description}\nReward: ${challenge.rewards.map(r => `${r.icon} ${r.name}`).join(', ')}\n`
                ).join('\n'),
                footer: { text: 'Join challenges at aimhelperpro.com/community' }
            };

            return this.createResponse({ embeds: [embed] });
        } else if (action === 'join') {
            return this.createResponse({
                content: '🎯 To join challenges, visit https://aimhelperpro.com/community and start training!',
                ephemeral: true
            });
        }
    }

    async handleLinkCommand(interaction) {
        const username = interaction.options.getString('username');
        const discordId = interaction.user.id;

        // In a real implementation, this would verify the account exists
        // and create a secure linking process

        this.linkAccount(discordId, username);

        return this.createResponse({
            content: `✅ Successfully linked Discord account to AimHelper username: **${username}**\n\nYou can now use bot commands without specifying your username!`,
            ephemeral: true
        });
    }

    async handleTipsCommand(interaction) {
        const skillLevel = interaction.options.getString('skill_level') || 'beginner';
        const tips = this.getAimTips(skillLevel);

        const embed = {
            color: 0xFBBC05,
            title: `💡 Aim Training Tips - ${skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)}`,
            description: tips.map((tip, index) =>
                `**${index + 1}. ${tip.title}**\n${tip.description}\n`
            ).join('\n'),
            footer: { text: 'Practice these techniques at aimhelperpro.com' }
        };

        return this.createResponse({ embeds: [embed] });
    }

    async handleFindDuoCommand(interaction) {
        const game = interaction.options.getString('game') || 'any';
        const user = interaction.user;

        // In a real implementation, this would match users with similar skill levels
        const embed = {
            color: 0x9C27B0,
            title: '👥 Looking for Practice Partner',
            description: `**${user.displayName}** is looking for a practice partner${game !== 'any' ? ` for ${game}` : ''}!`,
            fields: [
                { name: '🎮 Game', value: game === 'any' ? 'Any Game' : game, inline: true },
                { name: '📞 Contact', value: `<@${user.id}>`, inline: true },
                { name: '⏰ Posted', value: '<t:' + Math.floor(Date.now() / 1000) + ':R>', inline: true }
            ],
            footer: { text: 'React with 🤝 to team up!' }
        };

        return this.createResponse({ embeds: [embed] });
    }

    // Event Handlers
    async handleNewMember(member) {
        const welcomeChannel = await this.getChannel('welcome');
        if (!welcomeChannel) return;

        const embed = {
            color: 0x00FF00,
            title: '🎯 Welcome to AimHelper Pro!',
            description: `Welcome <@${member.user.id}>! Ready to improve your aim?`,
            fields: [
                { name: '🚀 Get Started', value: 'Use `/link-account` to connect your AimHelper account' },
                { name: '📊 View Stats', value: 'Use `/aim-stats` to see your progress' },
                { name: '🏆 Compete', value: 'Check out `/leaderboard` and `/challenge`' },
                { name: '💡 Learn', value: 'Get personalized tips with `/aim-tips`' }
            ],
            footer: { text: 'Start training at aimhelperpro.com' }
        };

        await welcomeChannel.send({ embeds: [embed] });
    }

    async handleMessage(message) {
        if (message.author.bot) return;

        // Auto-react to achievement shares
        if (message.content.includes('aimhelperpro.com') &&
            (message.content.includes('score') || message.content.includes('accuracy'))) {
            await message.react('🎯');
            await message.react('🔥');
        }

        // Respond to help requests
        if (message.content.toLowerCase().includes('help') &&
            message.content.toLowerCase().includes('aim')) {
            await message.reply('🎯 Need help with aim training? Use `/aim-tips` for personalized advice or visit https://aimhelperpro.com/education');
        }
    }

    async handleReaction(reaction, user) {
        if (user.bot) return;

        // Handle practice partner matching
        if (reaction.emoji.name === '🤝' &&
            reaction.message.embeds[0]?.title?.includes('Practice Partner')) {

            const originalUser = reaction.message.embeds[0].fields.find(f => f.name === '📞 Contact')?.value;
            if (originalUser && !originalUser.includes(user.id)) {
                // Create a temporary thread for coordination
                await reaction.message.reply(`🤝 <@${user.id}> wants to practice with ${originalUser}! DM each other to coordinate.`);
            }
        }
    }

    async handleVoiceUpdate(oldState, newState) {
        // Track voice practice sessions
        if (newState.channel && newState.channel.name.includes('aim-practice')) {
            // Log practice session start
            console.log(`User ${newState.member.displayName} joined aim practice voice channel`);
        }
    }

    // Webhook Functions
    async sendAchievementNotification(achievement) {
        const webhook = {
            content: null,
            embeds: [{
                color: 0x1A73E8,
                title: '🏆 New Achievement Unlocked!',
                description: `**${achievement.playerName}** just earned the **${achievement.achievement.title}** achievement!`,
                fields: [
                    { name: '📋 Description', value: achievement.achievement.description },
                    { name: '📊 Score', value: achievement.score?.toString() || 'N/A', inline: true },
                    { name: '🎯 Accuracy', value: `${achievement.accuracy}%` || 'N/A', inline: true }
                ],
                footer: { text: 'Compete at aimhelperpro.com' },
                timestamp: new Date(achievement.timestamp).toISOString()
            }],
            username: 'AimHelper Pro',
            avatar_url: 'https://aimhelperpro.com/assets/bot-avatar.png'
        };

        return this.sendWebhook(webhook);
    }

    async sendLeaderboardUpdate() {
        const topPlayers = this.getLeaderboard('score').slice(0, 3);

        const webhook = {
            embeds: [{
                color: 0x34A853,
                title: '📈 Weekly Leaderboard Update',
                description: 'Here are this week\'s top performers:',
                fields: topPlayers.map((player, index) => ({
                    name: `${index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} ${player.name}`,
                    value: `Score: ${player.value} • Accuracy: ${player.accuracy}%`,
                    inline: false
                })),
                footer: { text: 'View full rankings at aimhelperpro.com/community' }
            }],
            username: 'AimHelper Pro'
        };

        return this.sendWebhook(webhook);
    }

    // Utility Functions
    createResponse(options) {
        return {
            type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
            data: options
        };
    }

    getUserStats(username) {
        // This would fetch real user statistics
        // For demo purposes, return simulated data
        return {
            totalTests: Math.floor(Math.random() * 100) + 10,
            bestScore: Math.floor(Math.random() * 1500) + 500,
            bestAccuracy: Math.random() * 30 + 70,
            avgReaction: Math.random() * 100 + 200,
            improvement: Math.random() * 50 + 10,
            globalRank: Math.floor(Math.random() * 1000) + 1
        };
    }

    getLeaderboard(category) {
        // Simulated leaderboard data
        const players = ['AimGod2024', 'SniperElite', 'HeadshotHero', 'FlickMaster', 'PrecisionPro'];
        return players.map((name, index) => ({
            name,
            value: 2000 - (index * 150),
            accuracy: 95 - (index * 2)
        }));
    }

    getActiveChallenges() {
        return [
            {
                icon: '🎯',
                title: 'Accuracy Master',
                description: 'Achieve 80% average accuracy',
                rewards: [{ icon: '🏆', name: 'Precision Pro Badge' }]
            },
            {
                icon: '⚡',
                title: 'Speed Demon',
                description: 'Get reaction time under 200ms',
                rewards: [{ icon: '🔥', name: 'Lightning Badge' }]
            }
        ];
    }

    getAimTips(skillLevel) {
        const tips = {
            beginner: [
                { title: 'Lower Your Sensitivity', description: 'Start with 8-16in/360° for better control' },
                { title: 'Proper Posture', description: 'Keep your arm on the desk, wrist straight' },
                { title: 'Crosshair Placement', description: 'Keep crosshair at head level when moving' }
            ],
            intermediate: [
                { title: 'Practice Tracking', description: 'Focus on smooth target following exercises' },
                { title: 'Flick Consistency', description: 'Work on stopping exactly on target' },
                { title: 'Movement + Aim', description: 'Practice counter-strafing while aiming' }
            ],
            advanced: [
                { title: 'Micro-adjustments', description: 'Master tiny corrections after flicks' },
                { title: 'Target Switching', description: 'Minimize time between multiple targets' },
                { title: 'Scenario Training', description: 'Practice game-specific situations' }
            ]
        };

        return tips[skillLevel] || tips.beginner;
    }

    linkAccount(discordId, username) {
        // In production, this would store the link securely
        const links = JSON.parse(localStorage.getItem('discord_links') || '{}');
        links[discordId] = username;
        localStorage.setItem('discord_links', JSON.stringify(links));
    }

    getLinkedUsername(discordId) {
        const links = JSON.parse(localStorage.getItem('discord_links') || '{}');
        return links[discordId];
    }

    formatLeaderboardValue(value, category) {
        switch (category) {
            case 'accuracy': return `${value.toFixed(1)}%`;
            case 'reaction': return `${Math.round(value)}ms`;
            default: return value.toString();
        }
    }

    async sendWebhook(data) {
        // In production, this would send to actual Discord webhook
        console.log('Discord Webhook:', data);
        return { success: true };
    }

    async getChannel(name) {
        // Mock channel retrieval
        return { send: (data) => console.log('Channel message:', data) };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiscordIntegration;
} else {
    window.DiscordIntegration = DiscordIntegration;
}