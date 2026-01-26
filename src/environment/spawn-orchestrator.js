// ============================================
// SPAWN SYSTEM - Entity Spawning Logic
// ============================================
// Handles spawning of enemies and obstacles in rooms.
// Pure logic - actual entity creation is delegated via callbacks.

const SpawnOrchestrator = {
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
    // ROOM PLANNING (Data-only, no meshes)
    // ==========================================

    /**
     * State for planned rooms
     */
    _roomPlans: new Map(),      // roomKey -> { enemies: [{x, z, type}], obstacles: [{x, z, type}] }
    _totalPlannedEnemies: 0,    // Total enemies across all rooms
    _materializedRooms: new Set(), // Rooms that have been materialized

    /**
     * Reset planning state (call on game reset)
     */
    resetPlanning() {
        this._roomPlans.clear();
        this._materializedRooms.clear();
        this._totalPlannedEnemies = 0;
    },

    /**
     * Plan contents for all rooms (data only, no mesh creation)
     * @param {Array} rooms - Array of room data from RoomOrchestrator.getAllRooms()
     * @param {Object} roomConfig - Room config {UNIT, DOOR_WIDTH}
     * @param {Function} getEnemyType - Function to get enemy type (score) => 'SKELETON' | 'DINOSAUR'
     * @param {number} currentScore - Current score for enemy type calculation
     * @returns {Object} Plan summary { totalEnemies, totalObstacles, roomPlans }
     */
    planAllRooms(rooms, roomConfig, getEnemyType, currentScore = 0) {
        this.resetPlanning();

        let totalEnemies = 0;
        let totalObstacles = 0;

        rooms.forEach(room => {
            if (!room) return;
            const roomKey = `${room.gridX}_${room.gridZ}`;
            const plan = this.planRoomContents(room, roomConfig, getEnemyType, currentScore);
            this._roomPlans.set(roomKey, plan);
            totalEnemies += plan.enemies.length;
            totalObstacles += plan.obstacles.length;
        });

        this._totalPlannedEnemies = totalEnemies;

        return {
            totalEnemies,
            totalObstacles,
            roomPlans: this._roomPlans
        };
    },

    /**
     * Plan contents for a single room (data only)
     * @param {Object} room - Room data {gridX, gridZ, worldX, worldZ, theme, doors}
     * @param {Object} roomConfig - Room config {UNIT, DOOR_WIDTH}
     * @param {Function} getEnemyType - Function to get enemy type
     * @param {number} currentScore - Current score
     * @returns {Object} Room plan { enemies: [{x, z, type}], obstacles: [{x, z, type}] }
     */
    planRoomContents(room, roomConfig, getEnemyType, currentScore = 0) {
        // Don't spawn in entrance room
        if (room.theme === 'ENTRANCE') {
            return { enemies: [], obstacles: [] };
        }

        const plannedPositions = [];
        const enemies = [];
        const obstacles = [];

        // Plan enemies
        const numEnemies = this.config.enemyMinCount +
            Math.floor(Math.random() * (this.config.enemyMaxCount - this.config.enemyMinCount + 1));

        for (let i = 0; i < numEnemies; i++) {
            const pos = this.findValidPosition(room, roomConfig, plannedPositions, this.config.enemySpacing);
            if (pos) {
                // Get enemy type (at game start, always SKELETON since score is 0)
                const type = getEnemyType ? getEnemyType(currentScore) : 'SKELETON';
                enemies.push({ x: pos.x, z: pos.z, type });
                plannedPositions.push(pos);
            }
        }

        // Plan obstacles
        const numObstacles = this.config.obstacleMinCount +
            Math.floor(Math.random() * (this.config.obstacleMaxCount - this.config.obstacleMinCount + 1));

        const obstacleTypes = ['stack', 'barrel', 'display'];

        for (let i = 0; i < numObstacles; i++) {
            const pos = this.findValidPosition(room, roomConfig, plannedPositions, this.config.obstacleSpacing);
            if (pos) {
                const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
                obstacles.push({ x: pos.x, z: pos.z, type });
                plannedPositions.push(pos);
            }
        }

        return { enemies, obstacles };
    },

    /**
     * Materialize a planned room (create actual meshes)
     * @param {string} roomKey - Room key "gridX_gridZ"
     * @param {Object} callbacks - { createEnemy: (x, z, type) => mesh, createObstacle: (x, z, type) => mesh }
     * @returns {Object} { enemies: [meshes], obstacles: [meshes] } or null if already materialized
     */
    materializeRoom(roomKey, callbacks) {
        // Already materialized?
        if (this._materializedRooms.has(roomKey)) {
            return null;
        }

        const plan = this._roomPlans.get(roomKey);
        if (!plan) {
            return null;
        }

        this._materializedRooms.add(roomKey);

        const createdEnemies = [];
        const createdObstacles = [];

        // Create enemy meshes
        plan.enemies.forEach(e => {
            if (callbacks.createEnemy) {
                const mesh = callbacks.createEnemy(e.x, e.z, e.type);
                if (mesh) createdEnemies.push(mesh);
            }
        });

        // Create obstacle meshes
        plan.obstacles.forEach(o => {
            if (callbacks.createObstacle) {
                const mesh = callbacks.createObstacle(o.x, o.z, o.type);
                if (mesh) createdObstacles.push(mesh);
            }
        });

        return { enemies: createdEnemies, obstacles: createdObstacles };
    },

    /**
     * Materialize a room and its adjacent rooms
     * Uses RoomOrchestrator for room queries (proper DDD separation)
     * @param {Object} centerRoom - Center room object
     * @param {Object} gridOrchestrator - Grid system with getRoomAtWorld
     * @param {Object} roomOrchestrator - RoomOrchestrator for room utilities
     * @param {Object} callbacks - { createEnemy, createObstacle, onRoomMaterialized }
     * @returns {Object} { materializedKeys: string[], totalEnemies: number, totalObstacles: number }
     */
    materializeNearbyRooms(centerRoom, gridOrchestrator, roomOrchestrator, callbacks) {
        if (!centerRoom || !roomOrchestrator) {
            return { materializedKeys: [], totalEnemies: 0, totalObstacles: 0 };
        }

        const roomsToMaterialize = roomOrchestrator.getRoomWithAdjacent(centerRoom, gridOrchestrator);
        const materializedKeys = [];
        let totalEnemies = 0;
        let totalObstacles = 0;

        roomsToMaterialize.forEach(room => {
            const roomKey = roomOrchestrator.getRoomKey(room);
            if (!roomKey || this.isRoomMaterialized(roomKey)) {
                return;
            }

            const result = this.materializeRoom(roomKey, callbacks);
            if (result) {
                materializedKeys.push(roomKey);
                totalEnemies += result.enemies.length;
                totalObstacles += result.obstacles.length;

                // Callback for post-materialization (e.g., spawn pickups)
                if (callbacks.onRoomMaterialized) {
                    callbacks.onRoomMaterialized(room, roomKey, result);
                }
            }
        });

        return { materializedKeys, totalEnemies, totalObstacles };
    },

    /**
     * Check if a room is materialized
     * @param {string} roomKey - Room key "gridX_gridZ"
     * @returns {boolean}
     */
    isRoomMaterialized(roomKey) {
        return this._materializedRooms.has(roomKey);
    },

    /**
     * Get total planned enemies
     * @returns {number}
     */
    getTotalPlannedEnemies() {
        return this._totalPlannedEnemies;
    },

    /**
     * Get planned enemy count for a specific room
     * @param {string} roomKey - Room key "gridX_gridZ"
     * @returns {number}
     */
    getPlannedEnemyCount(roomKey) {
        const plan = this._roomPlans.get(roomKey);
        return plan ? plan.enemies.length : 0;
    },

    /**
     * Get all room plans (for minimap)
     * @returns {Map}
     */
    getRoomPlans() {
        return this._roomPlans;
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
     * @param {Object} options.gridOrchestrator - Grid system for room lookup
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
            gridOrchestrator,
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
                const room = gridOrchestrator.getRoomAtWorld(roomCenterX, roomCenterZ);
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
                const room = gridOrchestrator.getRoomAtWorld(playerPosition.x, aheadZ);
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
     * @param {Object} options.gridOrchestrator - Grid system for room lookup
     * @param {Object} options.roomConfig - Room config {UNIT, DOOR_WIDTH}
     * @param {number} options.currentPickupCount - Current active pickup count
     * @param {number} options.dt - Delta time
     * @param {Object} options.pickupOrchestrator - PickupOrchestrator reference
     * @param {Array} options.obstacles - Obstacles array for collision avoidance
     * @param {Array} options.shelves - Shelves array for collision avoidance
     * @returns {boolean} True if a pickup was spawned
     */
    tryRuntimePickupSpawn(options) {
        const {
            currentRoom,
            playerPosition,
            visitedRooms,
            gridOrchestrator,
            roomConfig,
            currentPickupCount,
            dt,
            pickupOrchestrator,
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
                const room = gridOrchestrator.getRoomAtWorld(roomCenterX, roomCenterZ);
                if (room && room.theme !== 'ENTRANCE') {
                    candidateRooms.push(room);
                }
            }
        });

        // If no candidate rooms, try to spawn ahead of player
        if (candidateRooms.length === 0) {
            for (let i = 1; i <= 3; i++) {
                const aheadZ = playerPosition.z - (i * ROOM_UNIT);
                const room = gridOrchestrator.getRoomAtWorld(playerPosition.x, aheadZ);
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

        // Use PickupOrchestrator to spawn
        if (pickupOrchestrator) {
            return pickupOrchestrator.trySpawnForRoom(
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
