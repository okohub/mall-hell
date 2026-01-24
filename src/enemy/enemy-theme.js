// ============================================
// ENEMY THEME - Visual Configuration
// ============================================
// Colors, materials, and visual styling for enemies
// Pure data - no THREE.js dependencies

const EnemyTheme = {
    // Standard cart enemy
    cart: {
        body: 0xe94560,
        wire: 0xc0392b,
        accent: 0xff6b6b,
        eyes: {
            glow: 0xff0000,
            emissiveIntensity: 0.8
        },
        healthBar: {
            background: 0x333333,
            fill: 0x2ecc71,
            low: 0xe74c3c,
            border: 0x000000
        }
    },

    // Damage flash effect
    damageFlash: {
        color: 0xffffff,
        duration: 100
    },

    // Get theme for enemy type
    getTheme(enemyType) {
        switch (enemyType) {
            case 'CART':
            default:
                return this.cart;
        }
    }
};
