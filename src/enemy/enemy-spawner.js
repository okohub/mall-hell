// ============================================
// ENEMY SPAWNER
// ============================================
// Score-based type selection and boss tracking

const EnemySpawner = {
    // Dinosaur spawn config
    dinoSpawnInterval: 5000,  // Spawn dino every 5000 points
    _dinoSpawnCount: 0,       // Track how many dinos spawned

    /**
     * Get enemy type to spawn based on score
     * Returns 'DINOSAUR' once per 5000 point threshold, otherwise 'SKELETON'
     * @param {number} currentScore - Current player score
     * @returns {string} Enemy type ID
     */
    getSpawnType(currentScore) {
        const expectedDinos = Math.floor(currentScore / this.dinoSpawnInterval);

        if (expectedDinos > 0 && this._dinoSpawnCount < expectedDinos) {
            this._dinoSpawnCount++;
            return 'DINOSAUR';
        }
        return 'SKELETON';
    },

    /**
     * Check if a dinosaur should spawn based on score threshold
     * Returns true once per 5000 point threshold crossed
     * @param {number} currentScore - Current player score
     * @returns {boolean} True if dino should spawn
     */
    checkDinoSpawn(currentScore) {
        const expectedDinos = Math.floor(currentScore / this.dinoSpawnInterval);
        if (expectedDinos > 0 && this._dinoSpawnCount < expectedDinos) {
            this._dinoSpawnCount++;
            return true;
        }
        return false;
    },

    /**
     * Reset spawn counters
     */
    reset() {
        this._dinoSpawnCount = 0;
    }
};
