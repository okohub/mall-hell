// ============================================
// ROOM SYSTEM - Orchestrator
// ============================================
// Manages room grid, tracking, and spawning
// Uses Room data and RoomTheme for configuration

const RoomOrchestrator = {
    // Grid storage
    rooms: {},          // Map of "gridX_gridZ" -> room data
    visitedRooms: null, // Set of visited room keys
    currentRoom: null,  // Current room player is in

    // References
    roomData: null,
    themeData: null,

    /**
     * Initialize the room system
     * @param {Object} roomData - Reference to Room data object
     * @param {Object} themeData - Reference to RoomTheme data object
     */
    init(roomData, themeData) {
        this.roomData = roomData || (typeof Room !== 'undefined' ? Room : null);
        this.themeData = themeData || (typeof RoomTheme !== 'undefined' ? RoomTheme : null);
        this.reset();
    },

    /**
     * Reset room system state
     */
    reset() {
        this.rooms = {};
        this.visitedRooms = new Set();
        this.currentRoom = null;
    },

    /**
     * Load rooms from Room.layout and MALL_THEMES
     * @param {Object} themesData - MALL_THEMES or RoomTheme data
     */
    loadLayout(themesData) {
        if (!this.roomData || !this.roomData.layout) return;

        const ROOM_UNIT = this.roomData.structure.UNIT;
        const layout = this.roomData.layout;

        for (const key in layout) {
            const parts = key.split('_');
            const gridX = parseInt(parts[0]);
            const gridZ = parseInt(parts[1]);
            const roomDef = layout[key];

            // Create room with themeData
            const room = {
                ...roomDef,
                gridX,
                gridZ,
                worldX: gridX * ROOM_UNIT + ROOM_UNIT / 2,
                worldZ: gridZ * ROOM_UNIT + ROOM_UNIT / 2,
                themeData: themesData ? themesData[roomDef.theme] : null,
                spawned: false,
                visited: false
            };

            this.rooms[key] = room;
        }
    },

    /**
     * Get grid position from world position (helper for external use)
     * @param {number} worldX - World X position
     * @param {number} worldZ - World Z position
     * @returns {Object} Grid position {x, z}
     */
    getGridFromWorld(worldX, worldZ) {
        if (!this.roomData) return { x: 0, z: 0 };
        return this.roomData.worldToGrid(worldX, worldZ);
    },

    // ==========================================
    // ROOM MANAGEMENT
    // ==========================================

    /**
     * Add a room to the grid
     * @param {number} gridX - Grid X position
     * @param {number} gridZ - Grid Z position
     * @param {string} themeId - Theme identifier
     * @param {string[]} doors - Array of door directions
     * @returns {Object} Created room data
     */
    addRoom(gridX, gridZ, themeId, doors = []) {
        const key = this._getKey(gridX, gridZ);
        const room = this.roomData.createRoomData(gridX, gridZ, themeId, doors);
        this.rooms[key] = room;
        return room;
    },

    /**
     * Get room at grid position
     * @param {number} gridX - Grid X position
     * @param {number} gridZ - Grid Z position
     * @returns {Object|null} Room data or null
     */
    getRoom(gridX, gridZ) {
        const key = this._getKey(gridX, gridZ);
        return this.rooms[key] || null;
    },

    /**
     * Get room at world position
     * @param {number} worldX - World X position
     * @param {number} worldZ - World Z position
     * @returns {Object|null} Room data or null
     */
    getRoomAtWorld(worldX, worldZ) {
        if (!this.roomData) return null;
        const grid = this.roomData.worldToGrid(worldX, worldZ);
        return this.getRoom(grid.x, grid.z);
    },

    /**
     * Check if room exists at position
     * @param {number} gridX - Grid X position
     * @param {number} gridZ - Grid Z position
     * @returns {boolean} True if room exists
     */
    hasRoom(gridX, gridZ) {
        return this.getRoom(gridX, gridZ) !== null;
    },

    /**
     * Get all rooms
     * @returns {Object[]} Array of room data objects
     */
    getAllRooms() {
        return Object.values(this.rooms);
    },

    /**
     * Get theme data for a room
     * @param {Object} room - Room data object
     * @returns {Object|null} Theme data or null
     */
    getRoomTheme(room) {
        if (!this.themeData || !room) return null;
        return this.themeData.getTheme(room.theme);
    },

    // ==========================================
    // ROOM TRACKING
    // ==========================================

    /**
     * Update current room based on player position
     * @param {number} worldX - Player world X position
     * @param {number} worldZ - Player world Z position
     * @returns {Object|null} Current room if changed, null otherwise
     */
    updateCurrentRoom(worldX, worldZ) {
        const room = this.getRoomAtWorld(worldX, worldZ);

        if (room && room !== this.currentRoom) {
            this.currentRoom = room;
            return room;
        }

        return null;
    },

    /**
     * Mark a room as visited
     * @param {number} gridX - Grid X position
     * @param {number} gridZ - Grid Z position
     * @returns {boolean} True if this is first visit
     */
    markVisited(gridX, gridZ) {
        const key = this._getKey(gridX, gridZ);
        const isFirstVisit = !this.visitedRooms.has(key);

        if (isFirstVisit) {
            this.visitedRooms.add(key);
            const room = this.getRoom(gridX, gridZ);
            if (room) room.visited = true;
        }

        return isFirstVisit;
    },

    /**
     * Check if room has been visited
     * @param {number} gridX - Grid X position
     * @param {number} gridZ - Grid Z position
     * @returns {boolean} True if visited
     */
    isVisited(gridX, gridZ) {
        const key = this._getKey(gridX, gridZ);
        return this.visitedRooms.has(key);
    },

    /**
     * Get current room
     * @returns {Object|null} Current room data
     */
    getCurrentRoom() {
        return this.currentRoom;
    },

    // ==========================================
    // NEIGHBOR QUERIES
    // ==========================================

    /**
     * Get neighboring room in a direction
     * @param {number} gridX - Starting grid X
     * @param {number} gridZ - Starting grid Z
     * @param {string} direction - Direction (north, south, east, west)
     * @returns {Object|null} Neighbor room or null
     */
    getNeighbor(gridX, gridZ, direction) {
        if (!this.roomData) return null;
        const offset = this.roomData.directionOffset[direction];
        if (!offset) return null;
        return this.getRoom(gridX + offset.x, gridZ + offset.z);
    },

    /**
     * Get all neighbors of a room
     * @param {number} gridX - Grid X position
     * @param {number} gridZ - Grid Z position
     * @returns {Object} Map of direction -> room (only existing neighbors)
     */
    getNeighbors(gridX, gridZ) {
        const neighbors = {};
        const directions = ['north', 'south', 'east', 'west'];

        directions.forEach(dir => {
            const neighbor = this.getNeighbor(gridX, gridZ, dir);
            if (neighbor) {
                neighbors[dir] = neighbor;
            }
        });

        return neighbors;
    },

    /**
     * Check if room has door leading to neighbor
     * @param {number} gridX - Grid X position
     * @param {number} gridZ - Grid Z position
     * @param {string} direction - Direction to check
     * @returns {boolean} True if door exists
     */
    hasDoor(gridX, gridZ, direction) {
        const room = this.getRoom(gridX, gridZ);
        if (!room || !room.doors) return false;
        return room.doors.includes(direction);
    },

    /**
     * Check if two rooms are connected
     * @param {number} gridX1 - First room grid X
     * @param {number} gridZ1 - First room grid Z
     * @param {number} gridX2 - Second room grid X
     * @param {number} gridZ2 - Second room grid Z
     * @returns {boolean} True if connected
     */
    areConnected(gridX1, gridZ1, gridX2, gridZ2) {
        // Find direction from room1 to room2
        const dx = gridX2 - gridX1;
        const dz = gridZ2 - gridZ1;

        // Must be adjacent
        if (Math.abs(dx) + Math.abs(dz) !== 1) return false;

        let direction;
        if (dx === 1) direction = 'east';
        else if (dx === -1) direction = 'west';
        else if (dz === 1) direction = 'south';
        else direction = 'north';

        // Check if room1 has door in that direction
        return this.hasDoor(gridX1, gridZ1, direction);
    },

    // ==========================================
    // GRID GENERATION
    // ==========================================

    /**
     * Generate a simple grid layout
     * @param {number} width - Grid width in rooms
     * @param {number} height - Grid height in rooms
     * @param {string} defaultTheme - Default theme for rooms
     * @returns {Object[]} Array of created rooms
     */
    generateGrid(width, height, defaultTheme = 'PRODUCE') {
        const created = [];

        for (let x = 0; x < width; x++) {
            for (let z = 0; z < height; z++) {
                const doors = [];

                // Add doors to neighbors (except edges)
                if (z > 0) doors.push('north');
                if (z < height - 1) doors.push('south');
                if (x > 0) doors.push('west');
                if (x < width - 1) doors.push('east');

                const room = this.addRoom(x, z, defaultTheme, doors);
                created.push(room);
            }
        }

        return created;
    },

    /**
     * Set theme for a room
     * @param {number} gridX - Grid X position
     * @param {number} gridZ - Grid Z position
     * @param {string} themeId - Theme identifier
     */
    setTheme(gridX, gridZ, themeId) {
        const room = this.getRoom(gridX, gridZ);
        if (room) {
            room.theme = themeId;
        }
    },

    // ==========================================
    // MESH CREATION
    // ==========================================

    /**
     * Create all meshes for a single room
     * @param {THREE} THREE - Three.js library
     * @param {Object} room - Room data
     * @param {Object} options - Options {scene, shelfArray, shelfOrchestrator}
     * @returns {Object} Created meshes {floor, ceiling, walls, shelves, sign, light}
     */
    createRoomMeshes(THREE, room, options = {}) {
        const { scene, shelfArray, shelfOrchestrator } = options;
        const theme = room.themeData || this.getRoomTheme(room);
        if (!theme) return null;

        const structure = this.roomData ? this.roomData.structure : Room.structure;
        const ROOM_UNIT = structure.UNIT;
        const worldX = room.gridX * ROOM_UNIT + ROOM_UNIT / 2;
        const worldZ = room.gridZ * ROOM_UNIT + ROOM_UNIT / 2;

        const result = { meshes: [] };

        // Floor
        const floorGeo = new THREE.PlaneGeometry(ROOM_UNIT, ROOM_UNIT);
        const floorMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(theme.floorColor),
            roughness: 0.8
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(worldX, 0, worldZ);
        floor.receiveShadow = true;
        result.meshes.push(floor);
        if (scene) scene.add(floor);

        // Floor tiles pattern
        const tileCanvas = document.createElement('canvas');
        tileCanvas.width = 512;
        tileCanvas.height = 512;
        const ctx = tileCanvas.getContext('2d');
        ctx.fillStyle = theme.floorColor;
        ctx.fillRect(0, 0, 512, 512);
        ctx.strokeStyle = theme.floorLineColor;
        ctx.lineWidth = 4;
        for (let y = 0; y < 512; y += 64) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(512, y);
            ctx.stroke();
        }
        for (let x = 0; x < 512; x += 64) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 512);
            ctx.stroke();
        }
        const tileTex = new THREE.CanvasTexture(tileCanvas);
        tileTex.wrapS = THREE.RepeatWrapping;
        tileTex.wrapT = THREE.RepeatWrapping;
        tileTex.repeat.set(4, 4);
        const tileMat = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.7 });
        const tiles = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_UNIT - 1, ROOM_UNIT - 1), tileMat);
        tiles.rotation.x = -Math.PI / 2;
        tiles.position.set(worldX, 0.01, worldZ);
        tiles.receiveShadow = true;
        result.meshes.push(tiles);
        if (scene) scene.add(tiles);

        // Ceiling
        const ceilingGeo = new THREE.PlaneGeometry(ROOM_UNIT, ROOM_UNIT);
        const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.9 });
        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(worldX, 12, worldZ);
        result.meshes.push(ceiling);
        if (scene) scene.add(ceiling);

        // Ceiling light
        if (typeof RoomMesh !== 'undefined') {
            const light = RoomMesh.createCeilingLightFixture(THREE, worldX, worldZ, 11.5);
            result.meshes.push(light);
            if (scene) scene.add(light);
        }

        // Walls
        this._createRoomWalls(THREE, room, scene, result.meshes);

        // Section sign
        if (theme.signText && typeof RoomMesh !== 'undefined') {
            const sign = RoomMesh.createAisleSign(THREE, theme.signText, theme.signColor, worldX, worldZ, 9);
            result.meshes.push(sign);
            if (scene) scene.add(sign);
        }

        // Shelves (if theme has products)
        if (!theme.noShelves && theme.productColors && theme.productColors.length > 0) {
            const doors = room.doors || [];
            const roomMinX = room.gridX * ROOM_UNIT;
            const roomMaxX = roomMinX + ROOM_UNIT;
            const roomMinZ = room.gridZ * ROOM_UNIT;
            const roomMaxZ = roomMinZ + ROOM_UNIT;

            // West wall shelves
            if (!doors.includes('west') && typeof RoomMesh !== 'undefined') {
                [-6, 0, 6].forEach(offset => {
                    const shelf = RoomMesh.createShelfUnit(THREE, theme, roomMinX + 2.5, worldZ + offset, false, shelfOrchestrator);
                    result.meshes.push(shelf);
                    if (scene) scene.add(shelf);
                    if (shelfArray) shelfArray.push(shelf);
                });
            }

            // East wall shelves
            if (!doors.includes('east') && typeof RoomMesh !== 'undefined') {
                [-6, 0, 6].forEach(offset => {
                    const shelf = RoomMesh.createShelfUnit(THREE, theme, roomMaxX - 2.5, worldZ + offset, true, shelfOrchestrator);
                    result.meshes.push(shelf);
                    if (scene) scene.add(shelf);
                    if (shelfArray) shelfArray.push(shelf);
                });
            }

            // North wall shelves
            if (!doors.includes('north') && typeof RoomMesh !== 'undefined') {
                [-6, 6].forEach(offset => {
                    const shelf = RoomMesh.createWallShelf(THREE, theme, worldX + offset, roomMinZ + 2.5, 0, shelfOrchestrator);
                    result.meshes.push(shelf);
                    if (scene) scene.add(shelf);
                    if (shelfArray) shelfArray.push(shelf);
                });
            }

            // South wall shelves
            if (!doors.includes('south') && typeof RoomMesh !== 'undefined') {
                [-6, 6].forEach(offset => {
                    const shelf = RoomMesh.createWallShelf(THREE, theme, worldX + offset, roomMaxZ - 2.5, Math.PI, shelfOrchestrator);
                    result.meshes.push(shelf);
                    if (scene) scene.add(shelf);
                    if (shelfArray) shelfArray.push(shelf);
                });
            }

            // Center display (not in JUNCTION rooms)
            if (room.theme !== 'JUNCTION' && typeof RoomMesh !== 'undefined') {
                const display = RoomMesh.createCenterDisplay(THREE, theme, worldX, worldZ, shelfOrchestrator);
                // Add collision data (5x5 base platform)
                display.userData.width = 5;
                display.userData.depth = 5;
                result.meshes.push(display);
                if (scene) scene.add(display);
                if (shelfArray) shelfArray.push(display);
            }
        }

        return result;
    },

    /**
     * Create all environment meshes for all rooms
     * @param {THREE} THREE - Three.js library
     * @param {Object} options - Options {scene, shelfArray, shelfOrchestrator}
     */
    createAllRoomMeshes(THREE, options = {}) {
        const rooms = this.getAllRooms();
        rooms.forEach(room => {
            this.createRoomMeshes(THREE, room, options);
        });
    },

    // ==========================================
    // PRIVATE HELPERS
    // ==========================================

    /**
     * Create walls for a room
     * @private
     */
    _createRoomWalls(THREE, room, scene, meshArray) {
        const structure = this.roomData ? this.roomData.structure : Room.structure;
        const ROOM_UNIT = structure.UNIT;
        const DOOR_WIDTH = structure.DOOR_WIDTH;

        const wallMat = new THREE.MeshStandardMaterial({ color: 0x34495e });
        const wallHeight = 12;
        const doors = room.doors || [];

        const roomMinX = room.gridX * ROOM_UNIT;
        const roomMaxX = roomMinX + ROOM_UNIT;
        const roomMinZ = room.gridZ * ROOM_UNIT;
        const roomMaxZ = roomMinZ + ROOM_UNIT;
        const centerX = roomMinX + ROOM_UNIT / 2;
        const centerZ = roomMinZ + ROOM_UNIT / 2;

        const wallSegment = (ROOM_UNIT - DOOR_WIDTH) / 2;

        const createSegment = (x, y, z, w, h, d) => {
            const geo = new THREE.BoxGeometry(w, h, d);
            const wall = new THREE.Mesh(geo, wallMat);
            wall.position.set(x, y, z);
            wall.receiveShadow = true;
            if (meshArray) meshArray.push(wall);
            if (scene) scene.add(wall);
        };

        // North wall
        if (doors.includes('north')) {
            createSegment(roomMinX + wallSegment / 2, wallHeight / 2, roomMinZ, wallSegment, wallHeight, 1);
            createSegment(roomMaxX - wallSegment / 2, wallHeight / 2, roomMinZ, wallSegment, wallHeight, 1);
        } else {
            createSegment(centerX, wallHeight / 2, roomMinZ, ROOM_UNIT, wallHeight, 1);
        }

        // South wall
        if (doors.includes('south')) {
            createSegment(roomMinX + wallSegment / 2, wallHeight / 2, roomMaxZ, wallSegment, wallHeight, 1);
            createSegment(roomMaxX - wallSegment / 2, wallHeight / 2, roomMaxZ, wallSegment, wallHeight, 1);
        } else {
            createSegment(centerX, wallHeight / 2, roomMaxZ, ROOM_UNIT, wallHeight, 1);
        }

        // West wall
        if (doors.includes('west')) {
            createSegment(roomMinX, wallHeight / 2, roomMinZ + wallSegment / 2, 1, wallHeight, wallSegment);
            createSegment(roomMinX, wallHeight / 2, roomMaxZ - wallSegment / 2, 1, wallHeight, wallSegment);
        } else {
            createSegment(roomMinX, wallHeight / 2, centerZ, 1, wallHeight, ROOM_UNIT);
        }

        // East wall
        if (doors.includes('east')) {
            createSegment(roomMaxX, wallHeight / 2, roomMinZ + wallSegment / 2, 1, wallHeight, wallSegment);
            createSegment(roomMaxX, wallHeight / 2, roomMaxZ - wallSegment / 2, 1, wallHeight, wallSegment);
        } else {
            createSegment(roomMaxX, wallHeight / 2, centerZ, 1, wallHeight, ROOM_UNIT);
        }
    },

    // ==========================================
    // ROOM UTILITIES (Public API)
    // ==========================================

    /**
     * Get room key from room object
     * @param {Object} room - Room with gridX, gridZ
     * @returns {string} Room key "gridX_gridZ"
     */
    getRoomKey(room) {
        if (!room) return null;
        return `${room.gridX}_${room.gridZ}`;
    },

    /**
     * Get adjacent rooms (north, south, east, west)
     * @param {Object} room - Center room
     * @param {Object} gridOrchestrator - Grid system with getRoomAtWorld
     * @returns {Array} Array of adjacent room objects (excludes null)
     */
    getAdjacentRooms(room, gridOrchestrator) {
        if (!room || !gridOrchestrator || !this.roomData) return [];

        const ROOM_UNIT = this.roomData.structure.UNIT;
        const adjacent = [];

        const offsets = [
            { dx: 0, dz: -1 },  // North
            { dx: 0, dz: 1 },   // South
            { dx: -1, dz: 0 },  // West
            { dx: 1, dz: 0 },   // East
        ];

        offsets.forEach(({ dx, dz }) => {
            const adjX = (room.gridX + dx) * ROOM_UNIT + ROOM_UNIT / 2;
            const adjZ = (room.gridZ + dz) * ROOM_UNIT + ROOM_UNIT / 2;
            const adjRoom = gridOrchestrator.getRoomAtWorld(adjX, adjZ);
            if (adjRoom) {
                adjacent.push(adjRoom);
            }
        });

        return adjacent;
    },

    /**
     * Get room and its adjacent rooms
     * @param {Object} room - Center room
     * @param {Object} gridOrchestrator - Grid system with getRoomAtWorld
     * @returns {Array} Array including center room + adjacent rooms
     */
    getRoomWithAdjacent(room, gridOrchestrator) {
        if (!room) return [];
        const adjacent = this.getAdjacentRooms(room, gridOrchestrator);
        return [room, ...adjacent];
    },

    /**
     * Generate key for room storage
     * @private
     */
    _getKey(gridX, gridZ) {
        return `${gridX}_${gridZ}`;
    },

    /**
     * Update ambient lighting based on current room
     * @param {Object} ambientLight - THREE.js AmbientLight
     * @param {Object} playerPosition - Player position {x, z}
     * @param {Object} gridOrchestrator - Grid system with getRoomAtWorld
     * @param {THREE} THREE - Three.js library
     * @param {number} lerpSpeed - Color transition speed (default: 0.02)
     */
    updateAmbientLighting(ambientLight, playerPosition, gridOrchestrator, THREE, lerpSpeed = 0.02) {
        if (!ambientLight || !gridOrchestrator) return;

        const room = gridOrchestrator.getRoomAtWorld(playerPosition.x, playerPosition.z);
        if (room && room.themeData) {
            const targetColor = new THREE.Color(room.themeData.ambientColor);
            ambientLight.color.lerp(targetColor, lerpSpeed);
        }
    }
};
