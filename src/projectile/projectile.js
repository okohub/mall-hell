// ============================================
// PROJECTILE - Pure Data Definitions
// ============================================
// Self-contained, zero external dependencies
// Defines what projectiles ARE, not how they behave

const Projectile = {
    // Projectile type definitions
    types: {
        stone: {
            id: 'stone',
            geometry: 'sphere',
            size: 0.2,
            color: 0xf39c12,
            glow: true,
            glowColor: 0xf39c12,
            emissiveIntensity: { min: 0.2, max: 0.6 },
            gravity: 0,           // No gravity for arcade feel
            lifetime: 5000,       // ms before auto-despawn
            piercing: false       // Stops on first hit
        }
    },

    // Helper to get projectile config
    get(typeId) {
        return this.types[typeId] || this.types.stone;
    },

    // Create projectile instance data
    createInstance(typeId, position, direction, speed, damage) {
        const config = this.get(typeId);
        return {
            type: typeId,
            config: config,
            position: { ...position },
            direction: { ...direction },
            speed: speed,
            damage: damage,
            lifetime: config.lifetime,
            createdAt: Date.now(),
            active: true
        };
    }
};
