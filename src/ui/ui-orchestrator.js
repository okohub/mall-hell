// ============================================
// UI SYSTEM - User Interface Management
// ============================================
// DOM manipulation and visual feedback for HUD, popups, and menus.
// Depends on UI constants from ui.js.

const UIOrchestrator = {
    // Cached DOM elements
    elements: {
        uiLayer: null,
        scoreElement: null,
        scoreContainer: null,
        timerDisplay: null,
        timerFill: null,
        hitMarker: null,
        healthFill: null,
        healthValue: null,
        healthContainer: null,
        ammoDisplay: null,
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

    // Track pending timeouts for cleanup
    _pendingTimeouts: [],

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
        this.elements.healthFill = document.getElementById('health-fill');
        this.elements.healthValue = document.getElementById('health-value');
        this.elements.healthContainer = document.getElementById('health-container');
        this.elements.ammoDisplay = document.getElementById('ammo-display');
        this.elements.damageOverlay = document.getElementById('damage-overlay');
        this.elements.hud = document.getElementById('hud');
        this.elements.menuScreen = document.getElementById('menu-screen');
        this.elements.gameoverScreen = document.getElementById('gameover-screen');
        this.elements.pauseScreen = document.getElementById('pause-screen');
        this.elements.finalScoreElement = document.getElementById('final-score');
        this.elements.ratingElement = document.getElementById('rating');
        this.elements.pauseScoreValue = document.getElementById('pause-score-value');
        this.elements.gameoverTitle = document.getElementById('gameover-title');
        this.elements.statusPanel = document.getElementById('status-panel');
        this.elements.skeletonCount = document.getElementById('skeleton-count');
        this.elements.dinoCount = document.getElementById('dino-count');
        this.elements.powerupTimer = document.getElementById('powerup-timer');
        this.elements.powerupTime = document.querySelector('#powerup-timer .powerup-time');
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
    // ENEMY COUNT DISPLAY (Progress Tracking)
    // ==========================================

    /**
     * State for enemy progress tracking
     */
    _totalEnemies: 0,       // Total planned enemies
    _killedEnemies: 0,      // Enemies killed so far

    /**
     * Set total planned enemies (call at game start after planning)
     * @param {number} total - Total enemies planned across all rooms
     */
    setTotalEnemies(total) {
        this._totalEnemies = total;
        this._killedEnemies = 0;
    },

    /**
     * Increment killed enemy count
     * @param {number} count - Number of enemies killed (default 1)
     */
    addKilledEnemy(count = 1) {
        this._killedEnemies += count;
    },

    /**
     * Get progress info
     * @returns {Object} { killed, total, remaining }
     */
    getEnemyProgress() {
        return {
            killed: this._killedEnemies,
            total: this._totalEnemies,
            remaining: this._totalEnemies - this._killedEnemies
        };
    },

    /**
     * Reset enemy progress (call on game reset)
     */
    resetEnemyProgress() {
        this._totalEnemies = 0;
        this._killedEnemies = 0;
    },

    /**
     * Update the enemy count display with progress
     * Shows "KILLED / TOTAL" format
     * @param {Object} counts - Object with active enemy counts { skeleton: N, dinosaur: N }
     */
    updateEnemyCount(counts) {
        const { skeleton = 0, dinosaur = 0 } = counts;
        const totalActive = skeleton + dinosaur;
        const remaining = this._totalEnemies - this._killedEnemies;

        // Update the progress display element (shows killed / total)
        const progressEl = document.getElementById('enemy-progress');
        if (progressEl) {
            progressEl.textContent = `${this._killedEnemies} / ${this._totalEnemies}`;
        }

        // Update skeleton count (now shows remaining of this type)
        if (this.elements.skeletonCount) {
            const valueEl = this.elements.skeletonCount.querySelector('.enemy-value');
            if (valueEl) valueEl.textContent = skeleton;
            this.elements.skeletonCount.classList.toggle('has-enemies', skeleton > 0);
        }

        // Update dinosaur count
        if (this.elements.dinoCount) {
            const valueEl = this.elements.dinoCount.querySelector('.enemy-value');
            if (valueEl) valueEl.textContent = dinosaur;
            this.elements.dinoCount.classList.toggle('has-enemies', dinosaur > 0);
        }

        // Check for victory condition (all enemies killed)
        if (this._totalEnemies > 0 && remaining <= 0 && totalActive === 0) {
            // Victory! All enemies cleared
            const panel = document.getElementById('status-panel');
            if (panel) {
                panel.classList.add('all-cleared');
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

    /**
     * Show pickup notification at center-bottom of screen
     * @param {string} text - Notification text (e.g., "Water Gun" or "+50 Ammo")
     */
    showPickupNotification(text) {
        const notification = document.createElement('div');
        notification.className = 'pickup-notification';
        notification.textContent = text;
        notification.style.cssText = `
            position: fixed;
            bottom: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: #00ff88;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            border: 2px solid #00ff88;
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
            z-index: 1000;
            animation: pickupPop 0.3s ease-out, pickupFade 0.5s ease-in 1.2s forwards;
            pointer-events: none;
        `;

        // Add animation keyframes if not exists
        if (!document.getElementById('pickup-animation-style')) {
            const style = document.createElement('style');
            style.id = 'pickup-animation-style';
            style.textContent = `
                @keyframes pickupPop {
                    0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
                    100% { transform: translateX(-50%) scale(1); opacity: 1; }
                }
                @keyframes pickupFade {
                    0% { opacity: 1; }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 1700);
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

    /**
     * Update power-up timer display
     * @param {number} timeRemaining - Time remaining in milliseconds
     * @param {string} powerupType - Type of power-up (for customization)
     */
    updatePowerUpTimer(timeRemaining, powerupType) {
        if (!this.elements.powerupTimer || !this.elements.powerupTime) return;

        const timer = this.elements.powerupTimer;
        const timeDisplay = this.elements.powerupTime;

        if (timeRemaining <= 0) {
            timer.style.display = 'none';
            timer.classList.remove('warning', 'critical');
            return;
        }

        timer.style.display = 'flex';
        const seconds = (timeRemaining / 1000).toFixed(1);
        timeDisplay.textContent = seconds + 's';

        timer.classList.remove('warning', 'critical');
        if (timeRemaining <= 1000) {
            timer.classList.add('critical');
        } else if (timeRemaining <= 3000) {
            timer.classList.add('warning');
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
     * Clear all pending UI timeouts
     */
    clearPendingTimeouts() {
        this._pendingTimeouts.forEach(id => clearTimeout(id));
        this._pendingTimeouts = [];
    },

    /**
     * Show menu screen
     */
    showMenu() {
        this.clearPendingTimeouts();
        if (this.elements.menuScreen) this.elements.menuScreen.style.display = 'flex';
        if (this.elements.gameoverScreen) this.elements.gameoverScreen.style.display = 'none';
        if (this.elements.pauseScreen) this.elements.pauseScreen.style.display = 'none';
        if (this.elements.hud) this.elements.hud.style.display = 'none';
        if (this.elements.healthContainer) this.elements.healthContainer.style.display = 'none';
        if (this.elements.ammoDisplay) this.elements.ammoDisplay.style.display = 'none';
        this.hideMinimap();
        this.hideObjective();
        // Remove any lingering boss warnings
        document.querySelectorAll('.boss-warning').forEach(el => el.remove());
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
        if (this.elements.ammoDisplay) this.elements.ammoDisplay.style.display = 'block';
        this.showMinimap();
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
        if (this.elements.ammoDisplay) this.elements.ammoDisplay.style.display = 'none';
        this.hideMinimap();
    },

    /**
     * Hide pause screen and restore HUD
     */
    hidePause() {
        if (this.elements.pauseScreen) this.elements.pauseScreen.style.display = 'none';
        if (this.elements.hud) this.elements.hud.style.display = 'block';
        if (this.elements.healthContainer) this.elements.healthContainer.style.display = 'block';
        if (this.elements.ammoDisplay) this.elements.ammoDisplay.style.display = 'block';
        this.showMinimap();
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
        if (this.elements.ammoDisplay) this.elements.ammoDisplay.style.display = 'none';
        this.hideMinimap();

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
    },

    // ==========================================
    // CROSSHAIR & AIMING
    // ==========================================

    /**
     * Update crosshair position and target lock visual
     * @param {number} x - Screen X position
     * @param {number} y - Screen Y position
     * @param {boolean} hasTarget - Whether there's a locked target
     */
    updateCrosshairUI(x, y, hasTarget) {
        const crosshairEl = document.getElementById('crosshair');
        if (crosshairEl) {
            if (hasTarget) {
                crosshairEl.classList.add('target-locked');
            } else {
                crosshairEl.classList.remove('target-locked');
            }
            crosshairEl.style.left = x + 'px';
            crosshairEl.style.top = y + 'px';
        }
    },

    /**
     * Show boss warning notification
     * @param {string} text - Warning text (e.g., "DINO BOSS!")
     */
    showBossWarning(text) {
        // Reuse existing warning element to prevent accumulation
        let warning = document.querySelector('.boss-warning');
        if (warning) {
            // Reset animation by removing and re-adding
            warning.remove();
        }
        warning = document.createElement('div');
        warning.className = 'boss-warning';
        warning.textContent = text;
        document.body.appendChild(warning);
        // Match animation duration: 0.25s * 3 iterations = 0.75s + small buffer
        this._pendingTimeouts.push(setTimeout(() => warning.remove(), 1000));
    },

    /**
     * Update tension indicator UI
     * @param {number} x - Screen X position (follows crosshair)
     * @param {number} y - Screen Y position
     * @param {boolean} isCharging - Whether currently charging
     * @param {number} tension - Current tension value (0-1)
     * @param {number} maxTension - Maximum tension value
     */
    updateTensionUI(x, y, isCharging, tension, maxTension = 1.0) {
        const tensionEl = document.getElementById('tension-indicator');
        if (!tensionEl) return;

        tensionEl.style.left = x + 'px';
        tensionEl.style.top = y + 'px';

        if (isCharging) {
            tensionEl.classList.add('charging');

            // Update tension class for color
            tensionEl.classList.remove('medium', 'high', 'max');
            if (tension >= maxTension) {
                tensionEl.classList.add('max');
            } else if (tension >= 0.7) {
                tensionEl.classList.add('high');
            } else if (tension >= 0.4) {
                tensionEl.classList.add('medium');
            }

            // Update arc fill (283 = circumference of r=45 circle)
            const fillEl = tensionEl.querySelector('.tension-fill');
            if (fillEl) {
                const dashOffset = 283 * (1 - tension);
                fillEl.style.strokeDashoffset = dashOffset;
            }

            // Update text
            const textEl = document.getElementById('tension-text');
            if (textEl) {
                const power = Math.round(tension * 100);
                textEl.textContent = power >= 100 ? 'MAX POWER!' : power + '%';
            }
        } else {
            tensionEl.classList.remove('charging', 'medium', 'high', 'max');
        }
    },

    // ==========================================
    // OBJECTIVE DISPLAY
    // ==========================================

    /**
     * Show the objective text at game start
     * Automatically fades out after delay
     */
    showObjective() {
        const objectiveEl = document.getElementById('objective-display');
        if (!objectiveEl) return;

        objectiveEl.classList.add('show');
        objectiveEl.classList.remove('fade-out');

        // Start fade out after 1.5 seconds (animation runs 0.8s * 2 = 1.6s)
        this._pendingTimeouts.push(setTimeout(() => {
            objectiveEl.classList.add('fade-out');
        }, 1500));

        // Hide completely after fade (1.5s display + 1s fade)
        this._pendingTimeouts.push(setTimeout(() => {
            objectiveEl.classList.remove('show', 'fade-out');
        }, 2500));
    },

    /**
     * Hide objective display immediately
     */
    hideObjective() {
        const objectiveEl = document.getElementById('objective-display');
        if (objectiveEl) {
            objectiveEl.classList.remove('show', 'fade-out');
        }
    },

    // ==========================================
    // MINIMAP
    // ==========================================

    /**
     * Initialize minimap with room grid
     * @param {Array} rooms - Array of room data from RoomOrchestrator.getAllRooms()
     */
    initMinimap(rooms) {
        const gridEl = document.getElementById('minimap-grid');
        if (!gridEl) return;

        // Find grid bounds
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        rooms.forEach(room => {
            if (room) {
                minX = Math.min(minX, room.gridX);
                maxX = Math.max(maxX, room.gridX);
                minZ = Math.min(minZ, room.gridZ);
                maxZ = Math.max(maxZ, room.gridZ);
            }
        });

        const cols = maxX - minX + 1;
        const rows = maxZ - minZ + 1;

        // Set grid template
        gridEl.style.gridTemplateColumns = `repeat(${cols}, 34px)`;
        gridEl.style.gridTemplateRows = `repeat(${rows}, 34px)`;

        // Clear existing
        gridEl.innerHTML = '';

        // Create room map for quick lookup
        const roomMap = new Map();
        rooms.forEach(room => {
            if (room) {
                roomMap.set(`${room.gridX}_${room.gridZ}`, room);
            }
        });

        // Create grid cells (top to bottom, left to right)
        for (let z = minZ; z <= maxZ; z++) {
            for (let x = minX; x <= maxX; x++) {
                const room = roomMap.get(`${x}_${z}`);
                const cell = document.createElement('div');
                cell.className = 'minimap-room';
                cell.dataset.gridX = x;
                cell.dataset.gridZ = z;

                if (room) {
                    cell.dataset.roomKey = `${x}_${z}`;
                    if (room.theme === 'ENTRANCE') {
                        cell.classList.add('entrance');
                    }
                } else {
                    cell.style.visibility = 'hidden';
                }

                gridEl.appendChild(cell);
            }
        }
    },

    /**
     * Update minimap with current game state (LIVE data only)
     * @param {Object} options - Update options
     * @param {Object} options.currentRoom - Player's current room
     * @param {Array} options.enemies - Array of active enemy meshes
     * @param {Object} options.gridOrchestrator - Grid system for room lookup
     * @param {Object} options.roomConfig - Room config {UNIT}
     */
    updateMinimap(options) {
        const { currentRoom, enemies, gridOrchestrator, roomConfig } = options;
        const gridEl = document.getElementById('minimap-grid');
        if (!gridEl) return;

        // Count LIVE enemies per room
        const roomEnemyCounts = new Map();
        const roomHasDino = new Map();

        enemies.forEach(enemy => {
            if (!enemy.userData.active) return;

            const room = gridOrchestrator.getRoomAtWorld(enemy.position.x, enemy.position.z);
            if (room) {
                const key = `${room.gridX}_${room.gridZ}`;
                roomEnemyCounts.set(key, (roomEnemyCounts.get(key) || 0) + 1);
                if (enemy.userData.type === 'DINOSAUR') {
                    roomHasDino.set(key, true);
                }
            }
        });

        // Update all room cells
        const cells = gridEl.querySelectorAll('.minimap-room');
        cells.forEach(cell => {
            const roomKey = cell.dataset.roomKey;
            if (!roomKey) return;

            const gx = parseInt(cell.dataset.gridX);
            const gz = parseInt(cell.dataset.gridZ);
            const isCurrent = currentRoom && currentRoom.gridX === gx && currentRoom.gridZ === gz;
            const enemyCount = roomEnemyCounts.get(roomKey) || 0;
            const hasDino = roomHasDino.get(roomKey) || false;

            // Reset classes (keep entrance class)
            cell.classList.remove('current', 'has-enemies', 'has-dino', 'cleared');

            // Current room gets yellow border indicator
            if (isCurrent) {
                cell.classList.add('current');
            }

            // Show enemy count or cleared state
            if (enemyCount > 0) {
                cell.classList.add('has-enemies');
                if (hasDino) cell.classList.add('has-dino');
                cell.textContent = enemyCount;
            } else {
                cell.classList.add('cleared');
                cell.textContent = '';
            }
        });
    },

    /**
     * Show status panel (enemy info + minimap)
     */
    showMinimap() {
        const panel = document.getElementById('status-panel');
        if (panel) panel.style.display = 'flex';
    },

    /**
     * Hide status panel
     */
    hideMinimap() {
        const panel = document.getElementById('status-panel');
        if (panel) panel.style.display = 'none';
    }
};
