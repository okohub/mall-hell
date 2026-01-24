// ============================================
// INPUT - Keyboard Input Handling
// ============================================
// Handles keyboard input with customizable bindings
// and action-based callbacks.

const Input = {
    // Current key states (action name -> boolean)
    keys: {
        forward: false,
        backward: false,
        turnLeft: false,
        turnRight: false
    },

    // Key bindings (key code -> action)
    bindings: {},

    // Action callbacks
    _onActionStart: {},  // action -> [callbacks]
    _onActionRelease: {}, // action -> [callbacks]

    // Listener references for cleanup
    _keydownListener: null,
    _keyupListener: null,
    _initialized: false,

    // ==========================================
    // INITIALIZATION
    // ==========================================

    /**
     * Initialize input system with optional custom bindings
     * @param {Object} customBindings - Optional custom key bindings
     */
    init(customBindings = null) {
        // Use Engine defaults if available, otherwise use built-in defaults
        const defaults = (typeof Engine !== 'undefined' && Engine.DEFAULT_BINDINGS)
            ? Engine.DEFAULT_BINDINGS
            : {
                'KeyW': 'forward',
                'ArrowUp': 'forward',
                'KeyS': 'backward',
                'ArrowDown': 'backward',
                'KeyA': 'turnLeft',
                'ArrowLeft': 'turnLeft',
                'KeyD': 'turnRight',
                'ArrowRight': 'turnRight',
                'Space': 'fire',
                'Escape': 'pause'
            };

        this.bindings = { ...defaults, ...(customBindings || {}) };

        // Reset states
        this.reset();

        // Remove old listeners if any
        this.destroy();

        // Create bound listener functions
        this._keydownListener = this._handleKeyDown.bind(this);
        this._keyupListener = this._handleKeyUp.bind(this);

        // Attach listeners
        document.addEventListener('keydown', this._keydownListener);
        document.addEventListener('keyup', this._keyupListener);

        this._initialized = true;
    },

    /**
     * Clean up event listeners
     */
    destroy() {
        if (this._keydownListener) {
            document.removeEventListener('keydown', this._keydownListener);
            this._keydownListener = null;
        }
        if (this._keyupListener) {
            document.removeEventListener('keyup', this._keyupListener);
            this._keyupListener = null;
        }
        this._initialized = false;
    },

    /**
     * Reset all key states
     */
    reset() {
        this.keys.forward = false;
        this.keys.backward = false;
        this.keys.turnLeft = false;
        this.keys.turnRight = false;
    },

    // ==========================================
    // KEY HANDLERS
    // ==========================================

    /**
     * Handle keydown events
     * @private
     */
    _handleKeyDown(e) {
        const action = this._getAction(e);
        if (!action) return;

        // Update key state for movement keys
        if (action in this.keys) {
            const wasPressed = this.keys[action];
            this.keys[action] = true;

            // Only fire callback on initial press
            if (!wasPressed) {
                this._fireCallbacks(this._onActionStart, action, e);
            }
        } else {
            // Non-movement actions (fire, pause) always fire on keydown
            this._fireCallbacks(this._onActionStart, action, e);
        }
    },

    /**
     * Handle keyup events
     * @private
     */
    _handleKeyUp(e) {
        const action = this._getAction(e);
        if (!action) return;

        // Update key state for movement keys
        if (action in this.keys) {
            this.keys[action] = false;
        }

        // Fire release callback
        this._fireCallbacks(this._onActionRelease, action, e);
    },

    /**
     * Get action from key event
     * @private
     */
    _getAction(e) {
        // Try e.code first (recommended), then fall back to e.key
        if (e.code && this.bindings[e.code]) {
            return this.bindings[e.code];
        }

        // Handle lowercase letter keys
        const key = e.key;
        if (key && key.length === 1) {
            const upperKey = 'Key' + key.toUpperCase();
            if (this.bindings[upperKey]) {
                return this.bindings[upperKey];
            }
        }

        // Handle space bar
        if (key === ' ' && this.bindings['Space']) {
            return this.bindings['Space'];
        }

        // Handle Escape
        if (key === 'Escape' && this.bindings['Escape']) {
            return this.bindings['Escape'];
        }

        // Handle arrow keys by key name
        if (key && this.bindings[key]) {
            return this.bindings[key];
        }

        return null;
    },

    /**
     * Fire callbacks for an action
     * @private
     */
    _fireCallbacks(callbackMap, action, event) {
        const callbacks = callbackMap[action];
        if (callbacks) {
            for (const cb of callbacks) {
                cb(event);
            }
        }
    },

    // ==========================================
    // PUBLIC API
    // ==========================================

    /**
     * Get movement input as normalized values
     * @returns {Object} {forward: -1|0|1, turn: -1|0|1}
     */
    getMovement() {
        let forward = 0;
        let turn = 0;

        if (this.keys.forward) forward = 1;
        if (this.keys.backward) forward = -1;
        if (this.keys.turnLeft) turn = -1;
        if (this.keys.turnRight) turn = 1;

        return { forward, turn };
    },

    /**
     * Check if any movement key is pressed
     * @returns {boolean}
     */
    isMoving() {
        return this.keys.forward || this.keys.backward;
    },

    /**
     * Check if any turn key is pressed
     * @returns {boolean}
     */
    isTurning() {
        return this.keys.turnLeft || this.keys.turnRight;
    },

    /**
     * Register callback for when an action starts (key pressed)
     * @param {string} action - Action name
     * @param {Function} callback - Callback function
     */
    onActionStart(action, callback) {
        if (!this._onActionStart[action]) {
            this._onActionStart[action] = [];
        }
        this._onActionStart[action].push(callback);
    },

    /**
     * Register callback for when an action is released (key up)
     * @param {string} action - Action name
     * @param {Function} callback - Callback function
     */
    onActionRelease(action, callback) {
        if (!this._onActionRelease[action]) {
            this._onActionRelease[action] = [];
        }
        this._onActionRelease[action].push(callback);
    },

    /**
     * Remove all callbacks for an action
     * @param {string} action - Action name
     */
    clearCallbacks(action) {
        delete this._onActionStart[action];
        delete this._onActionRelease[action];
    },

    /**
     * Remove all callbacks
     */
    clearAllCallbacks() {
        this._onActionStart = {};
        this._onActionRelease = {};
    },

    /**
     * Set a custom key binding
     * @param {string} keyCode - Key code (e.g., 'KeyW', 'Space')
     * @param {string} action - Action name
     */
    setBinding(keyCode, action) {
        this.bindings[keyCode] = action;
    },

    /**
     * Get action bound to a key
     * @param {string} keyCode - Key code
     * @returns {string|null} Action name or null
     */
    getBinding(keyCode) {
        return this.bindings[keyCode] || null;
    },

    /**
     * Check if input system is initialized
     * @returns {boolean}
     */
    isInitialized() {
        return this._initialized;
    }
};
