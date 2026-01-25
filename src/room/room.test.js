// ============================================
// ROOM DOMAIN - Unit Tests
// ============================================
// Tests for Room data, RoomTheme, RoomMesh, and RoomSystem

(function(test) {
    'use strict';

    // ==========================================
    // ROOM DATA TESTS
    // ==========================================

    test.describe('Room Data', () => {
        test.it('should have structure constants', () => {
            test.assertTrue(Room.structure.UNIT > 0, 'UNIT should be positive');
            test.assertTrue(Room.structure.DOOR_WIDTH > 0, 'DOOR_WIDTH should be positive');
            test.assertTrue(Room.structure.WALL_HEIGHT > 0, 'WALL_HEIGHT should be positive');
        });

        test.it('should have direction definitions', () => {
            test.assertEqual(Room.directions.length, 4, 'should have 4 directions');
            test.assertTrue(Room.directions.includes('north'), 'should include north');
            test.assertTrue(Room.directions.includes('south'), 'should include south');
            test.assertTrue(Room.directions.includes('east'), 'should include east');
            test.assertTrue(Room.directions.includes('west'), 'should include west');
        });

        test.it('should have opposite direction mapping', () => {
            test.assertEqual(Room.oppositeDirection.north, 'south');
            test.assertEqual(Room.oppositeDirection.south, 'north');
            test.assertEqual(Room.oppositeDirection.east, 'west');
            test.assertEqual(Room.oppositeDirection.west, 'east');
        });

        test.it('should convert grid to world position', () => {
            const world = Room.gridToWorld(1, 2);
            const expected = Room.structure.UNIT * 1 + Room.structure.UNIT / 2;
            test.assertEqual(world.x, expected, 'x should be correct');
        });

        test.it('should convert world to grid position', () => {
            const grid = Room.worldToGrid(45, 75);
            test.assertEqual(grid.x, 1, 'grid x should be 1');
            test.assertEqual(grid.z, 2, 'grid z should be 2');
        });

        test.it('should get room bounds', () => {
            const bounds = Room.getRoomBounds(1, 1);
            test.assertEqual(bounds.minX, Room.structure.UNIT);
            test.assertEqual(bounds.maxX, Room.structure.UNIT * 2);
            test.assertEqual(bounds.minZ, Room.structure.UNIT);
            test.assertEqual(bounds.maxZ, Room.structure.UNIT * 2);
        });

        test.it('should create room data object', () => {
            const room = Room.createRoomData(1, 2, 'PRODUCE', ['north', 'south']);
            test.assertEqual(room.gridX, 1);
            test.assertEqual(room.gridZ, 2);
            test.assertEqual(room.theme, 'PRODUCE');
            test.assertEqual(room.doors.length, 2);
            test.assertFalse(room.visited);
        });
    });

    // ==========================================
    // ROOM THEME TESTS
    // ==========================================

    test.describe('Room Theme', () => {
        test.it('should have multiple themes defined', () => {
            const themeIds = RoomTheme.getThemeIds();
            test.assertTrue(themeIds.length >= 10, 'should have at least 10 themes');
        });

        test.it('should have PRODUCE theme', () => {
            const theme = RoomTheme.getTheme('PRODUCE');
            test.assertTrue(theme !== null, 'PRODUCE should exist');
            test.assertEqual(theme.name, 'PRODUCE');
            test.assertTrue(theme.productColors.length > 0, 'should have product colors');
        });

        test.it('should have JUNCTION theme with noShelves', () => {
            const theme = RoomTheme.getTheme('JUNCTION');
            test.assertTrue(theme !== null);
            test.assertTrue(theme.noShelves, 'JUNCTION should have noShelves');
        });

        test.it('should have common room styling', () => {
            test.assertTrue(RoomTheme.common.wallColor !== undefined);
            test.assertTrue(RoomTheme.common.ceilingColor !== undefined);
        });

        test.it('should return null for unknown theme', () => {
            const theme = RoomTheme.getTheme('UNKNOWN');
            test.assertEqual(theme, null);
        });

        test.it('should get shelf themes (excluding junction/entrance)', () => {
            const shelfThemes = RoomTheme.getShelfThemes();
            test.assertTrue(shelfThemes.length > 0);
            test.assertFalse(shelfThemes.includes('JUNCTION'));
            test.assertFalse(shelfThemes.includes('ENTRANCE'));
        });

        test.it('should get random product color', () => {
            const color = RoomTheme.getRandomProductColor('PRODUCE');
            test.assertTrue(typeof color === 'number');
        });
    });

    // ==========================================
    // ROOM SYSTEM TESTS
    // ==========================================

    test.describe('Room System - Initialization', () => {
        test.it('should initialize with data references', () => {
            RoomSystem.init(Room, RoomTheme);
            test.assertEqual(RoomSystem.roomData, Room);
            test.assertEqual(RoomSystem.themeData, RoomTheme);
        });

        test.it('should reset state', () => {
            RoomSystem.init(Room, RoomTheme);
            RoomSystem.addRoom(0, 0, 'PRODUCE', []);
            RoomSystem.reset();
            test.assertEqual(Object.keys(RoomSystem.rooms).length, 0);
            test.assertEqual(RoomSystem.currentRoom, null);
        });
    });

    test.describe('Room System - Room Management', () => {
        test.beforeEach(() => {
            RoomSystem.init(Room, RoomTheme);
        });

        test.it('should add room', () => {
            const room = RoomSystem.addRoom(1, 2, 'DAIRY', ['north']);
            test.assertEqual(room.gridX, 1);
            test.assertEqual(room.gridZ, 2);
            test.assertEqual(room.theme, 'DAIRY');
        });

        test.it('should get room by grid position', () => {
            RoomSystem.addRoom(1, 2, 'DAIRY', []);
            const room = RoomSystem.getRoom(1, 2);
            test.assertTrue(room !== null);
            test.assertEqual(room.theme, 'DAIRY');
        });

        test.it('should get room by world position', () => {
            RoomSystem.addRoom(1, 2, 'FROZEN', []);
            const room = RoomSystem.getRoomAtWorld(45, 75);
            test.assertTrue(room !== null);
            test.assertEqual(room.theme, 'FROZEN');
        });

        test.it('should return null for non-existent room', () => {
            const room = RoomSystem.getRoom(99, 99);
            test.assertEqual(room, null);
        });

        test.it('should check room existence', () => {
            RoomSystem.addRoom(1, 1, 'PRODUCE', []);
            test.assertTrue(RoomSystem.hasRoom(1, 1));
            test.assertFalse(RoomSystem.hasRoom(5, 5));
        });

        test.it('should get all rooms', () => {
            RoomSystem.addRoom(0, 0, 'PRODUCE', []);
            RoomSystem.addRoom(1, 0, 'DAIRY', []);
            const all = RoomSystem.getAllRooms();
            test.assertEqual(all.length, 2);
        });

        test.it('should get room theme', () => {
            const room = RoomSystem.addRoom(1, 1, 'SNACKS', []);
            const theme = RoomSystem.getRoomTheme(room);
            test.assertTrue(theme !== null);
            test.assertEqual(theme.name, 'SNACKS');
        });
    });

    test.describe('Room System - Room Tracking', () => {
        test.beforeEach(() => {
            RoomSystem.init(Room, RoomTheme);
            RoomSystem.addRoom(1, 2, 'PRODUCE', []);
            RoomSystem.addRoom(1, 3, 'DAIRY', []);
        });

        test.it('should update current room', () => {
            const room = RoomSystem.updateCurrentRoom(45, 75);
            test.assertTrue(room !== null);
            test.assertEqual(RoomSystem.getCurrentRoom(), room);
        });

        test.it('should return null if room unchanged', () => {
            RoomSystem.updateCurrentRoom(45, 75);
            const result = RoomSystem.updateCurrentRoom(46, 76); // Same room
            test.assertEqual(result, null);
        });

        test.it('should mark room as visited', () => {
            const isFirst = RoomSystem.markVisited(1, 2);
            test.assertTrue(isFirst, 'first visit should return true');
            test.assertTrue(RoomSystem.isVisited(1, 2));

            const isSecond = RoomSystem.markVisited(1, 2);
            test.assertFalse(isSecond, 'second visit should return false');
        });

        test.it('should track visited rooms separately', () => {
            RoomSystem.markVisited(1, 2);
            test.assertTrue(RoomSystem.isVisited(1, 2));
            test.assertFalse(RoomSystem.isVisited(1, 3));
        });
    });

    test.describe('Room System - Neighbors', () => {
        test.beforeEach(() => {
            RoomSystem.init(Room, RoomTheme);
            RoomSystem.addRoom(1, 1, 'PRODUCE', ['south', 'east']);
            RoomSystem.addRoom(1, 2, 'DAIRY', ['north']);
            RoomSystem.addRoom(2, 1, 'FROZEN', ['west']);
        });

        test.it('should get neighbor in direction', () => {
            const neighbor = RoomSystem.getNeighbor(1, 1, 'south');
            test.assertTrue(neighbor !== null);
            test.assertEqual(neighbor.theme, 'DAIRY');
        });

        test.it('should return null for no neighbor', () => {
            const neighbor = RoomSystem.getNeighbor(1, 1, 'north');
            test.assertEqual(neighbor, null);
        });

        test.it('should get all neighbors', () => {
            const neighbors = RoomSystem.getNeighbors(1, 1);
            test.assertTrue(neighbors.south !== undefined);
            test.assertTrue(neighbors.east !== undefined);
            test.assertEqual(neighbors.north, undefined);
        });

        test.it('should check door existence', () => {
            test.assertTrue(RoomSystem.hasDoor(1, 1, 'south'));
            test.assertTrue(RoomSystem.hasDoor(1, 1, 'east'));
            test.assertFalse(RoomSystem.hasDoor(1, 1, 'north'));
        });

        test.it('should check room connection', () => {
            test.assertTrue(RoomSystem.areConnected(1, 1, 1, 2));
            test.assertTrue(RoomSystem.areConnected(1, 1, 2, 1));
            test.assertFalse(RoomSystem.areConnected(1, 2, 2, 1)); // Not adjacent
        });
    });

    test.describe('Room System - Grid Generation', () => {
        test.beforeEach(() => {
            RoomSystem.init(Room, RoomTheme);
        });

        test.it('should generate grid of rooms', () => {
            const rooms = RoomSystem.generateGrid(3, 3, 'PRODUCE');
            test.assertEqual(rooms.length, 9);
        });

        test.it('should add doors between adjacent rooms', () => {
            RoomSystem.generateGrid(2, 2, 'PRODUCE');
            // Center room should have all 4 neighbors
            // Corner room (0,0) should have south and east
            const corner = RoomSystem.getRoom(0, 0);
            test.assertTrue(corner.doors.includes('south'));
            test.assertTrue(corner.doors.includes('east'));
            test.assertFalse(corner.doors.includes('north'));
            test.assertFalse(corner.doors.includes('west'));
        });

        test.it('should set theme for room', () => {
            RoomSystem.addRoom(0, 0, 'PRODUCE', []);
            RoomSystem.setTheme(0, 0, 'DAIRY');
            const room = RoomSystem.getRoom(0, 0);
            test.assertEqual(room.theme, 'DAIRY');
        });
    });

    // ==========================================
    // ROOM MESH TESTS
    // ==========================================

    test.describe('Room Mesh', () => {
        test.it('should have createFloor method', () => {
            test.assertTrue(typeof RoomMesh.createFloor === 'function');
        });

        test.it('should have createCeiling method', () => {
            test.assertTrue(typeof RoomMesh.createCeiling === 'function');
        });

        test.it('should have createWall method', () => {
            test.assertTrue(typeof RoomMesh.createWall === 'function');
        });

        test.it('should have createRoom method', () => {
            test.assertTrue(typeof RoomMesh.createRoom === 'function');
        });

        // Mesh creation tests require THREE.js
        test.it('should create floor with THREE', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const theme = RoomTheme.getTheme('PRODUCE');
            const floor = RoomMesh.createFloor(THREE, theme, 15, 15);
            test.assertTrue(floor instanceof THREE.Group);
            test.assertTrue(floor.children.length > 0);
        });

        test.it('should create ceiling with THREE', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const theme = RoomTheme.getTheme('PRODUCE');
            const ceiling = RoomMesh.createCeiling(THREE, theme, 15, 15);
            test.assertTrue(ceiling instanceof THREE.Group);
        });

        test.it('should create complete room with THREE', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const room = Room.createRoomData(0, 0, 'PRODUCE', ['north', 'south']);
            const theme = RoomTheme.getTheme('PRODUCE');
            const roomMesh = RoomMesh.createRoom(THREE, room, theme);
            test.assertTrue(roomMesh instanceof THREE.Group);
            test.assertTrue(roomMesh.children.length >= 3); // floor, ceiling, walls
        });

        test.it('should have createCenterDisplay method', () => {
            test.assertTrue(typeof RoomMesh.createCenterDisplay === 'function');
        });

        test.it('should create center display with THREE', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const theme = RoomTheme.getTheme('PRODUCE');
            const display = RoomMesh.createCenterDisplay(THREE, theme, 15, 15, null);
            test.assertTrue(display instanceof THREE.Group);
            test.assertTrue(display.children.length > 0, 'Center display should have children');
        });
    });

    // ==========================================
    // CENTER DISPLAY COLLISION TESTS
    // ==========================================

    test.describe('Center Display Collision', () => {
        test.it('should add center display to shelfArray with collision data', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            // Create a non-JUNCTION room
            const room = Room.createRoomData(0, 0, 'PRODUCE', ['north']);
            RoomSystem.reset();
            RoomSystem.addRoom(room);

            const shelfArray = [];
            RoomSystem.createRoomMeshes(THREE, room, { shelfArray });

            // Find center display in shelfArray (has 5x5 dimensions)
            const centerDisplay = shelfArray.find(s =>
                s.userData && s.userData.width === 5 && s.userData.depth === 5
            );

            test.assertTrue(centerDisplay !== undefined, 'Center display should be in shelfArray');
            test.assertEqual(centerDisplay.userData.width, 5, 'Center display should have width 5');
            test.assertEqual(centerDisplay.userData.depth, 5, 'Center display should have depth 5');
        });

        test.it('should not create center display in JUNCTION rooms', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const room = Room.createRoomData(0, 0, 'JUNCTION', ['north', 'south', 'east', 'west']);
            RoomSystem.reset();
            RoomSystem.addRoom(room);

            const shelfArray = [];
            RoomSystem.createRoomMeshes(THREE, room, { shelfArray });

            // Check no 5x5 display was added
            const centerDisplay = shelfArray.find(s =>
                s.userData && s.userData.width === 5 && s.userData.depth === 5
            );

            test.assertTrue(centerDisplay === undefined, 'JUNCTION room should not have center display');
        });
    });

})(window.TestFramework || { describe: () => {}, it: () => {}, beforeEach: () => {}, skip: () => {} });
