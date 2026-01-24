// ============================================
// ENGINE TESTS - Domain Unit Tests
// ============================================
// Tests for all engine components.
// Requires TestFramework to be available globally.

(function() {
    const test = window.TestFramework;
    if (!test) {
        console.error('TestFramework not found');
        return;
    }

    // ==========================================
    // ENGINE CONSTANTS TESTS
    // ==========================================

    test.describe('Engine Constants', () => {
        test.it('should have all game states defined', () => {
            test.assertEqual(Engine.STATES.MENU, 'MENU');
            test.assertEqual(Engine.STATES.PLAYING, 'PLAYING');
            test.assertEqual(Engine.STATES.PAUSED, 'PAUSED');
            test.assertEqual(Engine.STATES.GAME_OVER, 'GAME_OVER');
        });

        test.it('should have valid state transitions', () => {
            test.assertEqual(Engine.isValidTransition('MENU', 'PLAYING'), true, 'MENU -> PLAYING');
            test.assertEqual(Engine.isValidTransition('PLAYING', 'PAUSED'), true, 'PLAYING -> PAUSED');
            test.assertEqual(Engine.isValidTransition('PLAYING', 'GAME_OVER'), true, 'PLAYING -> GAME_OVER');
            test.assertEqual(Engine.isValidTransition('PAUSED', 'PLAYING'), true, 'PAUSED -> PLAYING');
            test.assertEqual(Engine.isValidTransition('PAUSED', 'MENU'), true, 'PAUSED -> MENU');
            test.assertEqual(Engine.isValidTransition('GAME_OVER', 'PLAYING'), true, 'GAME_OVER -> PLAYING');
            test.assertEqual(Engine.isValidTransition('GAME_OVER', 'MENU'), true, 'GAME_OVER -> MENU');
        });

        test.it('should reject invalid state transitions', () => {
            test.assertEqual(Engine.isValidTransition('MENU', 'PAUSED'), false);
            test.assertEqual(Engine.isValidTransition('MENU', 'GAME_OVER'), false);
            test.assertEqual(Engine.isValidTransition('PLAYING', 'MENU'), false);
        });

        test.it('should have default key bindings', () => {
            test.assertEqual(Engine.getActionForKey('KeyW'), 'forward');
            test.assertEqual(Engine.getActionForKey('KeyS'), 'backward');
            test.assertEqual(Engine.getActionForKey('KeyA'), 'turnLeft');
            test.assertEqual(Engine.getActionForKey('KeyD'), 'turnRight');
            test.assertEqual(Engine.getActionForKey('Space'), 'fire');
            test.assertEqual(Engine.getActionForKey('Escape'), 'pause');
        });

        test.it('should have all actions defined', () => {
            const actions = Engine.getAllActions();
            test.assertEqual(actions.includes('forward'), true);
            test.assertEqual(actions.includes('backward'), true);
            test.assertEqual(actions.includes('turnLeft'), true);
            test.assertEqual(actions.includes('turnRight'), true);
            test.assertEqual(actions.includes('fire'), true);
            test.assertEqual(actions.includes('pause'), true);
        });
    });

    // ==========================================
    // COLLISION TESTS
    // ==========================================

    test.describe('Engine: Collision Detection', () => {
        test.it('should detect 2D distance collision', () => {
            const pos1 = { x: 0, z: 0 };
            const pos2 = { x: 3, z: 4 }; // Distance = 5

            test.assertEqual(CollisionSystem.checkDistance2D(pos1, pos2, 6), true, 'Within radius');
            test.assertEqual(CollisionSystem.checkDistance2D(pos1, pos2, 5), true, 'At radius');
            test.assertEqual(CollisionSystem.checkDistance2D(pos1, pos2, 4), false, 'Outside radius');
        });

        test.it('should calculate 2D distance correctly', () => {
            const pos1 = { x: 0, z: 0 };
            const pos2 = { x: 3, z: 4 };

            test.assertCloseTo(CollisionSystem.distance2D(pos1, pos2), 5, 0.001);
        });

        test.it('should detect 3D distance collision', () => {
            const pos1 = { x: 0, y: 0, z: 0 };
            const pos2 = { x: 0, y: 3, z: 4 }; // Distance = 5

            test.assertEqual(CollisionSystem.checkDistance3D(pos1, pos2, 6), true);
            test.assertEqual(CollisionSystem.checkDistance3D(pos1, pos2, 4), false);
        });

        test.it('should detect AABB collision', () => {
            const box1 = {
                min: { x: 0, y: 0, z: 0 },
                max: { x: 2, y: 2, z: 2 }
            };
            const box2 = {
                min: { x: 1, y: 1, z: 1 },
                max: { x: 3, y: 3, z: 3 }
            };
            const box3 = {
                min: { x: 5, y: 5, z: 5 },
                max: { x: 6, y: 6, z: 6 }
            };

            test.assertEqual(CollisionSystem.checkAABB(box1, box2), true, 'Overlapping');
            test.assertEqual(CollisionSystem.checkAABB(box1, box3), false, 'Not overlapping');
        });

        test.it('should create AABB from center and half-extents', () => {
            const aabb = CollisionSystem.createAABB(
                { x: 5, y: 5, z: 5 },
                { x: 1, y: 1, z: 1 }
            );

            test.assertEqual(aabb.min.x, 4);
            test.assertEqual(aabb.min.y, 4);
            test.assertEqual(aabb.min.z, 4);
            test.assertEqual(aabb.max.x, 6);
            test.assertEqual(aabb.max.y, 6);
            test.assertEqual(aabb.max.z, 6);
        });

        test.it('should test point in AABB', () => {
            const box = {
                min: { x: 0, y: 0, z: 0 },
                max: { x: 10, y: 10, z: 10 }
            };

            test.assertEqual(CollisionSystem.pointInAABB({ x: 5, y: 5, z: 5 }, box), true, 'Inside');
            test.assertEqual(CollisionSystem.pointInAABB({ x: 0, y: 0, z: 0 }, box), true, 'On edge');
            test.assertEqual(CollisionSystem.pointInAABB({ x: 15, y: 5, z: 5 }, box), false, 'Outside');
        });

        test.it('should perform sweep sphere test', () => {
            const prev = { x: 0, y: 0, z: 0 };
            const curr = { x: 10, y: 0, z: 0 };
            const target = { x: 5, y: 0, z: 0 };

            const hit = CollisionSystem.sweepSphere(prev, curr, target, 1);
            test.assertEqual(hit !== null, true, 'Should hit');
            test.assertCloseTo(hit.t, 0.4, 0.1, 'Hit at ~40% along path');
        });
    });

    // ==========================================
    // INPUT TESTS
    // ==========================================

    test.describe('Engine: Input System', () => {
        test.beforeEach(() => {
            InputSystem.init();
        });

        test.afterEach(() => {
            InputSystem.destroy();
            InputSystem.clearAllCallbacks();
        });

        test.it('should initialize with default bindings', () => {
            test.assertEqual(InputSystem.getBinding('KeyW'), 'forward');
            test.assertEqual(InputSystem.getBinding('Space'), 'fire');
        });

        test.it('should track key states', () => {
            test.assertEqual(InputSystem.keys.forward, false);
            test.assertEqual(InputSystem.keys.backward, false);
            test.assertEqual(InputSystem.keys.turnLeft, false);
            test.assertEqual(InputSystem.keys.turnRight, false);
        });

        test.it('should return movement input', () => {
            const movement = InputSystem.getMovement();
            test.assertEqual(movement.forward, 0);
            test.assertEqual(movement.turn, 0);
        });

        test.it('should reset key states', () => {
            InputSystem.keys.forward = true;
            InputSystem.keys.turnLeft = true;
            InputSystem.reset();
            test.assertEqual(InputSystem.keys.forward, false);
            test.assertEqual(InputSystem.keys.turnLeft, false);
        });

        test.it('should allow custom bindings', () => {
            InputSystem.setBinding('KeyX', 'customAction');
            test.assertEqual(InputSystem.getBinding('KeyX'), 'customAction');
        });

        test.it('should report initialization state', () => {
            test.assertEqual(InputSystem.isInitialized(), true);
            InputSystem.destroy();
            test.assertEqual(InputSystem.isInitialized(), false);
        });
    });

    // ==========================================
    // GAME STATE TESTS
    // ==========================================

    test.describe('Engine: State System', () => {
        test.beforeEach(() => {
            StateSystem.clearAllCallbacks();
            StateSystem.init('MENU');
        });

        test.it('should initialize to specified state', () => {
            test.assertEqual(StateSystem.get(), 'MENU');
        });

        test.it('should check current state', () => {
            test.assertEqual(StateSystem.is('MENU'), true);
            test.assertEqual(StateSystem.is('PLAYING'), false);
        });

        test.it('should check multiple states with isAny', () => {
            test.assertEqual(StateSystem.isAny('MENU', 'PLAYING'), true);
            test.assertEqual(StateSystem.isAny('PAUSED', 'GAME_OVER'), false);
        });

        test.it('should transition to valid state', () => {
            const result = StateSystem.transition('PLAYING');
            test.assertEqual(result, true);
            test.assertEqual(StateSystem.get(), 'PLAYING');
        });

        test.it('should reject invalid transition', () => {
            const result = StateSystem.transition('PAUSED');
            test.assertEqual(result, false);
            test.assertEqual(StateSystem.get(), 'MENU');
        });

        test.it('should report valid transitions', () => {
            const valid = StateSystem.getValidTransitions();
            test.assertEqual(valid.includes('PLAYING'), true);
            test.assertEqual(valid.includes('PAUSED'), false);
        });

        test.it('should fire enter callback on transition', () => {
            let entered = false;
            StateSystem.onStateEnter('PLAYING', () => { entered = true; });
            StateSystem.transition('PLAYING');
            test.assertEqual(entered, true);
        });

        test.it('should fire exit callback on transition', () => {
            let exited = false;
            StateSystem.onStateExit('MENU', () => { exited = true; });
            StateSystem.transition('PLAYING');
            test.assertEqual(exited, true);
        });

        test.it('should fire global change callback', () => {
            let prevState = null;
            let newState = null;
            StateSystem.onChange((prev, next) => {
                prevState = prev;
                newState = next;
            });
            StateSystem.transition('PLAYING');
            test.assertEqual(prevState, 'MENU');
            test.assertEqual(newState, 'PLAYING');
        });

        test.it('should have convenience methods', () => {
            test.assertEqual(StateSystem.isMenu(), true);
            test.assertEqual(StateSystem.isPlaying(), false);

            StateSystem.transition('PLAYING');
            test.assertEqual(StateSystem.isPlaying(), true);

            StateSystem.transition('PAUSED');
            test.assertEqual(StateSystem.isPaused(), true);

            StateSystem.transition('MENU');
            StateSystem.forceTransition('GAME_OVER');
            test.assertEqual(StateSystem.isGameOver(), true);
        });
    });

    // ==========================================
    // GAME LOOP TESTS
    // ==========================================

    test.describe('Engine: Loop System', () => {
        test.beforeEach(() => {
            // Initialize with mock THREE
            LoopSystem.init({ Clock: function() {
                this.start = () => {};
                this.getDelta = () => 0.016;
            }});
        });

        test.it('should not be running initially', () => {
            test.assertEqual(LoopSystem.isRunning(), false);
        });

        test.it('should track frame count', () => {
            test.assertEqual(LoopSystem.getFrameCount(), 0);
        });

        test.it('should have configurable max delta time', () => {
            LoopSystem.setMaxDeltaTime(0.05);
            test.assertEqual(LoopSystem.getMaxDeltaTime(), 0.05);
        });

        test.it('should accept update callback', () => {
            let called = false;
            LoopSystem.setUpdateCallback(() => { called = true; });
            // Note: callback won't fire until loop starts
            test.assertEqual(called, false);
        });

        test.it('should accept render callback', () => {
            let called = false;
            LoopSystem.setRenderCallback(() => { called = true; });
            test.assertEqual(called, false);
        });

        test.it('should manage pre-update callbacks', () => {
            const cb = () => {};
            LoopSystem.addPreUpdate(cb);
            LoopSystem.removePreUpdate(cb);
            // No error means success
        });

        test.it('should manage post-update callbacks', () => {
            const cb = () => {};
            LoopSystem.addPostUpdate(cb);
            LoopSystem.removePostUpdate(cb);
        });
    });

    // ==========================================
    // SCENE MANAGER TESTS
    // ==========================================

    test.describe('Engine: Scene System', () => {
        // Note: These tests require THREE.js to be loaded
        test.it('should initialize with THREE reference', () => {
            if (typeof THREE === 'undefined') {
                // Skip if THREE not available
                return;
            }

            const container = document.createElement('div');
            SceneSystem.init(THREE, container);

            test.assertEqual(SceneSystem.scene !== null, true, 'Scene created');
            test.assertEqual(SceneSystem.camera !== null, true, 'Camera created');
            test.assertEqual(SceneSystem.renderer !== null, true, 'Renderer created');

            SceneSystem.dispose();
        });

        test.it('should create and manage groups', () => {
            if (typeof THREE === 'undefined') return;

            const container = document.createElement('div');
            SceneSystem.init(THREE, container);

            const group = SceneSystem.createGroup('testGroup');
            test.assertEqual(group !== null, true, 'Group created');
            test.assertEqual(SceneSystem.getGroup('testGroup'), group, 'Group retrieved');

            SceneSystem.dispose();
        });

        test.it('should add objects to groups', () => {
            if (typeof THREE === 'undefined') return;

            const container = document.createElement('div');
            SceneSystem.init(THREE, container);

            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshBasicMaterial()
            );

            SceneSystem.createGroup('test');
            const result = SceneSystem.addToGroup('test', mesh);
            test.assertEqual(result, true);

            SceneSystem.dispose();
        });
    });

    // ==========================================
    // ENTITY MANAGER TESTS
    // ==========================================

    test.describe('Engine: Entity System', () => {
        test.beforeEach(() => {
            // Mock scene
            const mockScene = {
                add: () => {},
                remove: () => {}
            };
            EntitySystem.init(mockScene);
        });

        test.it('should register entity types', () => {
            EntitySystem.registerType('enemy', { maxCount: 5 });
            test.assertEqual(EntitySystem.hasType('enemy'), true);
        });

        test.it('should spawn entities', () => {
            EntitySystem.registerType('enemy', { maxCount: 5 });
            const mockMesh = { position: { x: 0, y: 0, z: 0 }, userData: {} };
            const entity = EntitySystem.spawn('enemy', mockMesh, { health: 3 });

            test.assertEqual(entity !== null, true, 'Entity spawned');
            test.assertEqual(entity.type, 'enemy');
            test.assertEqual(entity.data.health, 3);
            test.assertEqual(entity.active, true);
        });

        test.it('should respect max count', () => {
            EntitySystem.registerType('enemy', { maxCount: 2 });

            const mesh1 = { position: { x: 0, y: 0, z: 0 }, userData: {} };
            const mesh2 = { position: { x: 1, y: 0, z: 0 }, userData: {} };
            const mesh3 = { position: { x: 2, y: 0, z: 0 }, userData: {} };

            EntitySystem.spawn('enemy', mesh1);
            EntitySystem.spawn('enemy', mesh2);
            const result = EntitySystem.spawn('enemy', mesh3);

            test.assertEqual(result, null, 'Third spawn rejected');
            test.assertEqual(EntitySystem.getCount('enemy'), 2);
        });

        test.it('should despawn entities', () => {
            EntitySystem.registerType('enemy', { maxCount: 5 });
            const mockMesh = { position: { x: 0, y: 0, z: 0 }, userData: {} };
            const entity = EntitySystem.spawn('enemy', mockMesh);

            EntitySystem.despawn('enemy', entity);
            test.assertEqual(EntitySystem.getCount('enemy'), 0);
        });

        test.it('should get active entities', () => {
            EntitySystem.registerType('enemy', { maxCount: 5 });
            const mesh1 = { position: { x: 0, y: 0, z: 0 }, userData: {} };
            const mesh2 = { position: { x: 1, y: 0, z: 0 }, userData: {} };

            EntitySystem.spawn('enemy', mesh1);
            EntitySystem.spawn('enemy', mesh2);

            const active = EntitySystem.getActive('enemy');
            test.assertEqual(active.length, 2);
        });

        test.it('should check capacity', () => {
            EntitySystem.registerType('enemy', { maxCount: 1 });
            test.assertEqual(EntitySystem.isAtCapacity('enemy'), false);

            const mockMesh = { position: { x: 0, y: 0, z: 0 }, userData: {} };
            EntitySystem.spawn('enemy', mockMesh);
            test.assertEqual(EntitySystem.isAtCapacity('enemy'), true);
        });

        test.it('should iterate with forEach', () => {
            EntitySystem.registerType('enemy', { maxCount: 5 });
            const mesh1 = { position: { x: 0, y: 0, z: 0 }, userData: {} };
            const mesh2 = { position: { x: 1, y: 0, z: 0 }, userData: {} };

            EntitySystem.spawn('enemy', mesh1);
            EntitySystem.spawn('enemy', mesh2);

            let count = 0;
            EntitySystem.forEach('enemy', () => { count++; });
            test.assertEqual(count, 2);
        });

        test.it('should filter entities', () => {
            EntitySystem.registerType('enemy', { maxCount: 5 });
            const mesh1 = { position: { x: 0, y: 0, z: 0 }, userData: {} };
            const mesh2 = { position: { x: 5, y: 0, z: 0 }, userData: {} };

            EntitySystem.spawn('enemy', mesh1, { damage: 10 });
            EntitySystem.spawn('enemy', mesh2, { damage: 20 });

            const highDamage = EntitySystem.filter('enemy', e => e.data.damage > 15);
            test.assertEqual(highDamage.length, 1);
        });

        test.it('should reset all entities', () => {
            EntitySystem.registerType('enemy', { maxCount: 5 });
            const mesh1 = { position: { x: 0, y: 0, z: 0 }, userData: {} };
            EntitySystem.spawn('enemy', mesh1);

            EntitySystem.reset();
            test.assertEqual(EntitySystem.getCount('enemy'), 0);
        });
    });

})();
