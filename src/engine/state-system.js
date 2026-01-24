// ============================================
// STATE SYSTEM - State Machine
// ============================================
// Manages game state with transitions and callbacks.
// Optional dependency on Engine for state definitions.

const StateSystem = {
    // Current state
    _currentState: null,

    // State definitions (from Engine or custom)
    _states: null,
    _transitions: null,

    // Callbacks
    _onEnter: {},  // state -> [callbacks]
    _onExit: {},   // state -> [callbacks]
    _onChange: [], // Global state change callbacks

    // ==========================================
    // INITIALIZATION
    // ==========================================

    /**
     * Initialize the state machine
     * @param {string} initialState - Initial state
     * @param {Object} options - Optional custom states and transitions
     */
    init(initialState, options = {}) {
        // Use Engine definitions if available, otherwise use defaults
        this._states = options.states || (typeof Engine !== 'undefined' ? Engine.STATES : {
            MENU: 'MENU',
            PLAYING: 'PLAYING',
            PAUSED: 'PAUSED',
            GAME_OVER: 'GAME_OVER'
        });

        this._transitions = options.transitions || (typeof Engine !== 'undefined' ? Engine.STATE_TRANSITIONS : {
            'MENU': ['PLAYING'],
            'PLAYING': ['PAUSED', 'GAME_OVER'],
            'PAUSED': ['PLAYING', 'MENU'],
            'GAME_OVER': ['MENU', 'PLAYING']
        });

        // Validate initial state
        if (!this._isValidState(initialState)) {
            console.warn(`StateSystem: Invalid initial state "${initialState}", defaulting to MENU`);
            initialState = this._states.MENU || 'MENU';
        }

        this._currentState = initialState;

        // Fire enter callbacks for initial state
        this._fireCallbacks(this._onEnter, initialState, null);
    },

    /**
     * Reset state machine to initial state
     * @param {string} state - State to reset to (default: MENU)
     */
    reset(state = 'MENU') {
        const prevState = this._currentState;
        this._currentState = state;
        this._fireCallbacks(this._onExit, prevState, state);
        this._fireCallbacks(this._onEnter, state, prevState);
        this._fireGlobalChange(prevState, state);
    },

    // ==========================================
    // STATE QUERIES
    // ==========================================

    /**
     * Get current state
     * @returns {string}
     */
    get() {
        return this._currentState;
    },

    /**
     * Check if current state matches
     * @param {string} state - State to check
     * @returns {boolean}
     */
    is(state) {
        return this._currentState === state;
    },

    /**
     * Check if current state is one of multiple states
     * @param {...string} states - States to check
     * @returns {boolean}
     */
    isAny(...states) {
        return states.includes(this._currentState);
    },

    /**
     * Check if a state is valid
     * @param {string} state - State to check
     * @returns {boolean}
     */
    _isValidState(state) {
        return Object.values(this._states).includes(state);
    },

    /**
     * Check if a transition is valid
     * @param {string} from - Source state
     * @param {string} to - Target state
     * @returns {boolean}
     */
    canTransition(to) {
        const validTargets = this._transitions[this._currentState];
        return validTargets ? validTargets.includes(to) : false;
    },

    /**
     * Get all valid transitions from current state
     * @returns {string[]}
     */
    getValidTransitions() {
        return this._transitions[this._currentState] || [];
    },

    // ==========================================
    // STATE TRANSITIONS
    // ==========================================

    /**
     * Transition to a new state
     * @param {string} newState - Target state
     * @returns {boolean} True if transition was successful
     */
    transition(newState) {
        // Check if transition is valid
        if (!this.canTransition(newState)) {
            console.warn(`StateSystem: Invalid transition from "${this._currentState}" to "${newState}"`);
            return false;
        }

        const prevState = this._currentState;
        this._currentState = newState;

        // Fire callbacks
        this._fireCallbacks(this._onExit, prevState, newState);
        this._fireCallbacks(this._onEnter, newState, prevState);
        this._fireGlobalChange(prevState, newState);

        return true;
    },

    /**
     * Force transition without validation (use with caution)
     * @param {string} newState - Target state
     */
    forceTransition(newState) {
        if (!this._isValidState(newState)) {
            console.warn(`StateSystem: Invalid state "${newState}"`);
            return false;
        }

        const prevState = this._currentState;
        this._currentState = newState;

        this._fireCallbacks(this._onExit, prevState, newState);
        this._fireCallbacks(this._onEnter, newState, prevState);
        this._fireGlobalChange(prevState, newState);

        return true;
    },

    // ==========================================
    // CALLBACKS
    // ==========================================

    /**
     * Register callback for entering a state
     * @param {string} state - State name
     * @param {Function} callback - Callback(prevState)
     */
    onStateEnter(state, callback) {
        if (!this._onEnter[state]) {
            this._onEnter[state] = [];
        }
        this._onEnter[state].push(callback);
    },

    /**
     * Register callback for exiting a state
     * @param {string} state - State name
     * @param {Function} callback - Callback(nextState)
     */
    onStateExit(state, callback) {
        if (!this._onExit[state]) {
            this._onExit[state] = [];
        }
        this._onExit[state].push(callback);
    },

    /**
     * Register callback for any state change
     * @param {Function} callback - Callback(prevState, newState)
     */
    onChange(callback) {
        this._onChange.push(callback);
    },

    /**
     * Remove all callbacks for a state
     * @param {string} state - State name
     */
    clearStateCallbacks(state) {
        delete this._onEnter[state];
        delete this._onExit[state];
    },

    /**
     * Remove all callbacks
     */
    clearAllCallbacks() {
        this._onEnter = {};
        this._onExit = {};
        this._onChange = [];
    },

    /**
     * Fire callbacks for a state
     * @private
     */
    _fireCallbacks(callbackMap, state, otherState) {
        const callbacks = callbackMap[state];
        if (callbacks) {
            for (const cb of callbacks) {
                try {
                    cb(otherState);
                } catch (err) {
                    console.error(`StateSystem callback error:`, err);
                }
            }
        }
    },

    /**
     * Fire global change callbacks
     * @private
     */
    _fireGlobalChange(prevState, newState) {
        for (const cb of this._onChange) {
            try {
                cb(prevState, newState);
            } catch (err) {
                console.error(`StateSystem onChange callback error:`, err);
            }
        }
    },

    // ==========================================
    // CONVENIENCE METHODS
    // ==========================================

    /**
     * Check if game is in a playable state
     * @returns {boolean}
     */
    isPlaying() {
        return this._currentState === 'PLAYING';
    },

    /**
     * Check if game is paused
     * @returns {boolean}
     */
    isPaused() {
        return this._currentState === 'PAUSED';
    },

    /**
     * Check if game is at menu
     * @returns {boolean}
     */
    isMenu() {
        return this._currentState === 'MENU';
    },

    /**
     * Check if game is over
     * @returns {boolean}
     */
    isGameOver() {
        return this._currentState === 'GAME_OVER';
    }
};
