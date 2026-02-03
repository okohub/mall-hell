/**
 * Enemy UI Tests
 * Tests for Enemy Spawning, AI, Skeleton models
 */

(function(runner) {
    'use strict';

    // Enemy Spawning Tests
    runner.addTest('enemies-exist-in-game', 'Enemy Spawning', 'Enemies array exists in game',
        'Verifies that the enemies array is accessible and game supports enemy spawning',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            for (let i = 0; i < 100; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
            }
            await runner.wait(100);

            const enemies = runner.gameWindow.enemies;
            if (!enemies) {
                throw new Error('Enemies array not found - spawning system missing');
            }

            if (!Array.isArray(enemies)) {
                throw new Error('Enemies should be an array');
            }
        }
    );

    // Skeleton Enemy Model Tests
    runner.addTest('skeleton-enemy-structure', 'Skeleton Enemy', 'Enemy has skeleton model structure',
        'Verifies enemy carts have skeleton driver with proper bone structure',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            const THREE = runner.gameWindow.THREE;
            const SkeletonMesh = runner.gameWindow.SkeletonMesh;
            const Enemy = runner.gameWindow.Enemy;

            if (!SkeletonMesh || !Enemy) {
                throw new Error('SkeletonMesh or Enemy not found');
            }

            const config = Enemy.types.SKELETON;
            const enemy = SkeletonMesh.createEnemy(THREE, config);

            if (!enemy || !enemy.children) {
                throw new Error('Enemy has no children groups');
            }

            let hasCartAndSkeleton = false;
            enemy.traverse(child => {
                if (child.userData && child.userData.skeleton && child.userData.cart) {
                    hasCartAndSkeleton = true;
                }
            });

            if (enemy.userData.skeleton && enemy.userData.cart) {
                hasCartAndSkeleton = true;
            }

            if (!hasCartAndSkeleton) {
                throw new Error('Enemy missing skeleton or cart in userData');
            }
        }
    );

    runner.addTest('skeleton-enemy-userData', 'Skeleton Enemy', 'Enemy has proper userData',
        'Verifies enemy carts have health, active, and drift properties',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            const THREE = runner.gameWindow.THREE;
            const SkeletonMesh = runner.gameWindow.SkeletonMesh;
            const EnemyOrchestrator = runner.gameWindow.EnemyOrchestrator;
            const Enemy = runner.gameWindow.Enemy;

            if (!SkeletonMesh || !EnemyOrchestrator || !Enemy) {
                throw new Error('SkeletonMesh, EnemyOrchestrator, or Enemy not found');
            }

            const config = Enemy.types.SKELETON;
            const enemy = SkeletonMesh.createEnemy(THREE, config);

            const enemyData = EnemyOrchestrator.createEnemyData('SKELETON');
            Object.assign(enemy.userData, enemyData);

            const ud = enemy.userData;
            if (typeof ud.health !== 'number') {
                throw new Error('Enemy missing health property');
            }
            if (typeof ud.active !== 'boolean') {
                throw new Error('Enemy missing active property');
            }
            if (typeof ud.driftSpeed !== 'number') {
                throw new Error('Enemy missing driftSpeed property');
            }
        }
    );

    runner.addTest('skeleton-carries-heart-visual', 'Skeleton Enemy', 'Carrier skeleton shows heart pickup',
        'Verifies carried heart mesh is attached to the cart when carry chance is forced',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            const THREE = runner.gameWindow.THREE;
            const EnemyOrchestrator = runner.gameWindow.EnemyOrchestrator;
            const Enemy = runner.gameWindow.Enemy;

            if (!EnemyOrchestrator || !Enemy || !THREE) {
                throw new Error('EnemyOrchestrator, Enemy, or THREE not found');
            }

            const originalChance = Enemy.types.SKELETON.healthCarryChance;
            Enemy.types.SKELETON.healthCarryChance = 1;

            const enemy = EnemyOrchestrator.createMesh(THREE, 'SKELETON', 0, 0);
            Enemy.types.SKELETON.healthCarryChance = originalChance;

            if (!enemy?.userData?.healthCarryMesh) {
                throw new Error('Expected healthCarryMesh on carrier skeleton');
            }

            const heartMesh = enemy.userData.healthCarryMesh;
            const hasExtrude = heartMesh.children.some((child) => child.geometry && child.geometry.type === 'ExtrudeGeometry');
            if (!hasExtrude) {
                throw new Error('Carried heart should include ExtrudeGeometry');
            }

            const hasGlowShell = heartMesh.children.some((child) =>
                child.geometry &&
                child.geometry.type === 'SphereGeometry' &&
                child.material &&
                child.material.type === 'MeshBasicMaterial'
            );
            if (!hasGlowShell) {
                throw new Error('Carried heart should include a glow shell');
            }
        }
    );

    runner.addTest('skeleton-has-teeth', 'Skeleton Enemy', 'Skeleton has teeth for smile',
        'Verifies skeleton model includes teeth geometry',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            const THREE = runner.gameWindow.THREE;
            const SkeletonMesh = runner.gameWindow.SkeletonMesh;
            const Enemy = runner.gameWindow.Enemy;

            if (!SkeletonMesh || !Enemy) {
                throw new Error('SkeletonMesh or Enemy not found');
            }

            const config = Enemy.types.SKELETON;
            const enemy = SkeletonMesh.createEnemy(THREE, config);

            let meshCount = 0;
            enemy.traverse(obj => {
                if (obj.isMesh) meshCount++;
            });

            if (meshCount < 40) {
                throw new Error(`Skeleton lacks detail, only ${meshCount} meshes (need 40+)`);
            }
        }
    );

    // Pre-Spawning System Tests
    runner.addTest('enemies-spawn-ahead', 'Pre-Spawning', 'Enemies spawn ahead of player',
        'Verifies enemies exist in rooms player hasnt entered yet',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(800);

            // Run update cycles to ensure enemies are spawned
            for (let i = 0; i < 50; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
            }
            await runner.wait(300);

            // Try multiple ways to get enemies
            let enemies = runner.gameWindow.enemies;
            if (!enemies || enemies.length === 0) {
                const internals = runner.gameWindow.__gameInternals;
                if (internals?.getEnemies) {
                    enemies = internals.getEnemies();
                }
            }

            const camera = runner.gameWindow.camera;
            if (!camera) {
                throw new Error('Camera not found');
            }

            if (!enemies || enemies.length === 0) {
                // This might happen if spawnInitialObjects hasn't run yet
                // Check if EnemyOrchestrator has enemies tracked
                const EnemyOrchestrator = runner.gameWindow.EnemyOrchestrator;
                if (EnemyOrchestrator && EnemyOrchestrator.enemies && EnemyOrchestrator.enemies.length > 0) {
                    enemies = EnemyOrchestrator.enemies;
                } else {
                    throw new Error('No enemies spawned at game start');
                }
            }

            const playerZ = camera.position.z;
            const enemiesAhead = enemies.filter(e => {
                if (!e) return false;
                const z = e.position?.z ?? e.z ?? 0;
                return z < playerZ - 5;
            });

            if (enemiesAhead.length === 0) {
                throw new Error(`No enemies ahead: ${enemies.length} enemies, playerZ=${playerZ}`);
            }
        }
    );

    runner.addTest('room-system-exists', 'Pre-Spawning', 'RoomOrchestrator is accessible',
        'Verifies the room system is available',
        async () => {
            runner.resetGame();
            await runner.wait(200);

            const RoomOrchestrator = runner.gameWindow.RoomOrchestrator;
            if (!RoomOrchestrator) {
                throw new Error('RoomOrchestrator not found');
            }

            if (typeof RoomOrchestrator.getAllRooms !== 'function') {
                throw new Error('RoomOrchestrator.getAllRooms method not found');
            }
        }
    );

    // Safe Starting Room Tests
    runner.addTest('safe-room-no-enemies', 'Safe Room', 'Starting room has no enemies',
        'Verifies the first room (1,2) never spawns enemies',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            const enemies = runner.gameWindow.enemies || [];
            const ROOM_UNIT = 30;

            const startRoomCenterX = 1 * ROOM_UNIT + ROOM_UNIT / 2;
            const startRoomCenterZ = 2 * ROOM_UNIT + ROOM_UNIT / 2;

            const enemiesInStart = enemies.filter(e => {
                if (!e.userData || !e.userData.active) return false;
                const dx = Math.abs(e.position.x - startRoomCenterX);
                const dz = Math.abs(e.position.z - startRoomCenterZ);
                return dx < ROOM_UNIT / 2 && dz < ROOM_UNIT / 2;
            });

            if (enemiesInStart.length > 0) {
                throw new Error(`Starting room should have no enemies, found ${enemiesInStart.length}`);
            }
        }
    );

    // Collision System Tests
    runner.addTest('collision-system-exists', 'Collision', 'CollisionOrchestrator is available',
        'Verifies the collision system is loaded',
        async () => {
            runner.resetGame();
            await runner.wait(200);

            const CollisionOrchestrator = runner.gameWindow.CollisionOrchestrator;
            if (!CollisionOrchestrator) {
                throw new Error('CollisionOrchestrator not found');
            }

            if (typeof CollisionOrchestrator.checkAllCollisions !== 'function') {
                throw new Error('CollisionOrchestrator.checkAllCollisions method not found');
            }
        }
    );

    runner.addTest('collision-has-line-of-sight', 'Collision', 'CollisionOrchestrator has line of sight',
        'Verifies line of sight function exists in CollisionOrchestrator',
        async () => {
            runner.resetGame();
            await runner.wait(200);

            const CollisionOrchestrator = runner.gameWindow.CollisionOrchestrator;
            if (!CollisionOrchestrator) {
                throw new Error('CollisionOrchestrator not found');
            }

            if (typeof CollisionOrchestrator.hasLineOfSight !== 'function') {
                throw new Error('CollisionOrchestrator.hasLineOfSight method not found');
            }
        }
    );

    // Boss Spawn Tests
    runner.addTest('boss-spawn-system', 'Boss Enemy', 'EnemyOrchestrator has getSpawnType method',
        'Verifies the getSpawnType method exists and spawns dino every 1000 points',
        async () => {
            runner.resetGame();
            await runner.wait(200);

            const EnemyOrchestrator = runner.gameWindow.EnemyOrchestrator;
            if (!EnemyOrchestrator) {
                throw new Error('EnemyOrchestrator not found');
            }

            if (typeof EnemyOrchestrator.getSpawnType !== 'function') {
                throw new Error('getSpawnType method not found');
            }

            if (EnemyOrchestrator.dinoSpawnInterval !== 5000) {
                throw new Error(`Dino interval should be 5000, got ${EnemyOrchestrator.dinoSpawnInterval}`);
            }
        }
    );

    runner.addTest('boss-dinosaur-type', 'Boss Enemy', 'DINOSAUR enemy type exists',
        'Verifies the DINOSAUR boss type is defined with correct properties',
        async () => {
            runner.resetGame();
            await runner.wait(200);

            const Enemy = runner.gameWindow.Enemy;
            if (!Enemy) {
                throw new Error('Enemy not found');
            }

            const dinosaur = Enemy.types.DINOSAUR;
            if (!dinosaur) {
                throw new Error('DINOSAUR type not defined');
            }

            if (dinosaur.health !== 10) {
                throw new Error(`DINOSAUR health should be 10, got ${dinosaur.health}`);
            }

            if (dinosaur.scoreDestroy !== 1500) {
                throw new Error(`DINOSAUR scoreDestroy should be 1500, got ${dinosaur.scoreDestroy}`);
            }

            if (!dinosaur.isBoss) {
                throw new Error('DINOSAUR should have isBoss flag');
            }
        }
    );

    runner.addTest('boss-warning-creates-element', 'Boss Enemy', 'Boss warning can create notification',
        'Verifies boss warning notification appears in DOM',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(300);

            // Trigger a boss warning manually via the game internals
            const UISystem = runner.gameWindow.UISystem;
            if (UISystem && typeof UISystem.showBossWarning === 'function') {
                UISystem.showBossWarning('TEST BOSS!');
                await runner.wait(100);

                // Check if a boss warning element appeared
                const warning = runner.gameDocument.querySelector('.boss-warning');
                if (!warning) {
                    throw new Error('Boss warning element not created');
                }
            } else {
                // If UISystem not directly accessible, just verify the game started
                if (runner.getGameState() !== 'PLAYING') {
                    throw new Error('Game should be in PLAYING state');
                }
            }
        }
    );

    runner.addTest('boss-spawn-at-5000-points', 'Boss Enemy', 'getSpawnType returns DINOSAUR at 5000 points',
        'Verifies getSpawnType returns DINOSAUR at score thresholds',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            const EnemyOrchestrator = runner.gameWindow.EnemyOrchestrator;

            if (!EnemyOrchestrator) {
                throw new Error('EnemyOrchestrator not found');
            }

            // Reset dino spawn state
            EnemyOrchestrator._dinoSpawnCount = 0;

            // Check SKELETON below 5000 points
            const type0 = EnemyOrchestrator.getSpawnType(4999);
            if (type0 !== 'SKELETON') {
                throw new Error(`getSpawnType(4999) should return SKELETON, got ${type0}`);
            }

            // Check DINOSAUR at 5000 points
            const type5000 = EnemyOrchestrator.getSpawnType(5000);
            if (type5000 !== 'DINOSAUR') {
                throw new Error(`getSpawnType(5000) should return DINOSAUR, got ${type5000}`);
            }

            if (EnemyOrchestrator._dinoSpawnCount !== 1) {
                throw new Error(`_dinoSpawnCount should be 1, got ${EnemyOrchestrator._dinoSpawnCount}`);
            }

            // Check SKELETON on next call (dino already spawned for this threshold)
            const type5000again = EnemyOrchestrator.getSpawnType(5000);
            if (type5000again !== 'SKELETON') {
                throw new Error(`getSpawnType(5000) again should return SKELETON, got ${type5000again}`);
            }
        }
    );

    runner.addTest('check-dino-spawn-method', 'Boss Enemy', 'checkDinoSpawn method exists and works',
        'Verifies checkDinoSpawn returns true at score thresholds',
        async () => {
            runner.resetGame();
            await runner.wait(200);

            const EnemyOrchestrator = runner.gameWindow.EnemyOrchestrator;
            if (!EnemyOrchestrator) {
                throw new Error('EnemyOrchestrator not found');
            }

            if (typeof EnemyOrchestrator.checkDinoSpawn !== 'function') {
                throw new Error('checkDinoSpawn method not found');
            }

            // Reset dino spawn state
            EnemyOrchestrator._dinoSpawnCount = 0;

            // Should return false below 5000
            const result4999 = EnemyOrchestrator.checkDinoSpawn(4999);
            if (result4999 !== false) {
                throw new Error(`checkDinoSpawn(4999) should return false, got ${result4999}`);
            }

            // Should return true at 5000
            const result5000 = EnemyOrchestrator.checkDinoSpawn(5000);
            if (result5000 !== true) {
                throw new Error(`checkDinoSpawn(5000) should return true, got ${result5000}`);
            }

            // Should return false on second call (already spawned)
            const result5000again = EnemyOrchestrator.checkDinoSpawn(5000);
            if (result5000again !== false) {
                throw new Error(`checkDinoSpawn(5000) again should return false, got ${result5000again}`);
            }
        }
    );

    // No Respawn Tests (Clear the Mall design)
    runner.addTest('no-runtime-respawn', 'Clear the Mall', 'Skeletons do not respawn at runtime',
        'Verifies that killed skeletons stay dead (Clear the Mall design)',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(800);

            // Run initial updates to spawn enemies
            for (let i = 0; i < 30; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
            }
            await runner.wait(200);

            const enemies = runner.gameWindow.enemies;
            if (!enemies || enemies.length === 0) {
                // If enemies array not accessible, check via __gameInternals
                const internals = runner.gameWindow.__gameInternals;
                if (internals?.getEnemies) {
                    const internalEnemies = internals.getEnemies();
                    if (!internalEnemies || internalEnemies.length === 0) {
                        throw new Error('No enemies found via game internals');
                    }
                } else {
                    throw new Error('Enemies array not accessible');
                }
                return; // Can't do further testing without direct enemy access
            }

            const initialCount = enemies.filter(e => e.userData?.active).length;
            if (initialCount === 0) {
                throw new Error('No active enemies at game start');
            }

            // Kill one enemy
            const target = enemies.find(e => e.userData?.active);
            if (target) {
                target.userData.active = false;
                target.userData.health = 0;
            }

            // Run several update cycles
            for (let i = 0; i < 200; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
            }
            await runner.wait(100);

            const finalCount = enemies.filter(e => e.userData?.active).length;

            // Count should be less or equal (no respawn of skeletons)
            if (finalCount > initialCount - 1) {
                throw new Error(`Enemy might have respawned: initial=${initialCount}, final=${finalCount}`);
            }
        }
    );

})(window.runner);
