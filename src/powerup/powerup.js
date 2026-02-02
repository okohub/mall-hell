// ============================================
// POWERUP SYSTEM - Pure Data Definitions
// ============================================
// Defines power-up types and spawn rules
// Self-contained, zero external dependencies

const PowerUp = {
    // ==========================================
    // POWER-UP TYPE DEFINITIONS
    // ==========================================

    types: {
        SPEED_BOOST: {
            id: 'speed_boost',
            name: 'Speed Boost',
            isPowerup: true,
            spawnChance: 0.25,      // 25% of rooms
            spawnWeight: 2,         // Similar rarity to Laser Gun
            duration: 10000,        // 10 seconds in milliseconds
            speedMultiplier: 2.0,   // 2x speed (25 → 50 units/sec)
            visual: {
                color: 0x2ecc71,     // Emerald green
                glowColor: 0x7dffb2, // Mint glow
                scale: 2.0           // Similar to weapon pickups
            }
        }
    },

    // ==========================================
    // HELPERS
    // ==========================================

    /**
     * Get power-up type by ID
     * @param {string} typeId - Power-up type ID
     * @returns {Object|null} Power-up type config
     */
    get(typeId) {
        return this.types[typeId.toUpperCase()] || null;
    },

    /**
     * Get all power-up types as array
     * @returns {Array} Array of power-up configs
     */
    getAll() {
        return Object.values(this.types);
    }
};
