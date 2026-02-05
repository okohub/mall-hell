// ============================================
// SPEED BOOST - Type Definition
// ============================================

var PowerUpTypeRegistry = (typeof globalThis !== 'undefined')
    ? (globalThis.PowerUpTypeRegistry = globalThis.PowerUpTypeRegistry || {})
    : {};

const SpeedBoost = {
    id: 'speed_boost',
    name: 'Speed Boost',
    isPowerup: true,
    weaponId: null,
    spawnChance: 0.25,      // 25% of rooms
    spawnWeight: 2,         // Similar rarity to Laser Gun
    duration: 10000,        // 10 seconds in milliseconds
    speedMultiplier: 2.0,   // 2x speed (25 → 50 units/sec)
    visual: {
        color: 0x2ecc71,     // Emerald green
        glowColor: 0x7dffb2, // Mint glow
        scale: 2.0           // Similar to weapon pickups
    },
    createPickupMesh(THREE, instance) {
        return SpeedBoostMesh.createPickupMesh(THREE, instance.config);
    }
};

PowerUpTypeRegistry.SPEED_BOOST = SpeedBoost;
