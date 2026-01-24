// ============================================
// ROOM MESH - Mesh Creation
// ============================================
// Creates room THREE.js meshes (floor, ceiling, walls)
// Uses Room and RoomTheme for configuration

const RoomMesh = {
    /**
     * Get room structure config
     */
    _getStructure() {
        if (typeof Room !== 'undefined') {
            return Room.structure;
        }
        return { UNIT: 30, DOOR_WIDTH: 8, WALL_HEIGHT: 12, WALL_THICKNESS: 0.5 };
    },

    /**
     * Get common theme config
     */
    _getCommonTheme() {
        if (typeof RoomTheme !== 'undefined') {
            return RoomTheme.common;
        }
        return { wallColor: 0xf5f5f5, ceilingColor: 0xfafafa, lightColor: 0xffffff };
    },

    /**
     * Create floor mesh with tiled pattern
     * @param {THREE} THREE - Three.js library
     * @param {Object} theme - Room theme data
     * @param {number} worldX - World X position (center)
     * @param {number} worldZ - World Z position (center)
     * @returns {THREE.Group} Floor group
     */
    createFloor(THREE, theme, worldX, worldZ) {
        const structure = this._getStructure();
        const floorGroup = new THREE.Group();

        // Base floor
        const floorGeo = new THREE.PlaneGeometry(structure.UNIT, structure.UNIT);
        const floorMat = new THREE.MeshStandardMaterial({
            color: theme.floorColor || '#c9b896',
            roughness: 0.8,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(worldX, 0.01, worldZ);
        floor.receiveShadow = true;
        floorGroup.add(floor);

        // Tile pattern
        const tileTexture = this._createTileTexture(THREE, theme, structure.UNIT);
        if (tileTexture) {
            const tileMat = new THREE.MeshStandardMaterial({
                map: tileTexture,
                transparent: true,
                roughness: 0.7,
                metalness: 0.1
            });
            const tiles = new THREE.Mesh(
                new THREE.PlaneGeometry(structure.UNIT - 1, structure.UNIT - 1),
                tileMat
            );
            tiles.rotation.x = -Math.PI / 2;
            tiles.position.set(worldX, 0.02, worldZ);
            tiles.receiveShadow = true;
            floorGroup.add(tiles);
        }

        return floorGroup;
    },

    /**
     * Create ceiling mesh with lights
     * @param {THREE} THREE - Three.js library
     * @param {Object} theme - Room theme data
     * @param {number} worldX - World X position (center)
     * @param {number} worldZ - World Z position (center)
     * @returns {THREE.Group} Ceiling group
     */
    createCeiling(THREE, theme, worldX, worldZ) {
        const structure = this._getStructure();
        const common = this._getCommonTheme();
        const ceilingGroup = new THREE.Group();

        // Ceiling panel
        const ceilingGeo = new THREE.PlaneGeometry(structure.UNIT, structure.UNIT);
        const ceilingMat = new THREE.MeshStandardMaterial({
            color: common.ceilingColor,
            roughness: 0.9,
            metalness: 0.0
        });
        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(worldX, structure.WALL_HEIGHT, worldZ);
        ceilingGroup.add(ceiling);

        // Ceiling light fixture
        const light = this._createCeilingLight(THREE, worldX, worldZ, structure.WALL_HEIGHT);
        ceilingGroup.add(light);

        return ceilingGroup;
    },

    /**
     * Create wall segment
     * @param {THREE} THREE - Three.js library
     * @param {string} direction - Wall direction (north, south, east, west)
     * @param {Object} room - Room data with doors array
     * @param {Object} theme - Room theme data
     * @returns {THREE.Group} Wall group
     */
    createWall(THREE, direction, room, theme) {
        const structure = this._getStructure();
        const common = this._getCommonTheme();
        const wallGroup = new THREE.Group();

        const bounds = Room.getRoomBounds(room.gridX, room.gridZ);
        const hasDoor = room.doors && room.doors.includes(direction);

        const wallMat = new THREE.MeshStandardMaterial({
            color: common.wallColor,
            roughness: 0.9,
            metalness: 0.0
        });

        if (hasDoor) {
            // Wall with door opening - create two segments
            const segments = this._createWallWithDoor(THREE, direction, bounds, structure, wallMat);
            segments.forEach(seg => wallGroup.add(seg));
        } else {
            // Solid wall
            const wall = this._createSolidWall(THREE, direction, bounds, structure, wallMat);
            wallGroup.add(wall);
        }

        return wallGroup;
    },

    /**
     * Create all four walls for a room
     * @param {THREE} THREE - Three.js library
     * @param {Object} room - Room data
     * @param {Object} theme - Room theme data
     * @returns {THREE.Group} Walls group
     */
    createAllWalls(THREE, room, theme) {
        const wallsGroup = new THREE.Group();
        const directions = ['north', 'south', 'east', 'west'];

        directions.forEach(direction => {
            const wall = this.createWall(THREE, direction, room, theme);
            wallsGroup.add(wall);
        });

        return wallsGroup;
    },

    /**
     * Create complete room (floor, ceiling, walls)
     * @param {THREE} THREE - Three.js library
     * @param {Object} room - Room data
     * @param {Object} theme - Room theme data
     * @returns {THREE.Group} Complete room group
     */
    createRoom(THREE, room, theme) {
        const roomGroup = new THREE.Group();
        roomGroup.userData.roomData = room;

        const worldPos = Room.gridToWorld(room.gridX, room.gridZ);

        // Floor
        const floor = this.createFloor(THREE, theme, worldPos.x, worldPos.z);
        roomGroup.add(floor);

        // Ceiling
        const ceiling = this.createCeiling(THREE, theme, worldPos.x, worldPos.z);
        roomGroup.add(ceiling);

        // Walls
        const walls = this.createAllWalls(THREE, room, theme);
        roomGroup.add(walls);

        return roomGroup;
    },

    // ==========================================
    // PRIVATE HELPERS
    // ==========================================

    /**
     * Create tile texture for floor
     * @private
     */
    _createTileTexture(THREE, theme, size) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = theme.floorColor || '#c9b896';
        ctx.fillRect(0, 0, 256, 256);

        // Grid lines
        ctx.strokeStyle = theme.floorLineColor || '#a89878';
        ctx.lineWidth = 2;
        const tileSize = 32;
        for (let x = 0; x <= 256; x += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 256);
            ctx.stroke();
        }
        for (let y = 0; y <= 256; y += tileSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(256, y);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(size / 10, size / 10);
        return texture;
    },

    /**
     * Create ceiling light fixture
     * @private
     */
    _createCeilingLight(THREE, worldX, worldZ, height) {
        const lightGroup = new THREE.Group();

        // Light fixture housing
        const housingGeo = new THREE.BoxGeometry(4, 0.3, 2);
        const housingMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.5
        });
        const housing = new THREE.Mesh(housingGeo, housingMat);
        housing.position.set(worldX, height - 0.15, worldZ);
        lightGroup.add(housing);

        // Light panel
        const lightGeo = new THREE.PlaneGeometry(3.5, 1.5);
        const lightMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffee,
            emissiveIntensity: 0.5
        });
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.rotation.x = Math.PI / 2;
        light.position.set(worldX, height - 0.29, worldZ);
        lightGroup.add(light);

        return lightGroup;
    },

    /**
     * Create solid wall
     * @private
     */
    _createSolidWall(THREE, direction, bounds, structure, material) {
        const wallGeo = new THREE.BoxGeometry(
            (direction === 'north' || direction === 'south') ? structure.UNIT : structure.WALL_THICKNESS,
            structure.WALL_HEIGHT,
            (direction === 'east' || direction === 'west') ? structure.UNIT : structure.WALL_THICKNESS
        );
        const wall = new THREE.Mesh(wallGeo, material);

        // Position based on direction
        switch (direction) {
            case 'north':
                wall.position.set((bounds.minX + bounds.maxX) / 2, structure.WALL_HEIGHT / 2, bounds.minZ);
                break;
            case 'south':
                wall.position.set((bounds.minX + bounds.maxX) / 2, structure.WALL_HEIGHT / 2, bounds.maxZ);
                break;
            case 'east':
                wall.position.set(bounds.maxX, structure.WALL_HEIGHT / 2, (bounds.minZ + bounds.maxZ) / 2);
                break;
            case 'west':
                wall.position.set(bounds.minX, structure.WALL_HEIGHT / 2, (bounds.minZ + bounds.maxZ) / 2);
                break;
        }

        return wall;
    },

    /**
     * Create wall with door opening
     * @private
     */
    _createWallWithDoor(THREE, direction, bounds, structure, material) {
        const segments = [];
        const doorHalf = structure.DOOR_WIDTH / 2;
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerZ = (bounds.minZ + bounds.maxZ) / 2;
        const segmentLength = (structure.UNIT - structure.DOOR_WIDTH) / 2;

        if (direction === 'north' || direction === 'south') {
            const z = direction === 'north' ? bounds.minZ : bounds.maxZ;

            // Left segment
            const leftGeo = new THREE.BoxGeometry(segmentLength, structure.WALL_HEIGHT, structure.WALL_THICKNESS);
            const left = new THREE.Mesh(leftGeo, material);
            left.position.set(bounds.minX + segmentLength / 2, structure.WALL_HEIGHT / 2, z);
            segments.push(left);

            // Right segment
            const rightGeo = new THREE.BoxGeometry(segmentLength, structure.WALL_HEIGHT, structure.WALL_THICKNESS);
            const right = new THREE.Mesh(rightGeo, material);
            right.position.set(bounds.maxX - segmentLength / 2, structure.WALL_HEIGHT / 2, z);
            segments.push(right);

            // Top segment (above door)
            const topGeo = new THREE.BoxGeometry(structure.DOOR_WIDTH, structure.WALL_HEIGHT - 4, structure.WALL_THICKNESS);
            const top = new THREE.Mesh(topGeo, material);
            top.position.set(centerX, structure.WALL_HEIGHT - (structure.WALL_HEIGHT - 4) / 2, z);
            segments.push(top);
        } else {
            const x = direction === 'east' ? bounds.maxX : bounds.minX;

            // Front segment
            const frontGeo = new THREE.BoxGeometry(structure.WALL_THICKNESS, structure.WALL_HEIGHT, segmentLength);
            const front = new THREE.Mesh(frontGeo, material);
            front.position.set(x, structure.WALL_HEIGHT / 2, bounds.minZ + segmentLength / 2);
            segments.push(front);

            // Back segment
            const backGeo = new THREE.BoxGeometry(structure.WALL_THICKNESS, structure.WALL_HEIGHT, segmentLength);
            const back = new THREE.Mesh(backGeo, material);
            back.position.set(x, structure.WALL_HEIGHT / 2, bounds.maxZ - segmentLength / 2);
            segments.push(back);

            // Top segment (above door)
            const topGeo = new THREE.BoxGeometry(structure.WALL_THICKNESS, structure.WALL_HEIGHT - 4, structure.DOOR_WIDTH);
            const top = new THREE.Mesh(topGeo, material);
            top.position.set(x, structure.WALL_HEIGHT - (structure.WALL_HEIGHT - 4) / 2, centerZ);
            segments.push(top);
        }

        return segments;
    }
};
