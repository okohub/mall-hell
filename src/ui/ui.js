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
        { threshold: 10000, rating: 'LEGENDARY CHAOS!' },
        { threshold: 7000, rating: 'Total Mayhem!' },
        { threshold: 4000, rating: 'Chaos Master' },
        { threshold: 2000, rating: 'Troublemaker' },
        { threshold: 800, rating: 'Rowdy Kid' },
        { threshold: 0, rating: 'Mild Mischief' }
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
            if (score > entry.threshold) {
                return entry.rating;
            }
        }
        return this.scoreRatings[this.scoreRatings.length - 1].rating;
    }
};
