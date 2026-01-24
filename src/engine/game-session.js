// ============================================
// GAME SESSION - Game State Management
// ============================================
// Manages game session state: score, timer, lifecycle.
// Integrates with UISystem for display updates.

const GameSession = {
    // ==========================================
    // CONSTANTS
    // ==========================================
    DURATION: 180,        // Default game duration (3 minutes)
    PLAYER_START_X: 45,   // Player starting X position

    // ==========================================
    // STATE
    // ==========================================
    _score: 0,
    _timer: 0,
    _duration: 180,
    _isActive: false,
    _isPaused: false,
    _playerStartX: 45,
    _camera: null,

    // ==========================================
    // INITIALIZATION
    // ==========================================

    /**
     * Initialize game session
     * @param {Object} options - Optional configuration (camera, duration, playerStartX)
     */
    init(options = {}) {
        this._duration = options.duration ?? this.DURATION;
        this._timer = this._duration;
        this._score = 0;
        this._isActive = false;
        this._isPaused = false;
        this._playerStartX = options.playerStartX ?? this.PLAYER_START_X;
        if (options.camera) this._camera = options.camera;
    },

    /**
     * Set camera reference for screen projections
     * @param {Object} camera - THREE.js camera
     */
    setCamera(camera) {
        this._camera = camera;
    },

    // ==========================================
    // LIFECYCLE
    // ==========================================

    /**
     * Start a new game session
     */
    start() {
        this._score = 0;
        this._timer = this._duration;
        this._isActive = true;
        this._isPaused = false;

        // Update UI
        if (typeof UISystem !== 'undefined') {
            UISystem.updateScore(0, false);
        }
    },

    /**
     * Pause the current session
     */
    pause() {
        if (!this._isActive) return;
        this._isPaused = true;

        // Show pause UI
        if (typeof UISystem !== 'undefined') {
            UISystem.showPause(this._score);
        }
    },

    /**
     * Resume the paused session
     */
    resume() {
        if (!this._isActive) return;
        this._isPaused = false;

        // Hide pause UI
        if (typeof UISystem !== 'undefined') {
            UISystem.hidePause();
        }
    },

    /**
     * End the game session
     * @param {boolean} died - Whether player died (vs time ran out)
     */
    end(died = false) {
        this._isActive = false;
        this._isPaused = false;

        // Show game over UI
        if (typeof UISystem !== 'undefined' && typeof UI !== 'undefined') {
            const rating = UI.getScoreRating(this._score);
            UISystem.showGameOver(this._score, rating, died);
        }
    },

    /**
     * Reset session state (without starting)
     */
    reset() {
        this._score = 0;
        this._timer = this._duration;
        this._isActive = false;
        this._isPaused = false;

        // Update UI
        if (typeof UISystem !== 'undefined') {
            UISystem.updateScore(0, false);
            this.updateTimerDisplay();
        }
    },

    // ==========================================
    // SCORING
    // ==========================================

    /**
     * Add points to score
     * @param {number} points - Points to add
     * @param {Object} position - Optional world position for popup (THREE.Vector3)
     */
    addScore(points, position = null) {
        this._score += points;

        // Update UI
        if (typeof UISystem !== 'undefined') {
            UISystem.updateScore(this._score, true);

            // Show floating popup if position provided
            if (position && this._camera) {
                const screenPos = UISystem.worldToScreen(position, this._camera);
                UISystem.showScorePopup(points, screenPos.x, screenPos.y);
            }
        }
    },

    /**
     * Get current score
     * @returns {number}
     */
    getScore() {
        return this._score;
    },

    /**
     * Set score directly (for testing/loading)
     * @param {number} value
     */
    setScore(value) {
        this._score = value;
        if (typeof UISystem !== 'undefined') {
            UISystem.updateScore(this._score, false);
        }
    },

    // ==========================================
    // TIMER
    // ==========================================

    /**
     * Update timer (call each frame)
     * @param {number} dt - Delta time in seconds
     * @returns {boolean} True if game ended due to timer
     */
    updateTimer(dt) {
        if (!this._isActive || this._isPaused) return false;

        this._timer -= dt;
        if (this._timer <= 0) {
            this._timer = 0;
            this.updateTimerDisplay();
            return true;  // Time's up
        }

        this.updateTimerDisplay();
        return false;
    },

    /**
     * Update timer display in UI
     */
    updateTimerDisplay() {
        if (typeof UISystem !== 'undefined') {
            UISystem.updateTimerDisplay(this._timer, this._duration);
        }
    },

    /**
     * Get remaining time
     * @returns {number} Seconds remaining
     */
    getTimer() {
        return this._timer;
    },

    /**
     * Set timer value directly
     * @param {number} value - Seconds remaining
     */
    setTimer(value) {
        this._timer = value;
        this.updateTimerDisplay();
    },

    /**
     * Get timer percentage (0-1)
     * @returns {number}
     */
    getTimerPercent() {
        return this._timer / this._duration;
    },

    /**
     * Get game duration
     * @returns {number}
     */
    getDuration() {
        return this._duration;
    },

    /**
     * Set game duration
     * @param {number} duration - Duration in seconds
     */
    setDuration(duration) {
        this._duration = duration;
    },

    // ==========================================
    // STATE QUERIES
    // ==========================================

    /**
     * Check if session is active
     * @returns {boolean}
     */
    isActive() {
        return this._isActive;
    },

    /**
     * Check if session is paused
     * @returns {boolean}
     */
    isPaused() {
        return this._isPaused;
    },

    /**
     * Set active state directly (for StateSystem integration)
     * @param {boolean} active
     */
    setActive(active) {
        this._isActive = active;
    },

    /**
     * Set paused state directly
     * @param {boolean} paused
     */
    setPaused(paused) {
        this._isPaused = paused;
    },

    // ==========================================
    // LEGACY COMPATIBILITY
    // ==========================================

    /**
     * Get player starting X position (for test compatibility)
     * @returns {number}
     */
    getPlayerStartX() {
        return this._playerStartX;
    },

    /**
     * Calculate distance-equivalent (for legacy test compatibility)
     * v2 tests expected distance traveled
     * @param {number} cartSpeed - Player cart speed
     * @returns {number}
     */
    getDistanceEquivalent(cartSpeed) {
        return (this._duration - this._timer) * (cartSpeed / 3);
    }
};
