// ============================================
// ROOM SYSTEM - Orchestrator
// ============================================
// Manages room grid, tracking, and spawning
// Uses Room data and RoomTheme for configuration

const RoomSystem = {
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
    // PRIVATE HELPERS
    // ==========================================

    /**
     * Generate key for room storage
     * @private
     */
    _getKey(gridX, gridZ) {
        return `${gridX}_${gridZ}`;
    }
};
