// ============================================
// LOOP SYSTEM - Animation Frame Management
// ============================================
// Manages the game loop with requestAnimationFrame,
// delta time calculation, and update/render callbacks.

const LoopSystem = {
    // THREE.js reference (for Clock)
    _THREE: null,
    _clock: null,

    // Loop state
    _running: false,
    _animationFrameId: null,

    // Callbacks
    _updateCallback: null,
    _renderCallback: null,
    _preUpdateCallbacks: [],
    _postUpdateCallbacks: [],

    // Timing
    _lastTime: 0,
    _deltaTime: 0,
    _maxDeltaTime: 0.1, // Cap to prevent physics explosion after pause
    _totalTime: 0,
    _frameCount: 0,

    // FPS tracking
    _fpsUpdateInterval: 500, // ms
    _fpsLastUpdate: 0,
    _fpsFramesSinceUpdate: 0,
    _currentFps: 0,

    // ==========================================
    // INITIALIZATION
    // ==========================================

    /**
     * Initialize the game loop
     * @param {Object} THREE - THREE.js library reference
     * @param {Object} options - Optional configuration
     */
    init(THREE, options = {}) {
        this._THREE = THREE;

        // Create clock if THREE is available
        if (THREE && THREE.Clock) {
            this._clock = new THREE.Clock();
        }

        // Apply options
        this._maxDeltaTime = options.maxDeltaTime ||
            (typeof Engine !== 'undefined' && Engine.defaults?.render?.maxDeltaTime) ||
            0.1;

        // Reset state
        this._running = false;
        this._lastTime = 0;
        this._deltaTime = 0;
        this._totalTime = 0;
        this._frameCount = 0;
        this._currentFps = 0;
    },

    /**
     * Set the main update callback
     * @param {Function} callback - Update function(deltaTime, totalTime)
     */
    setUpdateCallback(callback) {
        this._updateCallback = callback;
    },

    /**
     * Set the render callback
     * @param {Function} callback - Render function(deltaTime)
     */
    setRenderCallback(callback) {
        this._renderCallback = callback;
    },

    /**
     * Add a pre-update callback (runs before main update)
     * @param {Function} callback - Callback(deltaTime, totalTime)
     */
    addPreUpdate(callback) {
        this._preUpdateCallbacks.push(callback);
    },

    /**
     * Add a post-update callback (runs after main update, before render)
     * @param {Function} callback - Callback(deltaTime, totalTime)
     */
    addPostUpdate(callback) {
        this._postUpdateCallbacks.push(callback);
    },

    /**
     * Remove a pre-update callback
     * @param {Function} callback - Callback to remove
     */
    removePreUpdate(callback) {
        const index = this._preUpdateCallbacks.indexOf(callback);
        if (index !== -1) {
            this._preUpdateCallbacks.splice(index, 1);
        }
    },

    /**
     * Remove a post-update callback
     * @param {Function} callback - Callback to remove
     */
    removePostUpdate(callback) {
        const index = this._postUpdateCallbacks.indexOf(callback);
        if (index !== -1) {
            this._postUpdateCallbacks.splice(index, 1);
        }
    },

    // ==========================================
    // LOOP CONTROL
    // ==========================================

    /**
     * Start the game loop
     */
    start() {
        if (this._running) return;

        this._running = true;
        this._lastTime = performance.now();
        this._fpsLastUpdate = this._lastTime;
        this._fpsFramesSinceUpdate = 0;

        // Reset clock if using THREE.Clock
        if (this._clock) {
            this._clock.start();
            this._clock.getDelta(); // Clear any accumulated delta
        }

        this._loop();
    },

    /**
     * Stop the game loop
     */
    stop() {
        this._running = false;
        if (this._animationFrameId !== null) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
    },

    /**
     * Check if loop is running
     * @returns {boolean}
     */
    isRunning() {
        return this._running;
    },

    /**
     * Reset delta time (call after pause to prevent jump)
     */
    resetDelta() {
        this._lastTime = performance.now();
        this._deltaTime = 0;

        if (this._clock) {
            this._clock.getDelta(); // Clear accumulated delta
        }
    },

    // ==========================================
    // MAIN LOOP
    // ==========================================

    /**
     * Main loop function
     * @private
     */
    _loop() {
        if (!this._running) return;

        this._animationFrameId = requestAnimationFrame(() => this._loop());

        // Calculate delta time
        const currentTime = performance.now();
        let dt;

        if (this._clock) {
            // Use THREE.Clock for consistency with existing code
            dt = this._clock.getDelta();
        } else {
            dt = (currentTime - this._lastTime) / 1000;
            this._lastTime = currentTime;
        }

        // Cap delta time
        dt = Math.min(dt, this._maxDeltaTime);
        this._deltaTime = dt;
        this._totalTime += dt;
        this._frameCount++;

        // Update FPS
        this._updateFps(currentTime);

        // Pre-update callbacks
        for (const cb of this._preUpdateCallbacks) {
            try {
                cb(dt, this._totalTime);
            } catch (err) {
                console.error('LoopSystem pre-update error:', err);
            }
        }

        // Main update
        if (this._updateCallback) {
            try {
                this._updateCallback(dt, this._totalTime);
            } catch (err) {
                console.error('LoopSystem update error:', err);
            }
        }

        // Post-update callbacks
        for (const cb of this._postUpdateCallbacks) {
            try {
                cb(dt, this._totalTime);
            } catch (err) {
                console.error('LoopSystem post-update error:', err);
            }
        }

        // Render
        if (this._renderCallback) {
            try {
                this._renderCallback(dt);
            } catch (err) {
                console.error('LoopSystem render error:', err);
            }
        }
    },

    /**
     * Update FPS counter
     * @private
     */
    _updateFps(currentTime) {
        this._fpsFramesSinceUpdate++;

        if (currentTime - this._fpsLastUpdate >= this._fpsUpdateInterval) {
            this._currentFps = Math.round(
                (this._fpsFramesSinceUpdate * 1000) / (currentTime - this._fpsLastUpdate)
            );
            this._fpsLastUpdate = currentTime;
            this._fpsFramesSinceUpdate = 0;
        }
    },

    // ==========================================
    // GETTERS
    // ==========================================

    /**
     * Get current delta time
     * @returns {number}
     */
    getDeltaTime() {
        return this._deltaTime;
    },

    /**
     * Get total elapsed time
     * @returns {number}
     */
    getTotalTime() {
        return this._totalTime;
    },

    /**
     * Get total frame count
     * @returns {number}
     */
    getFrameCount() {
        return this._frameCount;
    },

    /**
     * Get current FPS
     * @returns {number}
     */
    getFps() {
        return this._currentFps;
    },

    /**
     * Get max allowed delta time
     * @returns {number}
     */
    getMaxDeltaTime() {
        return this._maxDeltaTime;
    },

    /**
     * Set max allowed delta time
     * @param {number} maxDt - Maximum delta time in seconds
     */
    setMaxDeltaTime(maxDt) {
        this._maxDeltaTime = maxDt;
    }
};
