/**
 * AimHelper Pro - Professional Sensitivity Converter
 * Accurate multi-game sensitivity conversion using verified multipliers
 */

// Game database with verified sensitivity multipliers
const GAMES_DATABASE = {
    // Source Engine Based
    'cs2': {
        name: 'CS2 / CS:GO',
        multiplier: 0.022,
        category: 'tactical',
        icon: '💥',
        engine: 'source'
    },
    'apex': {
        name: 'Apex Legends',
        multiplier: 0.022,
        category: 'battle-royale',
        icon: '🔥',
        engine: 'source'
    },
    'cod': {
        name: 'Call of Duty',
        multiplier: 0.022,
        category: 'arcade',
        icon: '🔫',
        engine: 'proprietary'
    },
    'tf2': {
        name: 'Team Fortress 2',
        multiplier: 0.022,
        category: 'arena',
        icon: '🤖',
        engine: 'source'
    },
    'left4dead2': {
        name: 'Left 4 Dead 2',
        multiplier: 0.022,
        category: 'coop',
        icon: '🧟',
        engine: 'source'
    },

    // Riot Games
    'valorant': {
        name: 'Valorant',
        multiplier: 0.07,
        category: 'tactical',
        icon: '🎯',
        engine: 'unreal'
    },

    // Blizzard Games
    'overwatch': {
        name: 'Overwatch 2',
        multiplier: 0.0066,
        category: 'hero-shooter',
        icon: '⚡',
        engine: 'proprietary'
    },

    // Epic Games
    'fortnite': {
        name: 'Fortnite',
        multiplier: 0.005555,
        category: 'battle-royale',
        icon: '🏗️',
        engine: 'unreal'
    },

    // Ubisoft
    'rainbow6': {
        name: 'Rainbow Six Siege',
        multiplier: 0.00573,
        category: 'tactical',
        icon: '🛡️',
        engine: 'anvil'
    },

    // PUBG Corp
    'pubg': {
        name: 'PUBG',
        multiplier: 0.00555,
        category: 'battle-royale',
        icon: '🎖️',
        engine: 'unreal'
    },

    // Additional Popular Games
    'quake': {
        name: 'Quake Champions',
        multiplier: 0.022,
        category: 'arena',
        icon: '⚡',
        engine: 'id-tech'
    },
    'doom': {
        name: 'DOOM Eternal',
        multiplier: 0.022,
        category: 'arena',
        icon: '👹',
        engine: 'id-tech'
    },
    'destiny2': {
        name: 'Destiny 2',
        multiplier: 0.0066,
        category: 'mmo-fps',
        icon: '🌟',
        engine: 'tiger'
    },
    'warframe': {
        name: 'Warframe',
        multiplier: 0.022,
        category: 'pve-fps',
        icon: '🥷',
        engine: 'evolution'
    },
    'battlefield': {
        name: 'Battlefield',
        multiplier: 0.0222,
        category: 'large-scale',
        icon: '💥',
        engine: 'frostbite'
    },
    'hunt': {
        name: 'Hunt: Showdown',
        multiplier: 0.022,
        category: 'tactical',
        icon: '🤠',
        engine: 'cryengine'
    },
    'tarkov': {
        name: 'Escape from Tarkov',
        multiplier: 0.0335,
        category: 'tactical',
        icon: '🪖',
        engine: 'unity'
    },
    'marvelrivals': {
        name: 'Marvel Rivals',
        multiplier: 0.0066,
        category: 'hero-shooter',
        icon: '🦸',
        engine: 'proprietary'
    }
};

class SensitivityConverter {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.generateGamesGrid();
        this.updateConversion();
        this.initializeProComparison();
    }

    initializeElements() {
        this.elements = {
            fromGame: document.getElementById('fromGame'),
            toGame: document.getElementById('toGame'),
            inputSensitivity: document.getElementById('inputSensitivity'),
            inputDPI: document.getElementById('inputDPI'),
            convertedSensitivity: document.getElementById('convertedSensitivity'),
            resultGameName: document.getElementById('resultGameName'),
            effectiveDPI: document.getElementById('effectiveDPI'),
            inches360: document.getElementById('inches360'),
            cm360: document.getElementById('cm360'),
            swapGames: document.getElementById('swapGames'),
            copyResult: document.getElementById('copyResult'),
            saveSettings: document.getElementById('saveSettings'),
            gamesGrid: document.getElementById('gamesGrid'),
            inputFOV: document.getElementById('inputFOV'),
            aspectRatio: document.getElementById('aspectRatio'),
            windowsSens: document.getElementById('windowsSens'),
            mouseHz: document.getElementById('mouseHz'),
            edpiRank: document.getElementById('edpiRank'),
            similarPros: document.getElementById('similarPros')
        };
    }

    bindEvents() {
        // Main conversion inputs
        [this.elements.fromGame, this.elements.toGame, this.elements.inputSensitivity, this.elements.inputDPI].forEach(element => {
            element.addEventListener('input', () => this.updateConversion());
            element.addEventListener('change', () => this.updateConversion());
        });

        // Advanced inputs
        [this.elements.inputFOV, this.elements.aspectRatio, this.elements.windowsSens, this.elements.mouseHz].forEach(element => {
            element.addEventListener('input', () => this.updateConversion());
            element.addEventListener('change', () => this.updateConversion());
        });

        // Swap button
        this.elements.swapGames.addEventListener('click', () => this.swapGames());

        // Action buttons
        this.elements.copyResult.addEventListener('click', () => this.copyResult());
        this.elements.saveSettings.addEventListener('click', () => this.saveSettings());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'c' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.copyResult();
            }
        });
    }

    updateConversion() {
        const fromGame = this.elements.fromGame.value;
        const toGame = this.elements.toGame.value;
        const sensitivity = parseFloat(this.elements.inputSensitivity.value) || 1.0;
        const dpi = parseInt(this.elements.inputDPI.value) || 800;

        // Get game multipliers
        const fromMultiplier = GAMES_DATABASE[fromGame]?.multiplier || 0.022;
        const toMultiplier = GAMES_DATABASE[toGame]?.multiplier || 0.022;

        // Convert sensitivity
        const convertedSens = this.calculateConvertedSensitivity(sensitivity, fromMultiplier, toMultiplier);

        // Calculate metrics
        const effectiveDPI = dpi * sensitivity;
        const inches360 = this.calculateInches360(dpi, sensitivity);

        // Update display
        this.elements.convertedSensitivity.textContent = convertedSens.toFixed(3);
        this.elements.resultGameName.textContent = `for ${GAMES_DATABASE[toGame]?.name || toGame}`;
        this.elements.effectiveDPI.textContent = Math.round(effectiveDPI);
        this.elements.inches360.textContent = inches360.toFixed(1);
        this.elements.cm360.textContent = inches360.toFixed(1);

        // Update pro comparison
        this.updateProComparison(effectiveDPI);

        // Add visual feedback
        this.animateResultUpdate();
    }

    calculateConvertedSensitivity(sensitivity, fromMultiplier, toMultiplier) {
        // Standard conversion formula: new_sens = old_sens * (from_multiplier / to_multiplier)
        return sensitivity * (fromMultiplier / toMultiplier);
    }

    calculateInches360(dpi, sensitivity) {
        // Correct gaming formula for inches/360: uses mouse DPI and in-game sensitivity
        // Standard calculation: 800 DPI × 1.0 sens = ~12.6 inches for 360° turn
        // Formula: inches = counts_per_360 / DPI, where counts_per_360 ≈ 10,080 for most games
        return 10080 / (dpi * sensitivity);
    }

    swapGames() {
        const fromValue = this.elements.fromGame.value;
        const toValue = this.elements.toGame.value;

        this.elements.fromGame.value = toValue;
        this.elements.toGame.value = fromValue;

        // Add swap animation
        this.elements.swapGames.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            this.elements.swapGames.style.transform = 'rotate(0deg)';
        }, 300);

        this.updateConversion();
    }

    generateGamesGrid() {
        const gamesGrid = this.elements.gamesGrid;
        gamesGrid.innerHTML = '';

        Object.entries(GAMES_DATABASE).forEach(([gameId, game]) => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            gameCard.innerHTML = `
                <div class="game-icon">${game.icon}</div>
                <div class="game-name">${game.name}</div>
                <div class="game-category">${game.category}</div>
            `;

            gameCard.addEventListener('click', () => {
                this.elements.toGame.value = gameId;
                this.updateConversion();

                // Highlight selected game
                document.querySelectorAll('.game-card').forEach(card => card.classList.remove('selected'));
                gameCard.classList.add('selected');
            });

            gamesGrid.appendChild(gameCard);
        });
    }

    copyResult() {
        const result = `${GAMES_DATABASE[this.elements.toGame.value]?.name}: ${this.elements.convertedSensitivity.textContent}`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(result).then(() => {
                this.showNotification('✅ Copied to clipboard!', 'success');
            }).catch(() => {
                this.fallbackCopy(result);
            });
        } else {
            this.fallbackCopy(result);
        }
    }

    fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.showNotification('✅ Copied to clipboard!', 'success');
    }

    saveSettings() {
        const settings = {
            fromGame: this.elements.fromGame.value,
            toGame: this.elements.toGame.value,
            sensitivity: parseFloat(this.elements.inputSensitivity.value),
            dpi: parseInt(this.elements.inputDPI.value),
            convertedSensitivity: parseFloat(this.elements.convertedSensitivity.textContent),
            timestamp: Date.now()
        };

        localStorage.setItem('aimhelper_converter_settings', JSON.stringify(settings));
        this.showNotification('💾 Settings saved to profile!', 'success');
    }

    updateProComparison(effectiveDPI) {
        // Pro player eDPI ranges (simplified for demo)
        let rank = 'Medium';
        let percentage = 50;
        let similarPros = 'Professional Players';

        if (effectiveDPI < 400) {
            rank = 'Very Low';
            percentage = 15;
            similarPros = 'f0rest, NEO, markeloff';
        } else if (effectiveDPI < 600) {
            rank = 'Low';
            percentage = 25;
            similarPros = 'device, ZywOo, s1mple';
        } else if (effectiveDPI < 1000) {
            rank = 'Medium';
            percentage = 45;
            similarPros = 'TenZ, Aspas, Chronicle';
        } else if (effectiveDPI < 1400) {
            rank = 'High';
            percentage = 75;
            similarPros = 'Hiko, steel, FNS';
        } else {
            rank = 'Very High';
            percentage = 90;
            similarPros = 'woxic, ropz (old), subroza';
        }

        this.elements.edpiRank.textContent = `${rank} (Top ${percentage}%)`;
        this.elements.similarPros.textContent = similarPros;
    }

    initializeProComparison() {
        // Load saved settings if available
        const saved = localStorage.getItem('aimhelper_converter_settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.elements.fromGame.value = settings.fromGame || 'cs2';
                this.elements.toGame.value = settings.toGame || 'valorant';
                this.elements.inputSensitivity.value = settings.sensitivity || 1.0;
                this.elements.inputDPI.value = settings.dpi || 800;
                this.updateConversion();
            } catch (e) {
                console.log('Could not load saved settings');
            }
        }
    }

    animateResultUpdate() {
        this.elements.convertedSensitivity.style.transform = 'scale(1.1)';
        this.elements.convertedSensitivity.style.color = 'var(--current-category-color, var(--brand-primary))';

        setTimeout(() => {
            this.elements.convertedSensitivity.style.transform = 'scale(1)';
            this.elements.convertedSensitivity.style.color = '';
        }, 200);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--bg-card-elevated);
            color: var(--text-primary);
            padding: 12px 20px;
            border-radius: var(--radius-base);
            border: 1px solid var(--current-category-color, var(--border-primary));
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize converter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SensitivityConverter();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);