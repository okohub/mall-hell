// ============================================
// POWERUP SYSTEM - Registry Access + Helpers
// ============================================
// Power-up types register into globalThis.PowerUpTypeRegistry
// This file provides lookup helpers and a stable API surface.

var PowerUpTypeRegistry = (typeof globalThis !== 'undefined')
    ? (globalThis.PowerUpTypeRegistry = globalThis.PowerUpTypeRegistry || {})
    : {};

const PowerUp = {
    // Registry-backed types map (keys like SPEED_BOOST)
    types: PowerUpTypeRegistry,

    // ==========================================
    // HELPERS
    // ==========================================

    /**
     * Get power-up type by ID
     * @param {string} typeId - Power-up type ID
     * @returns {Object|null} Power-up type config
     */
    get(typeId) {
        if (!typeId) return null;
        if (this.types[typeId]) return this.types[typeId];
        const upper = typeId.toUpperCase();
        if (this.types[upper]) return this.types[upper];
        const match = Object.values(this.types).find(type => type.id === typeId);
        return match || null;
    },

    /**
     * Get all power-up types as array
     * @returns {Array} Array of power-up configs
     */
    getAll() {
        return Object.values(this.types);
    }
};
