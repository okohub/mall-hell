// ============================================
// ENEMY COLLISION
// ============================================
// Environment collision resolution (stateless)

const EnemyCollision = {
    /**
     * Check and resolve environment collisions (obstacles, other enemies, shelves)
     * @param {Object} enemy - Enemy mesh
     * @param {Array} allEnemies - All enemy meshes (for enemy-enemy collision)
     * @param {Array} obstacles - Obstacle meshes
     * @param {Array} shelves - Shelf meshes
     */
    resolveEnvironment(enemy, allEnemies, obstacles, shelves) {
        const pos = enemy.position;
        // Use actual collision radius from enemy config, fallback to size-based calculation
        const enemyConfig = enemy.userData.config;
        const enemyRadius = enemyConfig?.collisionRadius ||
            (enemyConfig?.visual?.size ? Math.max(enemyConfig.visual.size.w, enemyConfig.visual.size.d) / 2 : 1.5);

        // Enemy-Enemy collision (separation)
        this._resolveEnemyCollisions(enemy, allEnemies, enemyRadius, pos);

        // Enemy-Obstacle collision
        this._resolveObstacleCollisions(enemy, obstacles, enemyRadius, pos);

        // Enemy-Shelf collision
        this._resolveShelfCollisions(enemy, shelves, enemyRadius, pos);
    },

    /**
     * Resolve enemy-enemy collisions (separation)
     */
    _resolveEnemyCollisions(enemy, allEnemies, enemyRadius, pos) {
        allEnemies.forEach(other => {
            if (other === enemy || !other.userData.active) return;

            const otherConfig = other.userData.config;
            const otherRadius = otherConfig?.collisionRadius ||
                (otherConfig?.visual?.size ? Math.max(otherConfig.visual.size.w, otherConfig.visual.size.d) / 2 : 1.5);

            const dx = pos.x - other.position.x;
            const dz = pos.z - other.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const minDist = enemyRadius + otherRadius;

            if (dist < minDist && dist > 0.01) {
                // Push apart
                const overlap = minDist - dist;
                const nx = dx / dist;
                const nz = dz / dist;
                pos.x += nx * overlap * 0.5;
                pos.z += nz * overlap * 0.5;
            }
        });
    },

    /**
     * Resolve enemy-obstacle collisions
     */
    _resolveObstacleCollisions(enemy, obstacles, enemyRadius, pos) {
        if (!obstacles) return;

        obstacles.forEach(obs => {
            if (!obs.userData.active || obs.userData.hit) return;

            // Use obstacle's collision radius - check multiple sources
            const obsConfig = obs.userData.config;
            const obsRadius = obs.userData.collisionRadius ||
                obsConfig?.collisionRadius ||
                (obs.userData.width ? obs.userData.width / 2 : 1.5);

            const dx = pos.x - obs.position.x;
            const dz = pos.z - obs.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const minDist = enemyRadius + obsRadius;

            if (dist < minDist && dist > 0.01) {
                // Push away from obstacle
                const overlap = minDist - dist;
                const nx = dx / dist;
                const nz = dz / dist;
                pos.x += nx * overlap;
                pos.z += nz * overlap;
            }
        });
    },

    /**
     * Resolve enemy-shelf collisions
     */
    _resolveShelfCollisions(enemy, shelves, enemyRadius, pos) {
        if (!shelves) return;

        shelves.forEach(shelf => {
            if (!shelf.position) return;

            // Get shelf dimensions from userData or use defaults
            const shelfWidth = shelf.userData?.width || 4;
            const shelfDepth = shelf.userData?.depth || 2;
            const halfW = shelfWidth / 2 + enemyRadius;
            const halfD = shelfDepth / 2 + enemyRadius;

            const dx = pos.x - shelf.position.x;
            const dz = pos.z - shelf.position.z;

            // Check if within shelf bounds
            if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
                // Push out along shortest axis
                const overlapX = halfW - Math.abs(dx);
                const overlapZ = halfD - Math.abs(dz);

                if (overlapX < overlapZ) {
                    pos.x += Math.sign(dx) * overlapX;
                } else {
                    pos.z += Math.sign(dz) * overlapZ;
                }
            }
        });
    }
};
