// ============================================
// UI SYSTEM - User Interface Management
// ============================================
// DOM manipulation and visual feedback for HUD, popups, and menus.
// Depends on UI constants from ui.js.

const UISystem = {
    // Cached DOM elements
    elements: {
        uiLayer: null,
        scoreElement: null,
        scoreContainer: null,
        timerDisplay: null,
        timerFill: null,
        hitMarker: null,
        cooldownFill: null,
        healthFill: null,
        healthValue: null,
        healthContainer: null,
        damageOverlay: null,
        hud: null,
        menuScreen: null,
        gameoverScreen: null,
        pauseScreen: null,
        finalScoreElement: null,
        ratingElement: null,
        pauseScoreValue: null,
        gameoverTitle: null
    },

    /**
     * Initialize UI by caching DOM elements
     */
    init() {
        this.elements.uiLayer = document.getElementById('ui-layer');
        this.elements.scoreElement = document.getElementById('score');
        this.elements.scoreContainer = document.getElementById('score-container');
        this.elements.timerDisplay = document.getElementById('timer-display');
        this.elements.timerFill = document.getElementById('timer-fill');
        this.elements.hitMarker = document.getElementById('hit-marker');
        this.elements.cooldownFill = document.getElementById('cooldown-fill');
        this.elements.healthFill = document.getElementById('health-fill');
        this.elements.healthValue = document.getElementById('health-value');
        this.elements.healthContainer = document.getElementById('health-container');
        this.elements.damageOverlay = document.getElementById('damage-overlay');
        this.elements.hud = document.getElementById('hud');
        this.elements.menuScreen = document.getElementById('menu-screen');
        this.elements.gameoverScreen = document.getElementById('gameover-screen');
        this.elements.pauseScreen = document.getElementById('pause-screen');
        this.elements.finalScoreElement = document.getElementById('final-score');
        this.elements.ratingElement = document.getElementById('rating');
        this.elements.pauseScoreValue = document.getElementById('pause-score-value');
        this.elements.gameoverTitle = document.getElementById('gameover-title');
    },

    // ==========================================
    // SCORE DISPLAY
    // ==========================================

    /**
     * Show floating score popup at screen position
     * @param {number} points - Points to display
     * @param {number} screenX - Screen X position
     * @param {number} screenY - Screen Y position
     */
    showScorePopup(points, screenX, screenY) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = '+' + points;
        popup.style.left = screenX + 'px';
        popup.style.top = screenY + 'px';

        if (this.elements.uiLayer) {
            this.elements.uiLayer.appendChild(popup);
            setTimeout(() => popup.remove(), UI.animation.SCORE_POPUP_DURATION);
        }
    },

    /**
     * Update the score display
     * @param {number} score - Current score value
     * @param {boolean} animate - Whether to animate the bump
     */
    updateScore(score, animate = false) {
        if (this.elements.scoreElement) {
            this.elements.scoreElement.textContent = score;

            if (animate) {
                this.elements.scoreElement.classList.add('bump');
                if (this.elements.scoreContainer) {
                    this.elements.scoreContainer.classList.add('bump');
                }
                setTimeout(() => {
                    this.elements.scoreElement.classList.remove('bump');
                    if (this.elements.scoreContainer) {
                        this.elements.scoreContainer.classList.remove('bump');
                    }
                }, UI.animation.SCORE_BUMP_DURATION);
            }
        }
    },

    // ==========================================
    // HIT FEEDBACK
    // ==========================================

    /**
     * Show hit marker feedback
     */
    showHitMarker() {
        if (this.elements.hitMarker) {
            this.elements.hitMarker.classList.add('show');
            setTimeout(() => this.elements.hitMarker.classList.remove('show'), UI.animation.HIT_MARKER_DURATION);
        }
    },

    // ==========================================
    // TIMER DISPLAY
    // ==========================================

    /**
     * Update timer display
     * @param {number} gameTimer - Current time remaining
     * @param {number} gameDuration - Total game duration
     */
    updateTimerDisplay(gameTimer, gameDuration) {
        const minutes = Math.floor(gameTimer / 60);
        const seconds = Math.floor(gameTimer % 60);
        const timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (this.elements.timerDisplay) {
            this.elements.timerDisplay.textContent = timerText;
        }

        // Update timer bar fill
        const progress = gameTimer / gameDuration;
        if (this.elements.timerFill) {
            this.elements.timerFill.style.width = `${progress * 100}%`;
        }
    },

    // ==========================================
    // COOLDOWN INDICATOR
    // ==========================================

    /**
     * Update cooldown indicator
     * @param {number} elapsed - Time elapsed since last shot
     * @param {number} cooldown - Total cooldown duration
     */
    updateCooldownIndicator(elapsed, cooldown) {
        const progress = Math.min(elapsed / cooldown, 1);
        const degrees = progress * 360;

        if (this.elements.cooldownFill) {
            this.elements.cooldownFill.style.transform = `rotate(${degrees}deg)`;
            this.elements.cooldownFill.style.borderTopColor = progress >= 1 ? UI.colors.COOLDOWN_READY : UI.colors.COOLDOWN_CHARGING;
        }
    },

    // ==========================================
    // HEALTH BAR
    // ==========================================

    /**
     * Update health bar display
     * @param {number} health - Current health
     * @param {number} maxHealth - Maximum health
     */
    updateHealthBar(health, maxHealth) {
        const healthPercent = Math.max(0, health / maxHealth) * 100;

        if (this.elements.healthFill) {
            this.elements.healthFill.style.width = healthPercent + '%';
            // Update health bar gradient position (shows color based on health)
            this.elements.healthFill.style.backgroundPosition = (100 - healthPercent) + '% 0';
        }

        if (this.elements.healthValue) {
            this.elements.healthValue.textContent = Math.ceil(health);
        }

        // Low health pulsing indicator
        if (this.elements.healthContainer) {
            if (health <= UI.health.LOW_HEALTH_THRESHOLD) {
                this.elements.healthContainer.classList.add('low-health');
            } else {
                this.elements.healthContainer.classList.remove('low-health');
            }
        }
    },

    /**
     * Reset health bar to full
     * @param {number} maxHealth - Maximum health value
     */
    resetHealthBar(maxHealth) {
        if (this.elements.healthFill) {
            this.elements.healthFill.style.width = '100%';
        }
        if (this.elements.healthValue) {
            this.elements.healthValue.textContent = maxHealth;
        }
        if (this.elements.healthContainer) {
            this.elements.healthContainer.classList.remove('low-health');
        }
        if (this.elements.damageOverlay) {
            this.elements.damageOverlay.classList.remove('flash');
        }
    },

    /**
     * Show damage overlay flash effect
     */
    showDamageOverlay() {
        if (this.elements.damageOverlay) {
            this.elements.damageOverlay.classList.add('flash');
            setTimeout(() => {
                this.elements.damageOverlay.classList.remove('flash');
            }, UI.animation.DAMAGE_OVERLAY_DURATION);
        }
    },

    // ==========================================
    // CURSOR
    // ==========================================

    /**
     * Update cursor visibility based on game state
     * @param {boolean} isPlaying - Whether game is in playing state
     * @param {HTMLElement} canvas - Renderer canvas element
     */
    updateCursor(isPlaying, canvas) {
        if (isPlaying) {
            if (canvas) canvas.style.cursor = 'none';
            document.body.style.cursor = 'none';
        } else {
            if (canvas) canvas.style.cursor = 'default';
            document.body.style.cursor = 'default';
        }
    },

    // ==========================================
    // SCREEN TRANSITIONS
    // ==========================================

    /**
     * Show menu screen
     */
    showMenu() {
        if (this.elements.menuScreen) this.elements.menuScreen.style.display = 'flex';
        if (this.elements.gameoverScreen) this.elements.gameoverScreen.style.display = 'none';
        if (this.elements.pauseScreen) this.elements.pauseScreen.style.display = 'none';
        if (this.elements.hud) this.elements.hud.style.display = 'none';
        if (this.elements.healthContainer) this.elements.healthContainer.style.display = 'none';
    },

    /**
     * Show gameplay HUD
     */
    showGameplay() {
        if (this.elements.menuScreen) this.elements.menuScreen.style.display = 'none';
        if (this.elements.gameoverScreen) this.elements.gameoverScreen.style.display = 'none';
        if (this.elements.pauseScreen) this.elements.pauseScreen.style.display = 'none';
        if (this.elements.hud) this.elements.hud.style.display = 'block';
        if (this.elements.healthContainer) this.elements.healthContainer.style.display = 'block';
    },

    /**
     * Show pause screen
     * @param {number} score - Current score to display
     */
    showPause(score) {
        if (this.elements.pauseScreen) this.elements.pauseScreen.style.display = 'flex';
        if (this.elements.pauseScoreValue) this.elements.pauseScoreValue.textContent = score;
        if (this.elements.hud) this.elements.hud.style.display = 'none';
        if (this.elements.healthContainer) this.elements.healthContainer.style.display = 'none';
    },

    /**
     * Hide pause screen and restore HUD
     */
    hidePause() {
        if (this.elements.pauseScreen) this.elements.pauseScreen.style.display = 'none';
        if (this.elements.hud) this.elements.hud.style.display = 'block';
        if (this.elements.healthContainer) this.elements.healthContainer.style.display = 'block';
    },

    /**
     * Show game over screen
     * @param {number} finalScore - Final score
     * @param {string} rating - Score rating text
     * @param {boolean} died - Whether player died
     */
    showGameOver(finalScore, rating, died = false) {
        if (this.elements.gameoverScreen) this.elements.gameoverScreen.style.display = 'flex';
        if (this.elements.hud) this.elements.hud.style.display = 'none';
        if (this.elements.healthContainer) this.elements.healthContainer.style.display = 'none';

        if (this.elements.finalScoreElement) {
            this.elements.finalScoreElement.textContent = finalScore;
        }
        if (this.elements.ratingElement) {
            this.elements.ratingElement.textContent = rating;
        }
        if (this.elements.gameoverTitle) {
            this.elements.gameoverTitle.textContent = died ? 'WRECKED!' : "TIME'S UP!";
        }
    },

    // ==========================================
    // UTILITY
    // ==========================================

    /**
     * Convert 3D world position to 2D screen coordinates
     * @param {THREE.Vector3} worldPos - World position
     * @param {THREE.Camera} camera - Camera for projection
     * @returns {Object} Screen coordinates {x, y}
     */
    worldToScreen(worldPos, camera) {
        const vector = worldPos.clone().project(camera);
        return {
            x: (vector.x * 0.5 + 0.5) * window.innerWidth,
            y: (-vector.y * 0.5 + 0.5) * window.innerHeight
        };
    }
};
