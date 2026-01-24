// ============================================
// ROOM - Pure Data Definitions
// ============================================
// Room structure constants and configuration
// Pure data - no THREE.js dependencies

const Room = {
    // Mall layout definition (16 rooms)
    // Grid coordinates: x = column, z = row
    // Each room is ROOM_UNIT x ROOM_UNIT (30x30)
    layout: {
        // Row 0 (z=0)
        '0_0': { theme: 'ELECTRONICS', doors: ['south'] },
        '1_0': { theme: 'GAMING', doors: ['south', 'east'] },
        '2_0': { theme: 'TOYS', doors: ['south'] },
        // Row 1 (z=1)
        '0_1': { theme: 'APPLIANCES', doors: ['north', 'south', 'east'] },
        '1_1': { theme: 'JUNCTION', doors: ['north', 'south', 'east', 'west'] },
        '2_1': { theme: 'SPORTS', doors: ['north', 'south', 'west'] },
        // Row 2 (z=2) - Main corridor with ENTRANCE
        '-1_2': { theme: 'BAKERY', doors: ['east'] },
        '0_2': { theme: 'PRODUCE', doors: ['north', 'south', 'east', 'west'] },
        '1_2': { theme: 'ENTRANCE', doors: ['north', 'south', 'east', 'west'] },
        '2_2': { theme: 'DAIRY', doors: ['north', 'south', 'east', 'west'] },
        '3_2': { theme: 'FROZEN', doors: ['west'] },
        // Row 3 (z=3)
        '0_3': { theme: 'SNACKS', doors: ['north', 'south', 'east'] },
        '1_3': { theme: 'JUNCTION', doors: ['north', 'south', 'east', 'west'] },
        '2_3': { theme: 'BEVERAGES', doors: ['north', 'south', 'west'] },
        // Row 4 (z=4)
        '0_4': { theme: 'CLOTHING', doors: ['north', 'east'] },
        '1_4': { theme: 'PHARMACY', doors: ['north', 'west'] },
    },

    // Room dimensions
    structure: {
        UNIT: 30,              // Each room is 30x30 units
        DOOR_WIDTH: 8,         // Door opening width
        WALL_HEIGHT: 12,       // Wall height
        WALL_THICKNESS: 0.5,   // Wall thickness
        FLOOR_Y: 0,            // Floor Y position
        CEILING_Y: 12          // Ceiling Y position
    },

    // Door directions
    directions: ['north', 'south', 'east', 'west'],

    // Opposite directions mapping
    oppositeDirection: {
        north: 'south',
        south: 'north',
        east: 'west',
        west: 'east'
    },

    // Direction offsets for grid navigation
    directionOffset: {
        north: { x: 0, z: -1 },
        south: { x: 0, z: 1 },
        east: { x: 1, z: 0 },
        west: { x: -1, z: 0 }
    },

    /**
     * Calculate world position from grid position
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridZ - Grid Z coordinate
     * @returns {Object} World position {x, z}
     */
    gridToWorld(gridX, gridZ) {
        return {
            x: gridX * this.structure.UNIT + this.structure.UNIT / 2,
            z: gridZ * this.structure.UNIT + this.structure.UNIT / 2
        };
    },

    /**
     * Calculate grid position from world position
     * @param {number} worldX - World X coordinate
     * @param {number} worldZ - World Z coordinate
     * @returns {Object} Grid position {x, z}
     */
    worldToGrid(worldX, worldZ) {
        return {
            x: Math.floor(worldX / this.structure.UNIT),
            z: Math.floor(worldZ / this.structure.UNIT)
        };
    },

    /**
     * Get room bounds in world coordinates
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridZ - Grid Z coordinate
     * @returns {Object} Bounds {minX, maxX, minZ, maxZ}
     */
    getRoomBounds(gridX, gridZ) {
        const minX = gridX * this.structure.UNIT;
        const minZ = gridZ * this.structure.UNIT;
        return {
            minX: minX,
            maxX: minX + this.structure.UNIT,
            minZ: minZ,
            maxZ: minZ + this.structure.UNIT
        };
    },

    /**
     * Get door center position for a wall
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridZ - Grid Z coordinate
     * @returns {Object} Door centers {x, z}
     */
    getDoorCenter(gridX, gridZ) {
        const bounds = this.getRoomBounds(gridX, gridZ);
        return {
            x: bounds.minX + this.structure.UNIT / 2,
            z: bounds.minZ + this.structure.UNIT / 2
        };
    },

    /**
     * Check if position is in doorway
     * @param {number} worldX - World X position
     * @param {number} worldZ - World Z position
     * @param {string} direction - Door direction
     * @param {number} gridX - Room grid X
     * @param {number} gridZ - Room grid Z
     * @returns {boolean} True if in doorway
     */
    isInDoorway(worldX, worldZ, direction, gridX, gridZ) {
        const doorCenter = this.getDoorCenter(gridX, gridZ);
        const halfDoor = this.structure.DOOR_WIDTH / 2;

        if (direction === 'north' || direction === 'south') {
            return worldX > doorCenter.x - halfDoor && worldX < doorCenter.x + halfDoor;
        } else {
            return worldZ > doorCenter.z - halfDoor && worldZ < doorCenter.z + halfDoor;
        }
    },

    /**
     * Create a room data object
     * @param {number} gridX - Grid X position
     * @param {number} gridZ - Grid Z position
     * @param {string} themeId - Theme identifier
     * @param {string[]} doors - Array of door directions
     * @returns {Object} Room data object
     */
    createRoomData(gridX, gridZ, themeId, doors = []) {
        const worldPos = this.gridToWorld(gridX, gridZ);
        return {
            gridX: gridX,
            gridZ: gridZ,
            worldX: worldPos.x,
            worldZ: worldPos.z,
            theme: themeId,
            doors: doors,
            spawned: false,
            visited: false
        };
    }
};
