// ============================================
// SPAWN SYSTEM - Entity Spawning Logic
// ============================================
// Handles spawning of enemies and obstacles in rooms.
// Pure logic - actual entity creation is delegated via callbacks.

const SpawnSystem = {
    // ==========================================
    // CONFIGURATION
    // ==========================================

    config: {
        // Position validation
        centerClearance: 4,      // Min distance from room center
        wallMargin: 4,           // Distance from walls
        doorClearance: 5,        // Distance from doorways

        // Spawn counts
        enemyMinCount: 2,
        enemyMaxCount: 3,
        obstacleMinCount: 3,
        obstacleMaxCount: 5,

        // Spacing
        enemySpacing: 4,         // Min distance between enemies
        obstacleSpacing: 3,      // Min distance between obstacles

        // Find position
        maxSpawnAttempts: 20,
        spawnRadius: 20          // Random spawn area size
    },

    // ==========================================
    // POSITION VALIDATION
    // ==========================================

    /**
     * Check if a position is valid for spawning
     * @param {number} x - X position
     * @param {number} z - Z position
     * @param {Object} room - Room data {gridX, gridZ, worldX, worldZ, doors}
     * @param {Object} roomConfig - Room config {UNIT, DOOR_WIDTH}
     * @param {Array} occupiedPositions - Already spawned positions [{x, z}]
     * @param {number} [minDist=3] - Minimum distance from other spawns
     * @returns {boolean} True if position is valid
     */
    isValidSpawnPosition(x, z, room, roomConfig, occupiedPositions, minDist = 3) {
        const ROOM_UNIT = roomConfig.UNIT;
        const DOOR_WIDTH = roomConfig.DOOR_WIDTH;
        const roomCenterX = room.worldX;
        const roomCenterZ = room.worldZ;

        // Check distance from room center (leave space for player navigation)
        const centerDist = Math.sqrt(Math.pow(x - roomCenterX, 2) + Math.pow(z - roomCenterZ, 2));
        if (centerDist < this.config.centerClearance) return false;

        // Check distance from walls (room boundary)
        const roomMinX = room.gridX * ROOM_UNIT;
        const roomMaxX = roomMinX + ROOM_UNIT;
        const roomMinZ = room.gridZ * ROOM_UNIT;
        const roomMaxZ = roomMinZ + ROOM_UNIT;

        if (x < roomMinX + this.config.wallMargin || x > roomMaxX - this.config.wallMargin) return false;
        if (z < roomMinZ + this.config.wallMargin || z > roomMaxZ - this.config.wallMargin) return false;

        // Check distance from doors (leave doorways clear)
        const doors = room.doors || [];
        const doorHalf = DOOR_WIDTH / 2 + 2;
        const doorClear = this.config.doorClearance;

        if (doors.includes('north') && z < roomMinZ + doorClear && Math.abs(x - roomCenterX) < doorHalf) return false;
        if (doors.includes('south') && z > roomMaxZ - doorClear && Math.abs(x - roomCenterX) < doorHalf) return false;
        if (doors.includes('west') && x < roomMinX + doorClear && Math.abs(z - roomCenterZ) < doorHalf) return false;
        if (doors.includes('east') && x > roomMaxX - doorClear && Math.abs(z - roomCenterZ) < doorHalf) return false;

        // Check distance from other spawned objects
        for (const pos of occupiedPositions) {
            const dist = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(z - pos.z, 2));
            if (dist < minDist) return false;
        }

        return true;
    },

    /**
     * Find a valid spawn position within a room
     * @param {Object} room - Room data
     * @param {Object} roomConfig - Room config {UNIT, DOOR_WIDTH}
     * @param {Array} occupiedPositions - Already spawned positions
     * @param {number} [minDist=3] - Minimum distance from other spawns
     * @param {number} [maxAttempts] - Maximum attempts to find position
     * @returns {Object|null} Position {x, z} or null if not found
     */
    findValidPosition(room, roomConfig, occupiedPositions, minDist = 3, maxAttempts) {
        maxAttempts = maxAttempts || this.config.maxSpawnAttempts;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = room.worldX + (Math.random() - 0.5) * this.config.spawnRadius;
            const z = room.worldZ + (Math.random() - 0.5) * this.config.spawnRadius;

            if (this.isValidSpawnPosition(x, z, room, roomConfig, occupiedPositions, minDist)) {
                return { x, z };
            }
        }

        return null; // No valid position found
    },

    // ==========================================
    // ROOM SPAWNING
    // ==========================================

    /**
     * Spawn contents for a room
     * @param {Object} room - Room data {gridX, gridZ, worldX, worldZ, theme, doors}
     * @param {Object} roomConfig - Room config {UNIT, DOOR_WIDTH}
     * @param {Object} callbacks - Spawn callbacks {createEnemy, createObstacle}
     * @returns {Object} Spawn result {enemies: number, obstacles: number}
     */
    spawnRoomContents(room, roomConfig, callbacks) {
        // Don't spawn in entrance room
        if (room.theme === 'ENTRANCE') {
            return { enemies: 0, obstacles: 0 };
        }

        const spawnedPositions = [];
        let enemiesSpawned = 0;
        let obstaclesSpawned = 0;

        // Spawn enemies
        const numEnemies = this.config.enemyMinCount +
            Math.floor(Math.random() * (this.config.enemyMaxCount - this.config.enemyMinCount + 1));

        for (let i = 0; i < numEnemies; i++) {
            const pos = this.findValidPosition(room, roomConfig, spawnedPositions, this.config.enemySpacing);
            if (pos && callbacks.createEnemy) {
                callbacks.createEnemy(pos.x, pos.z);
                spawnedPositions.push(pos);
                enemiesSpawned++;
            }
        }

        // Spawn obstacles
        const numObstacles = this.config.obstacleMinCount +
            Math.floor(Math.random() * (this.config.obstacleMaxCount - this.config.obstacleMinCount + 1));

        const obstacleTypes = ['stack', 'barrel', 'display'];

        for (let i = 0; i < numObstacles; i++) {
            const pos = this.findValidPosition(room, roomConfig, spawnedPositions, this.config.obstacleSpacing);
            if (pos && callbacks.createObstacle) {
                const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
                callbacks.createObstacle(pos.x, pos.z, type);
                spawnedPositions.push(pos);
                obstaclesSpawned++;
            }
        }

        return { enemies: enemiesSpawned, obstacles: obstaclesSpawned };
    },

    // ==========================================
    // RUNTIME SPAWNING
    // ==========================================

    /**
     * Runtime enemy spawning configuration
     */
    runtimeConfig: {
        maxEnemies: 8,              // Max enemies alive at once
        spawnInterval: 2.0,         // Seconds between spawn attempts
        minDistanceFromPlayer: 15,  // Don't spawn too close
        maxDistanceFromPlayer: 60,  // Don't spawn too far
        spawnChancePerAttempt: 0.4  // 40% chance per attempt
    },

    // Runtime state
    _lastSpawnTime: 0,

    /**
     * Try to spawn enemies at runtime to maintain max count
     * Only spawns in rooms the player is NOT currently in
     * @param {Object} options - Spawn options
     * @param {Object} options.currentRoom - Player's current room
     * @param {Object} options.playerPosition - Player position {x, z}
     * @param {Array} options.visitedRooms - Set of visited room keys
     * @param {Object} options.gridSystem - Grid system for room lookup
     * @param {Object} options.roomConfig - Room config {UNIT, DOOR_WIDTH}
     * @param {number} options.currentEnemyCount - Current active enemy count
     * @param {number} options.dt - Delta time
     * @param {Function} options.createEnemy - Callback to create enemy (x, z) => enemy
     * @returns {Array} Array of spawned enemies
     */
    tryRuntimeSpawn(options) {
        const {
            currentRoom,
            playerPosition,
            visitedRooms,
            gridSystem,
            roomConfig,
            currentEnemyCount,
            dt,
            createEnemy
        } = options;

        // Track spawn timing
        this._lastSpawnTime = (this._lastSpawnTime || 0) + dt;
        if (this._lastSpawnTime < this.runtimeConfig.spawnInterval) {
            return [];
        }
        this._lastSpawnTime = 0;

        // Check if we need more enemies
        if (currentEnemyCount >= this.runtimeConfig.maxEnemies) {
            return [];
        }

        // Random chance to spawn
        if (Math.random() > this.runtimeConfig.spawnChancePerAttempt) {
            return [];
        }

        // Find rooms that are NOT the player's current room and are within distance
        const ROOM_UNIT = roomConfig.UNIT;
        const spawned = [];
        const candidateRooms = [];

        // Check all visited rooms as candidates
        visitedRooms.forEach(roomKey => {
            const [gx, gz] = roomKey.split('_').map(Number);
            const roomCenterX = gx * ROOM_UNIT + ROOM_UNIT / 2;
            const roomCenterZ = gz * ROOM_UNIT + ROOM_UNIT / 2;

            // Skip player's current room
            if (currentRoom && gx === currentRoom.gridX && gz === currentRoom.gridZ) {
                return;
            }

            // Check distance from player
            const dx = roomCenterX - playerPosition.x;
            const dz = roomCenterZ - playerPosition.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist >= this.runtimeConfig.minDistanceFromPlayer &&
                dist <= this.runtimeConfig.maxDistanceFromPlayer) {
                const room = gridSystem.getRoomAtWorld(roomCenterX, roomCenterZ);
                if (room && room.theme !== 'ENTRANCE') {
                    candidateRooms.push(room);
                }
            }
        });

        // If no candidate rooms, try to spawn ahead of player
        if (candidateRooms.length === 0) {
            // Look for rooms ahead (in negative Z direction typically)
            for (let i = 1; i <= 3; i++) {
                const aheadZ = playerPosition.z - (i * ROOM_UNIT);
                const room = gridSystem.getRoomAtWorld(playerPosition.x, aheadZ);
                if (room && room !== currentRoom && room.theme !== 'ENTRANCE') {
                    candidateRooms.push(room);
                }
            }
        }

        if (candidateRooms.length === 0) {
            return [];
        }

        // Pick a random candidate room
        const targetRoom = candidateRooms[Math.floor(Math.random() * candidateRooms.length)];

        // Find a valid spawn position in that room
        const pos = this.findValidPosition(targetRoom, roomConfig, [], this.config.enemySpacing);
        if (pos && createEnemy) {
            const enemy = createEnemy(pos.x, pos.z);
            if (enemy) {
                spawned.push(enemy);
            }
        }

        return spawned;
    },

    // ==========================================
    // RUNTIME PICKUP SPAWNING
    // ==========================================

    /**
     * Runtime pickup spawning configuration
     */
    pickupRuntimeConfig: {
        maxPickups: 5,              // Max pickups on map at once
        spawnInterval: 4.0,         // Seconds between spawn attempts
        minDistanceFromPlayer: 10,  // Don't spawn too close
        maxDistanceFromPlayer: 50,  // Don't spawn too far
        spawnChancePerAttempt: 0.3  // 30% chance per attempt
    },

    // Runtime pickup state
    _lastPickupSpawnTime: 0,

    /**
     * Try to spawn pickups at runtime to maintain availability
     * @param {Object} options - Spawn options
     * @param {Object} options.currentRoom - Player's current room
     * @param {Object} options.playerPosition - Player position {x, z}
     * @param {Array} options.visitedRooms - Set of visited room keys
     * @param {Object} options.gridSystem - Grid system for room lookup
     * @param {Object} options.roomConfig - Room config {UNIT, DOOR_WIDTH}
     * @param {number} options.currentPickupCount - Current active pickup count
     * @param {number} options.dt - Delta time
     * @param {Object} options.pickupSystem - PickupSystem reference
     * @param {Array} options.obstacles - Obstacles array for collision avoidance
     * @param {Array} options.shelves - Shelves array for collision avoidance
     * @returns {boolean} True if a pickup was spawned
     */
    tryRuntimePickupSpawn(options) {
        const {
            currentRoom,
            playerPosition,
            visitedRooms,
            gridSystem,
            roomConfig,
            currentPickupCount,
            dt,
            pickupSystem,
            obstacles = [],
            shelves = []
        } = options;

        // Track spawn timing
        this._lastPickupSpawnTime = (this._lastPickupSpawnTime || 0) + dt;
        if (this._lastPickupSpawnTime < this.pickupRuntimeConfig.spawnInterval) {
            return false;
        }
        this._lastPickupSpawnTime = 0;

        // Check if we need more pickups
        if (currentPickupCount >= this.pickupRuntimeConfig.maxPickups) {
            return false;
        }

        // Random chance to spawn
        if (Math.random() > this.pickupRuntimeConfig.spawnChancePerAttempt) {
            return false;
        }

        // Find candidate rooms
        const ROOM_UNIT = roomConfig.UNIT;
        const candidateRooms = [];

        // Check all visited rooms as candidates
        visitedRooms.forEach(roomKey => {
            const [gx, gz] = roomKey.split('_').map(Number);
            const roomCenterX = gx * ROOM_UNIT + ROOM_UNIT / 2;
            const roomCenterZ = gz * ROOM_UNIT + ROOM_UNIT / 2;

            // Skip player's current room
            if (currentRoom && gx === currentRoom.gridX && gz === currentRoom.gridZ) {
                return;
            }

            // Check distance from player
            const dx = roomCenterX - playerPosition.x;
            const dz = roomCenterZ - playerPosition.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist >= this.pickupRuntimeConfig.minDistanceFromPlayer &&
                dist <= this.pickupRuntimeConfig.maxDistanceFromPlayer) {
                const room = gridSystem.getRoomAtWorld(roomCenterX, roomCenterZ);
                if (room && room.theme !== 'ENTRANCE') {
                    candidateRooms.push(room);
                }
            }
        });

        // If no candidate rooms, try to spawn ahead of player
        if (candidateRooms.length === 0) {
            for (let i = 1; i <= 3; i++) {
                const aheadZ = playerPosition.z - (i * ROOM_UNIT);
                const room = gridSystem.getRoomAtWorld(playerPosition.x, aheadZ);
                if (room && room !== currentRoom && room.theme !== 'ENTRANCE') {
                    candidateRooms.push(room);
                }
            }
        }

        if (candidateRooms.length === 0) {
            return false;
        }

        // Pick a random candidate room
        const targetRoom = candidateRooms[Math.floor(Math.random() * candidateRooms.length)];

        // Use PickupSystem to spawn
        if (pickupSystem) {
            return pickupSystem.trySpawnForRoom(
                { x: targetRoom.worldX, z: targetRoom.worldZ },
                ROOM_UNIT * 0.7,
                ROOM_UNIT * 0.7,
                obstacles,
                shelves
            );
        }

        return false;
    },

    // ==========================================
    // UTILITY
    // ==========================================

    /**
     * Get spawn count for a room based on difficulty/theme
     * @param {Object} room - Room data
     * @param {string} entityType - 'enemy' or 'obstacle'
     * @returns {number} Number to spawn
     */
    getSpawnCount(room, entityType) {
        if (entityType === 'enemy') {
            return this.config.enemyMinCount +
                Math.floor(Math.random() * (this.config.enemyMaxCount - this.config.enemyMinCount + 1));
        } else {
            return this.config.obstacleMinCount +
                Math.floor(Math.random() * (this.config.obstacleMaxCount - this.config.obstacleMinCount + 1));
        }
    }
};
