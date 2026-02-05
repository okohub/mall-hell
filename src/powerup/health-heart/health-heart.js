// ============================================
// HEALTH HEART - Type Definition
// ============================================

var PowerUpTypeRegistry = (typeof globalThis !== 'undefined')
    ? (globalThis.PowerUpTypeRegistry = globalThis.PowerUpTypeRegistry || {})
    : {};

const HealthHeart = {
    id: 'health_heart',
    name: 'Health Heart',
    isPowerup: true,
    isHealth: true,
    healAmount: 20,
    spawnChance: 0,
    spawnWeight: 0,
    dropOnly: true,
    weaponId: null,
    visual: {
        color: 0xe74c3c,     // Rich red
        glowColor: 0xff6b6b, // Warm red glow
        scale: 1.8
    },
    createPickupMesh(THREE, instance) {
        return HealthHeartMesh.createPickupMesh(THREE, instance.config);
    }
};

PowerUpTypeRegistry.HEALTH_HEART = HealthHeart;
