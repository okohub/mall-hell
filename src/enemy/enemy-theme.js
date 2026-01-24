// ============================================
// ENEMY THEME - Visual Configuration
// ============================================
// Colors, materials, and visual styling for enemies
// Pure data - no THREE.js dependencies

const EnemyTheme = {
    // Skeleton driver enemy (the only enemy type)
    skeleton: {
        bone: 0xf5f5dc,           // Bone white
        boneAccent: 0xdcd0b4,     // Slightly darker bone
        eyes: {
            socket: 0x000000,     // Black eye sockets
            glow: 0xff0000,       // Blood red glow
            emissiveIntensity: 1.0
        },
        smile: {
            color: 0x8b0000,      // Dark red
            teeth: 0xffffff       // White teeth
        },
        cart: {
            body: 0x1a1a1a,       // Almost black
            wire: 0x333333,
            horns: 0x8b0000,      // Devil red
            hornGlow: 0.3
        },
        healthBar: {
            background: 0x333333,
            fill: 0x8b0000,       // Dark red
            low: 0xff0000,
            border: 0x000000
        }
    },

    // Damage flash effect
    damageFlash: {
        color: 0xffffff,
        duration: 100
    },

    // Get theme for enemy type (defaults to skeleton)
    getTheme(enemyType) {
        return this.skeleton;
    }
};
