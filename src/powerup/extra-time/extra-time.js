// ============================================
// EXTRA TIME - Type Definition
// ============================================

var PowerUpTypeRegistry = (typeof globalThis !== 'undefined')
    ? (globalThis.PowerUpTypeRegistry = globalThis.PowerUpTypeRegistry || {})
    : {};

const ExtraTime = {
    id: 'extra_time',
    name: 'Extra Time',
    isPowerup: true,
    isTimeBonus: true,
    timeBonusSeconds: 15,
    weaponId: null,
    spawnChance: 0.25,
    spawnWeight: 2,
    visual: {
        color: 0x00e5ff,
        glowColor: 0x7dffea,
        scale: 2.0
    },
    createPickupMesh(THREE, instance) {
        return ExtraTimeMesh.createPickupMesh(THREE, instance.config);
    }
};

PowerUpTypeRegistry.EXTRA_TIME = ExtraTime;
