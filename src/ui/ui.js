// ============================================
// UI - User Interface Constants
// ============================================
// Pure data definitions for UI configuration.
// No dependencies - this file should load first.

const UI = {
    // ==========================================
    // ANIMATION DURATIONS (ms)
    // ==========================================
    animation: {
        SCORE_POPUP_DURATION: 1000,
        SCORE_BUMP_DURATION: 150,
        HIT_MARKER_DURATION: 150,
        DAMAGE_OVERLAY_DURATION: 200
    },

    // ==========================================
    // HEALTH THRESHOLDS
    // ==========================================
    health: {
        LOW_HEALTH_THRESHOLD: 30
    },

    // ==========================================
    // SCORE RATINGS
    // ==========================================
    // Score thresholds for rating text (checked in descending order)
    scoreRatings: [
        { threshold: 28000, rating: 'MALL REDEEMER' },
        { threshold: 21000, rating: "Hell's Nightmare" },
        { threshold: 15000, rating: 'Abyss Hunter' },
        { threshold: 10000, rating: 'Demon Buster' },
        { threshold: 6000, rating: 'Cart Warrior' },
        { threshold: 3000, rating: 'Mall Diver' },
        { threshold: 1500, rating: 'Lost in IKEA' },
        { threshold: 0, rating: 'Window Shopper' }
    ],

    // ==========================================
    // COLORS
    // ==========================================
    colors: {
        COOLDOWN_READY: '#2ecc71',
        COOLDOWN_CHARGING: '#e94560'
    },

    // ==========================================
    // HELPER METHODS
    // ==========================================

    /**
     * Get score rating based on score
     * @param {number} score - Score value
     * @returns {string} Rating text
     */
    getScoreRating(score) {
        for (const entry of this.scoreRatings) {
            if (score >= entry.threshold) {
                return entry.rating;
            }
        }
        return this.scoreRatings[this.scoreRatings.length - 1].rating;
    }
};
