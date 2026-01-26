// ============================================
// ANALYTICS SYSTEM - Provider-Agnostic Tracking
// ============================================
// Abstracted analytics layer that supports multiple providers
// All methods are failsafe - errors never break the game

const AnalyticsSystem = {
    // ==========================================
    // CONFIGURATION
    // ==========================================

    config: {
        enabled: true,
        debug: false,          // Log events to console
        provider: 'gtag',      // 'gtag' | 'none' | custom
        measurementId: null,
    },

    // ==========================================
    // STATE
    // ==========================================

    initialized: false,
    sessionStart: null,
    eventQueue: [],           // Queue events if provider not ready

    // ==========================================
    // PROVIDERS
    // ==========================================

    providers: {
        // Google Analytics 4 (gtag.js)
        gtag: {
            name: 'Google Analytics',
            isReady: () => typeof window !== 'undefined' && typeof window.gtag === 'function',
            track: (eventName, params) => {
                window.gtag('event', eventName, params);
            }
        },
        // No-op provider for testing/disabled state
        none: {
            name: 'None',
            isReady: () => true,
            track: () => {}
        }
    },

    // ==========================================
    // INITIALIZATION
    // ==========================================

    /**
     * Initialize the analytics system
     * @param {Object} options - Configuration options
     * @param {string} options.measurementId - GA4 Measurement ID (G-XXXXXXXXXX)
     * @param {string} options.provider - Provider name ('gtag', 'none')
     * @param {boolean} options.debug - Enable debug logging
     */
    init(options = {}) {
        try {
            this.config.measurementId = options.measurementId || this.config.measurementId;
            this.config.provider = options.provider || this.config.provider;
            this.config.debug = options.debug || this.config.debug;
            this.config.enabled = options.enabled !== false;

            this.sessionStart = Date.now();
            this.initialized = true;

            // Process any queued events
            this._processQueue();

            this._log('Analytics initialized', this.config);
        } catch (e) {
            this._handleError('init', e);
        }
    },

    /**
     * Register a custom provider
     * @param {string} name - Provider name
     * @param {Object} provider - Provider implementation {isReady, track}
     */
    registerProvider(name, provider) {
        try {
            if (provider && typeof provider.isReady === 'function' && typeof provider.track === 'function') {
                this.providers[name] = provider;
                this._log('Provider registered:', name);
                return true;
            }
            return false;
        } catch (e) {
            this._handleError('registerProvider', e);
            return false;
        }
    },

    // ==========================================
    // CORE TRACKING
    // ==========================================

    /**
     * Track a custom event (generic)
     * @param {string} eventName - Event name
     * @param {Object} params - Event parameters
     */
    track(eventName, params = {}) {
        try {
            if (!this.config.enabled) return;

            const provider = this.providers[this.config.provider];
            if (!provider) {
                this._log('Unknown provider:', this.config.provider);
                return;
            }

            // Add common params
            const enrichedParams = {
                ...params,
                session_duration: this._getSessionDuration(),
            };

            if (provider.isReady()) {
                provider.track(eventName, enrichedParams);
                this._log('Event tracked:', eventName, enrichedParams);
            } else {
                // Queue for later
                this.eventQueue.push({ eventName, params: enrichedParams, timestamp: Date.now() });
                this._log('Event queued:', eventName);
            }
        } catch (e) {
            this._handleError('track', e);
        }
    },

    // ==========================================
    // GAME EVENTS - High Level API
    // ==========================================

    /**
     * Track game page view (called on load)
     */
    gamePageView() {
        try {
            this.track('game_page_view', {
                event_category: 'game',
                event_label: 'mall_hell',
                page_type: 'game'
            });
        } catch (e) {
            this._handleError('gamePageView', e);
        }
    },

    /**
     * Track game start
     */
    gameStart() {
        try {
            this.track('game_start', {
                event_category: 'game',
                event_label: 'start'
            });
        } catch (e) {
            this._handleError('gameStart', e);
        }
    },

    /**
     * Track game over
     * @param {Object} data - Game over data
     * @param {number} data.score - Final score
     * @param {number} data.playTime - Play time in seconds
     * @param {boolean} data.died - Whether player died
     * @param {string} data.rating - Score rating
     */
    gameOver(data = {}) {
        try {
            this.track('game_over', {
                event_category: 'game',
                event_label: data.died ? 'death' : 'completed',
                score: data.score || 0,
                play_time_seconds: data.playTime || 0,
                rating: data.rating || 'unknown',
                died: data.died || false
            });
        } catch (e) {
            this._handleError('gameOver', e);
        }
    },

    /**
     * Track weapon switch
     * @param {string} weaponId - New weapon ID
     * @param {string} previousWeaponId - Previous weapon ID
     */
    weaponSwitch(weaponId, previousWeaponId = null) {
        try {
            this.track('weapon_switch', {
                event_category: 'weapon',
                event_label: weaponId,
                weapon_id: weaponId,
                previous_weapon: previousWeaponId
            });
        } catch (e) {
            this._handleError('weaponSwitch', e);
        }
    },

    /**
     * Track enemy kill
     * @param {string} enemyType - Type of enemy killed
     * @param {number} score - Score earned
     */
    enemyKill(enemyType, score = 0) {
        try {
            this.track('enemy_kill', {
                event_category: 'combat',
                event_label: enemyType,
                enemy_type: enemyType,
                score_earned: score
            });
        } catch (e) {
            this._handleError('enemyKill', e);
        }
    },

    /**
     * Track damage taken
     * @param {number} amount - Damage amount
     * @param {string} source - Damage source (enemy, obstacle)
     * @param {number} healthRemaining - Health after damage
     */
    damageTaken(amount, source, healthRemaining) {
        try {
            this.track('damage_taken', {
                event_category: 'combat',
                event_label: source,
                damage_amount: amount,
                damage_source: source,
                health_remaining: healthRemaining
            });
        } catch (e) {
            this._handleError('damageTaken', e);
        }
    },

    /**
     * Track pickup collected
     * @param {string} pickupType - Type of pickup (weapon, ammo)
     * @param {string} itemId - Item ID
     */
    pickupCollected(pickupType, itemId) {
        try {
            this.track('pickup_collected', {
                event_category: 'item',
                event_label: itemId,
                pickup_type: pickupType,
                item_id: itemId
            });
        } catch (e) {
            this._handleError('pickupCollected', e);
        }
    },

    /**
     * Track obstacle hit
     * @param {string} obstacleType - Type of obstacle
     * @param {number} score - Score earned
     */
    obstacleHit(obstacleType, score = 0) {
        try {
            this.track('obstacle_hit', {
                event_category: 'environment',
                event_label: obstacleType,
                obstacle_type: obstacleType,
                score_earned: score
            });
        } catch (e) {
            this._handleError('obstacleHit', e);
        }
    },

    // ==========================================
    // UTILITY
    // ==========================================

    /**
     * Get session duration in seconds
     * @private
     */
    _getSessionDuration() {
        if (!this.sessionStart) return 0;
        return Math.floor((Date.now() - this.sessionStart) / 1000);
    },

    /**
     * Process queued events
     * @private
     */
    _processQueue() {
        try {
            const provider = this.providers[this.config.provider];
            if (!provider || !provider.isReady()) return;

            while (this.eventQueue.length > 0) {
                const event = this.eventQueue.shift();
                provider.track(event.eventName, event.params);
                this._log('Queued event sent:', event.eventName);
            }
        } catch (e) {
            this._handleError('_processQueue', e);
        }
    },

    /**
     * Debug logging
     * @private
     */
    _log(...args) {
        if (this.config.debug) {
            console.log('[Analytics]', ...args);
        }
    },

    /**
     * Handle errors silently
     * @private
     */
    _handleError(method, error) {
        // Silent fail - never break the game
        if (this.config.debug) {
            console.warn('[Analytics] Error in', method + ':', error.message);
        }
    },

    /**
     * Check if analytics is ready
     */
    isReady() {
        try {
            const provider = this.providers[this.config.provider];
            return this.initialized && this.config.enabled && provider && provider.isReady();
        } catch (e) {
            return false;
        }
    },

    /**
     * Disable analytics
     */
    disable() {
        this.config.enabled = false;
    },

    /**
     * Enable analytics
     */
    enable() {
        this.config.enabled = true;
    }
};
