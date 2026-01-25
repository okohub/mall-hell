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
            isWeapon: true,         // This is a weapon pickup (not just ammo)
            spawnChance: 0.4,       // 40% of rooms
            spawnWeight: 5,         // Higher weight for weapons
            ammoGrant: 50,          // Ammo given on same-weapon pickup
            visual: {
                color: 0x3498db,
                glowColor: 0x5dade2,
                scale: 2.5           // Larger for visibility
            }
        },

        LASERGUN: {
            id: 'lasergun',
            weaponId: 'lasergun',
            name: 'Laser Blaster',
            isWeapon: true,
            spawnChance: 0.35,
            spawnWeight: 4,
            ammoGrant: 30,          // Energy ammo on same-weapon pickup
            visual: {
                color: 0xe74c3c,    // Red
                glowColor: 0xff6b6b,
                scale: 2.5
            }
        },

        NERFGUN: {
            id: 'nerfgun',
            weaponId: 'nerfgun',
            name: 'Nerf Blaster',
            isWeapon: true,
            spawnChance: 0.3,
            spawnWeight: 3,
            ammoGrant: 6,           // Ammo given on same-weapon pickup
            visual: {
                color: 0xf39c12,    // Orange (different from laser)
                glowColor: 0xe67e22,
                scale: 2.5
            }
        },

        // Ammo pickups - grants ammo to current weapon
        AMMO_SMALL: {
            id: 'ammo_small',
            weaponId: null,          // Applies to current weapon
            name: 'Small Ammo',
            isAmmo: true,
            spawnChance: 0.3,        // 30% of rooms (reduced)
            spawnWeight: 2,          // Lower weight than weapons
            ammoGrant: 15,           // Small ammo refill
            visual: {
                color: 0xf1c40f,     // Yellow
                glowColor: 0xf39c12,
                scale: 1.5
            }
        },

        AMMO_LARGE: {
            id: 'ammo_large',
            weaponId: null,          // Applies to current weapon
            name: 'Large Ammo',
            isAmmo: true,
            spawnChance: 0.2,        // 20% of rooms (reduced)
            spawnWeight: 1,          // Rare
            ammoGrant: 40,           // Large ammo refill
            visual: {
                color: 0xe67e22,     // Orange
                glowColor: 0xf39c12,
                scale: 1.8
            }
        }
    },

    // ==========================================
    // SPAWN CONFIGURATION
    // ==========================================

    spawn: {
        chancePerRoom: 0.6,         // 60% base chance per room (more frequent)
        maxPerRoom: 2,              // Allow up to 2 pickups per room
        minDistanceFromPlayer: 10,  // Don't spawn too close
        maxDistanceFromPlayer: 60,  // Don't spawn too far ahead
        heightOffset: 1.8,          // Float above ground (higher for visibility)
        bobAmplitude: 0.4,          // Floating bob height
        bobSpeed: 2.5,              // Bob speed
        rotationSpeed: 2.0          // Faster rotation for attention
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
