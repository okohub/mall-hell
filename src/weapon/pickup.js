// ============================================
// WEAPON PICKUP - Pure Data Definitions
// ============================================
// Defines weapon pickup types and spawn rules
// Self-contained, zero external dependencies

const WeaponPickup = {
    // ==========================================
    // PICKUP TYPE DEFINITIONS
    // ==========================================

    types: {
        WATERGUN: {
            id: 'watergun',
            weaponId: 'watergun',
            name: 'Water Gun',
            spawnChance: 0.35,      // 35% of rooms
            spawnWeight: 3,         // Relative weight
            ammoGrant: 50,          // Ammo given on same-weapon pickup
            visual: {
                color: 0x3498db,
                glowColor: 0x5dade2,
                scale: 0.8
            }
        },

        NERFGUN: {
            id: 'nerfgun',
            weaponId: 'nerfgun',
            name: 'Nerf Blaster',
            spawnChance: 0.25,      // 25% of rooms
            spawnWeight: 2,         // Less common
            ammoGrant: 6,           // Ammo given on same-weapon pickup
            visual: {
                color: 0xe74c3c,
                glowColor: 0xf39c12,
                scale: 0.8
            }
        }
    },

    // ==========================================
    // SPAWN CONFIGURATION
    // ==========================================

    spawn: {
        chancePerRoom: 0.25,        // 25% base chance per room
        maxPerRoom: 1,              // Only one pickup per room
        minDistanceFromPlayer: 10,  // Don't spawn too close
        maxDistanceFromPlayer: 60,  // Don't spawn too far ahead
        heightOffset: 1.5,          // Float above ground
        bobAmplitude: 0.3,          // Floating bob height
        bobSpeed: 2,                // Bob speed
        rotationSpeed: 1.5          // Rotation speed
    },

    // ==========================================
    // COLLECTION CONFIGURATION
    // ==========================================

    collection: {
        radius: 2.5,                // Collection distance
        magnetRadius: 5,            // Attract pickup toward player
        magnetSpeed: 4              // Attraction speed
    },

    // ==========================================
    // HELPERS
    // ==========================================

    /**
     * Get pickup type by ID
     * @param {string} typeId - Pickup type ID
     * @returns {Object|null} Pickup type config
     */
    get(typeId) {
        return this.types[typeId.toUpperCase()] || null;
    },

    /**
     * Get pickup by weapon ID
     * @param {string} weaponId - Weapon ID to find pickup for
     * @returns {Object|null} Pickup type config
     */
    getByWeaponId(weaponId) {
        for (const key in this.types) {
            if (this.types[key].weaponId === weaponId) {
                return this.types[key];
            }
        }
        return null;
    },

    /**
     * Get all pickup types as array
     * @returns {Array} Array of pickup configs
     */
    getAll() {
        return Object.values(this.types);
    },

    /**
     * Select random pickup type based on weights
     * @returns {Object} Selected pickup type
     */
    selectRandom() {
        const types = this.getAll();
        const totalWeight = types.reduce((sum, t) => sum + t.spawnWeight, 0);
        let random = Math.random() * totalWeight;

        for (const type of types) {
            random -= type.spawnWeight;
            if (random <= 0) {
                return type;
            }
        }

        return types[0]; // Fallback
    },

    /**
     * Create pickup instance data
     * @param {string} typeId - Pickup type ID
     * @param {Object} position - Spawn position {x, y, z}
     * @returns {Object} Pickup instance data
     */
    createInstance(typeId, position) {
        const config = this.get(typeId);
        if (!config) return null;

        return {
            type: typeId,
            config: config,
            position: { ...position },
            rotation: 0,
            bobOffset: Math.random() * Math.PI * 2, // Random start phase
            active: true,
            collected: false,
            createdAt: Date.now()
        };
    }
};
