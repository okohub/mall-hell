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

    /**
     * Create ceiling light fixture (public wrapper)
     * @param {THREE} THREE - Three.js library
     * @param {number} worldX - World X position
     * @param {number} worldZ - World Z position
     * @param {number} [height=11.5] - Height from ground
     * @returns {THREE.Group} Light fixture group
     */
    createCeilingLightFixture(THREE, worldX, worldZ, height = 11.5) {
        const group = new THREE.Group();

        const fixtureGeo = new THREE.BoxGeometry(4, 0.3, 1);
        const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
        group.add(fixture);

        const lightGeo = new THREE.BoxGeometry(3.5, 0.1, 0.8);
        const lightMat = new THREE.MeshStandardMaterial({
            color: 0xffffee,
            emissive: 0xffffee,
            emissiveIntensity: 0.5
        });
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.y = -0.2;
        group.add(light);

        group.position.set(worldX, height, worldZ);
        return group;
    },

    /**
     * Create aisle/section sign
     * @param {THREE} THREE - Three.js library
     * @param {string} text - Sign text
     * @param {number} color - Sign color (hex)
     * @param {number} worldX - World X position
     * @param {number} worldZ - World Z position
     * @param {number} [height=9] - Sign height
     * @returns {THREE.Group} Sign group
     */
    createAisleSign(THREE, text, color, worldX, worldZ, height = 9) {
        const group = new THREE.Group();

        // Sign board with canvas texture
        const signCanvas = document.createElement('canvas');
        signCanvas.width = 512;
        signCanvas.height = 128;
        const ctx = signCanvas.getContext('2d');

        // Background
        const colorHex = '#' + color.toString(16).padStart(6, '0');
        ctx.fillStyle = colorHex;
        ctx.fillRect(0, 0, 512, 128);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, 506, 122);

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 64);

        const signTexture = new THREE.CanvasTexture(signCanvas);
        const signGeo = new THREE.BoxGeometry(10, 2, 0.3);
        const signMat = new THREE.MeshStandardMaterial({
            map: signTexture,
            emissive: new THREE.Color(color),
            emissiveIntensity: 0.2
        });
        const sign = new THREE.Mesh(signGeo, signMat);
        group.add(sign);

        // Back of sign (same texture)
        const signBack = new THREE.Mesh(signGeo, signMat);
        signBack.rotation.y = Math.PI;
        group.add(signBack);

        // Hanging chains/poles
        const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });

        const poleL = new THREE.Mesh(poleGeo, poleMat);
        poleL.position.set(-4, 2, 0);
        group.add(poleL);

        const poleR = new THREE.Mesh(poleGeo, poleMat);
        poleR.position.set(4, 2, 0);
        group.add(poleR);

        // Position
        group.position.set(worldX, height, worldZ);

        return group;
    },

    /**
     * Create center display island
     * @param {THREE} THREE - Three.js library
     * @param {Object} theme - Room theme with shelfColor, productColors
     * @param {number} worldX - World X position
     * @param {number} worldZ - World Z position
     * @param {Object} [shelfSystem] - Optional ShelfSystem reference for templates
     * @returns {THREE.Group} Display group
     */
    createCenterDisplay(THREE, theme, worldX, worldZ, shelfSystem) {
        const group = new THREE.Group();
        group.position.set(worldX, 0, worldZ);

        // Base platform
        const baseGeo = new THREE.BoxGeometry(5, 0.4, 5);
        const baseMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(theme.shelfColor).multiplyScalar(0.8)
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.2;
        base.receiveShadow = true;
        base.castShadow = true;
        group.add(base);

        // Display shelving
        const shelfGeo = new THREE.BoxGeometry(4.5, 0.1, 4.5);
        const shelfMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(theme.shelfColor).multiplyScalar(0.6)
        });

        const shelfCount = shelfSystem ? shelfSystem.getShelfTemplate('FLOOR_ISLAND').shelfCount : 2;
        const productsPerLevel = shelfSystem ? shelfSystem.getShelfTemplate('FLOOR_ISLAND').productsPerLevel : 9;

        for (let level = 0; level < shelfCount; level++) {
            const shelf = new THREE.Mesh(shelfGeo, shelfMat);
            shelf.position.y = 0.5 + level * 1.2;
            group.add(shelf);

            // Products on each level
            if (theme.productColors && theme.productColors.length > 0) {
                for (let i = 0; i < productsPerLevel; i++) {
                    const row = Math.floor(i / 3);
                    const col = i % 3;
                    const color = shelfSystem ?
                        shelfSystem.pickProductColor(theme) :
                        theme.productColors[Math.floor(Math.random() * theme.productColors.length)];

                    // Varied product shapes
                    let productGeo;
                    const shapeType = Math.floor(Math.random() * 3);
                    if (shapeType === 0) {
                        productGeo = new THREE.BoxGeometry(0.6, 0.8 + Math.random() * 0.5, 0.6);
                    } else if (shapeType === 1) {
                        productGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.9 + Math.random() * 0.4, 8);
                    } else {
                        productGeo = new THREE.BoxGeometry(0.4, 1.2 + Math.random() * 0.3, 0.4);
                    }

                    const productMat = new THREE.MeshStandardMaterial({ color });
                    const product = new THREE.Mesh(productGeo, productMat);
                    product.position.set(
                        -1.2 + col * 1.2,
                        0.9 + level * 1.2 + (shapeType === 1 ? 0.45 : 0.4),
                        -1.2 + row * 1.2
                    );
                    product.castShadow = true;
                    group.add(product);
                }
            }
        }

        // Promotional sign on top (50% chance)
        if (Math.random() > 0.5) {
            const signGeo = new THREE.PlaneGeometry(2.5, 1);
            const signCanvas = document.createElement('canvas');
            signCanvas.width = 256;
            signCanvas.height = 128;
            const ctx = signCanvas.getContext('2d');

            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(0, 0, 256, 128);
            ctx.strokeStyle = '#c0392b';
            ctx.lineWidth = 8;
            ctx.strokeRect(4, 4, 248, 120);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SALE!', 128, 55);
            ctx.font = '24px Arial';
            ctx.fillText('50% OFF', 128, 95);

            const signTex = new THREE.CanvasTexture(signCanvas);
            const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
            const sign = new THREE.Mesh(signGeo, signMat);
            sign.position.y = 3.5;
            sign.rotation.y = Math.random() * Math.PI * 2;
            group.add(sign);
        }

        return group;
    },

    /**
     * Create wall shelf unit
     * @param {THREE} THREE - Three.js library
     * @param {Object} theme - Room theme
     * @param {number} x - X position
     * @param {number} z - Z position
     * @param {boolean} facingLeft - Whether shelf faces left
     * @param {Object} [shelfSystem] - Optional ShelfSystem for templates
     * @returns {THREE.Group} Shelf group
     */
    createShelfUnit(THREE, theme, x, z, facingLeft, shelfSystem) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);
        if (facingLeft) group.rotation.y = Math.PI;

        // Get template
        const template = shelfSystem ?
            shelfSystem.getShelfTemplate('WALL_TALL') :
            { frameSize: { w: 4, h: 8, d: 1.5 }, shelfCount: 3, productsPerShelf: 4 };

        // Frame
        const frameGeo = new THREE.BoxGeometry(template.frameSize.w, template.frameSize.h, template.frameSize.d);
        const frameMat = new THREE.MeshStandardMaterial({ color: theme.shelfColor });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.y = 4;
        frame.castShadow = true;
        group.add(frame);

        // Shelves and products
        const boardGeo = new THREE.BoxGeometry(3.8, 0.15, 1.4);
        const boardMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(theme.shelfColor).multiplyScalar(0.7)
        });
        const productGeo = new THREE.BoxGeometry(0.6, 1.2, 0.5);

        for (let i = 0; i < template.shelfCount; i++) {
            const board = new THREE.Mesh(boardGeo, boardMat);
            board.position.set(0, 0.6 + i * 2.5, 0.2);
            group.add(board);

            if (theme.productColors && theme.productColors.length > 0) {
                for (let j = 0; j < template.productsPerShelf; j++) {
                    const color = shelfSystem ?
                        shelfSystem.pickProductColor(theme) :
                        theme.productColors[Math.floor(Math.random() * theme.productColors.length)];
                    const prodMat = new THREE.MeshLambertMaterial({ color });
                    const product = new THREE.Mesh(productGeo, prodMat);
                    product.position.set(-1.2 + j * 0.8, 1.3 + i * 2.5, 0.2);
                    group.add(product);
                }
            }
        }

        return group;
    },

    /**
     * Create wall-mounted shelf (for north/south walls)
     * @param {THREE} THREE - Three.js library
     * @param {Object} theme - Room theme
     * @param {number} x - X position
     * @param {number} z - Z position
     * @param {number} rotation - Y rotation
     * @param {Object} [shelfSystem] - Optional ShelfSystem
     * @returns {THREE.Group} Shelf group
     */
    createWallShelf(THREE, theme, x, z, rotation, shelfSystem) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);
        group.rotation.y = rotation;

        // Get template
        const template = shelfSystem ?
            shelfSystem.getShelfTemplate('WALL_STANDARD') :
            { shelfCount: 3, productsPerShelf: 4 };

        // Frame
        const frameGeo = new THREE.BoxGeometry(4, 6, 0.8);
        const frameMat = new THREE.MeshStandardMaterial({ color: theme.shelfColor });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.y = 3;
        frame.castShadow = true;
        group.add(frame);

        // Shelves and products
        for (let i = 0; i < template.shelfCount; i++) {
            const boardGeo = new THREE.BoxGeometry(3.8, 0.1, 0.9);
            const boardMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(theme.shelfColor).multiplyScalar(0.7)
            });
            const board = new THREE.Mesh(boardGeo, boardMat);
            board.position.set(0, 0.5 + i * 2, 0);
            group.add(board);

            if (theme.productColors && theme.productColors.length > 0) {
                for (let j = 0; j < template.productsPerShelf; j++) {
                    const color = shelfSystem ?
                        shelfSystem.pickProductColor(theme) :
                        theme.productColors[Math.floor(Math.random() * theme.productColors.length)];
                    const heightVar = 0.4;
                    const productGeo = new THREE.BoxGeometry(0.5, 0.6 + Math.random() * heightVar, 0.4);
                    const productMat = new THREE.MeshStandardMaterial({ color });
                    const product = new THREE.Mesh(productGeo, productMat);
                    product.position.set(-1.2 + j * 0.8, 1 + i * 2, 0);
                    product.castShadow = true;
                    group.add(product);
                }
            }
        }

        return group;
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
