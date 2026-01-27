// ============================================
// TEST BRIDGE - Test Compatibility Layer
// ============================================
// Injected ONLY during UI tests (not loaded in production).
// Reads from window.__gameInternals and creates window properties for tests.
// Auto-initializes when loaded.

const TestBridge = {
    /**
     * Initialize test bridge - creates all window properties for test access
     * Reads local variable accessors from __gameInternals
     * Accesses global domain modules directly
     */
    init() {
        const gi = window.__gameInternals;
        if (!gi) {
            console.error('TestBridge: __gameInternals not found. Is this running in the game context?');
            return;
        }

        // ==========================================
        // GAME STATE PROPERTIES
        // ==========================================

        // gameState - delegates to StateOrchestrator
        Object.defineProperty(window, 'gameState', {
            get: () => StateOrchestrator ? StateOrchestrator.get() : 'MENU',
            set: (v) => { if (StateOrchestrator) StateOrchestrator.forceTransition(v); },
            configurable: true
        });

        // score
        Object.defineProperty(window, 'score', {
            get: () => gi.getScore(),
            set: (v) => {
                gi.setScore(v);
                if (typeof GameSession !== 'undefined') GameSession.setScore(v);
            },
            configurable: true
        });

        // gameTimer
        Object.defineProperty(window, 'gameTimer', {
            get: () => gi.getGameTimer(),
            set: (v) => {
                gi.setGameTimer(v);
                if (typeof GameSession !== 'undefined') GameSession.setTimer(v);
            },
            configurable: true
        });

        // distance - legacy compatibility (timer-based progress)
        Object.defineProperty(window, 'distance', {
            get: () => {
                if (typeof GameSession === 'undefined') return 0;
                const cartSpeed = typeof Player !== 'undefined' ? Player.movement.SPEED : 25;
                return GameSession.getDistanceEquivalent(cartSpeed);
            },
            set: () => { /* read-only */ },
            configurable: true
        });

        // ==========================================
        // PLAYER STATE PROPERTIES
        // ==========================================

        // playerX - offset from starting position (legacy)
        Object.defineProperty(window, 'playerX', {
            get: () => {
                const pos = gi.getPlayerPosition();
                const startX = typeof GameSession !== 'undefined' ? GameSession.getPlayerStartX() : 45;
                return pos.x - startX;
            },
            set: (v) => {
                const startX = typeof GameSession !== 'undefined' ? GameSession.getPlayerStartX() : 45;
                const pos = gi.getPlayerPosition();
                gi.setPlayerPosition({ x: v + startX, z: pos.z });
            },
            configurable: true
        });

        // playerPosition
        Object.defineProperty(window, 'playerPosition', {
            get: () => gi.getPlayerPosition(),
            set: (v) => gi.setPlayerPosition(v),
            configurable: true
        });

        // playerRotation
        Object.defineProperty(window, 'playerRotation', {
            get: () => gi.getPlayerRotation(),
            set: (v) => gi.setPlayerRotation(v),
            configurable: true
        });

        // playerHealth / health
        Object.defineProperty(window, 'playerHealth', {
            get: () => gi.getPlayerHealth(),
            set: (v) => gi.setPlayerHealth(v),
            configurable: true
        });

        Object.defineProperty(window, 'health', {
            get: () => gi.getPlayerHealth(),
            set: (v) => gi.setPlayerHealth(v),
            configurable: true
        });

        // ==========================================
        // WEAPON STATE PROPERTIES
        // ==========================================

        // slingshotTension
        Object.defineProperty(window, 'slingshotTension', {
            get: () => gi.getSlingshotTension(),
            set: (v) => gi.setSlingshotTension(v),
            configurable: true
        });

        // isChargingSlingshot / isFiring
        Object.defineProperty(window, 'isChargingSlingshot', {
            get: () => gi.getIsChargingSlingshot(),
            set: (v) => gi.setIsChargingSlingshot(v),
            configurable: true
        });

        Object.defineProperty(window, 'isFiring', {
            get: () => gi.getIsChargingSlingshot(),
            configurable: true
        });

        // lastShootTime
        Object.defineProperty(window, 'lastShootTime', {
            get: () => gi.getLastShootTime(),
            set: (v) => gi.setLastShootTime(v),
            configurable: true
        });

        // ==========================================
        // CAMERA & VIEW PROPERTIES
        // ==========================================

        // cameraMode
        Object.defineProperty(window, 'cameraMode', {
            get: () => gi.getCameraMode(),
            set: (v) => gi.setCameraMode(v),
            configurable: true
        });

        // camera
        Object.defineProperty(window, 'camera', {
            get: () => gi.camera,
            configurable: true
        });

        // wallBumpIntensity
        Object.defineProperty(window, 'wallBumpIntensity', {
            get: () => gi.getWallBumpIntensity(),
            set: (v) => gi.setWallBumpIntensity(v),
            configurable: true
        });

        // ==========================================
        // 3D OBJECT PROPERTIES
        // ==========================================

        Object.defineProperty(window, 'fpsWeapon', {
            get: () => gi.getFpsWeapon() || (typeof WeaponOrchestrator !== 'undefined' ? WeaponOrchestrator.fpsMesh : null),
            configurable: true
        });

        Object.defineProperty(window, 'playerChild', {
            get: () => gi.playerChild,
            configurable: true
        });

        Object.defineProperty(window, 'playerCart', {
            get: () => gi.playerCart,
            configurable: true
        });

        // Arrays - use getters to always return current references
        // (cleanup may reassign these arrays in the game loop)
        Object.defineProperty(window, 'projectiles', {
            get: () => gi.getProjectiles(),
            configurable: true
        });

        Object.defineProperty(window, 'enemies', {
            get: () => gi.getEnemies(),
            configurable: true
        });

        Object.defineProperty(window, 'obstacles', {
            get: () => gi.getObstacles(),
            configurable: true
        });

        // ==========================================
        // THREE.JS OBJECTS
        // ==========================================

        window.scene = gi.scene;
        window.renderer = gi.renderer;

        // ==========================================
        // INPUT SYSTEM
        // ==========================================

        window.keys = typeof InputOrchestrator !== 'undefined' ? InputOrchestrator.keys : {};

        // ==========================================
        // GAME FUNCTIONS
        // ==========================================

        window.startGame = gi.startGame;
        window.pauseGame = gi.pauseGame;
        window.resumeGame = gi.resumeGame;
        window.endGame = gi.endGame;
        window.resetGame = gi.resetGame;
        window.damagePlayer = gi.damagePlayer;
        window.takeDamage = gi.damagePlayer;  // Alias
        window.startCharging = gi.startCharging;
        window.releaseAndFire = gi.releaseAndFire;
        window.cancelCharging = gi.cancelCharging;
        window.startFiring = gi.startFiring;
        window.stopFiring = gi.stopFiring;
        window.manualUpdate = gi.manualUpdate;
        window.triggerWallBump = gi.triggerWallBump;
        window.updateAmmoDisplay = gi.updateAmmoDisplay;

        // ==========================================
        // DOMAIN MODULES (already global)
        // ==========================================

        // Engine domain
        if (typeof Engine !== 'undefined') window.Engine = Engine;
        if (typeof CollisionOrchestrator !== 'undefined') window.CollisionOrchestrator = CollisionOrchestrator;
        if (typeof InputOrchestrator !== 'undefined') window.InputOrchestrator = InputOrchestrator;
        if (typeof StateOrchestrator !== 'undefined') window.StateOrchestrator = StateOrchestrator;
        if (typeof LoopOrchestrator !== 'undefined') window.LoopOrchestrator = LoopOrchestrator;
        if (typeof SceneOrchestrator !== 'undefined') window.SceneOrchestrator = SceneOrchestrator;
        if (typeof EntityOrchestrator !== 'undefined') window.EntityOrchestrator = EntityOrchestrator;
        if (typeof GameSession !== 'undefined') window.GameSession = GameSession;

        // Weapon domain
        if (typeof Weapon !== 'undefined') window.Weapon = Weapon;
        if (typeof WeaponOrchestrator !== 'undefined') window.WeaponOrchestrator = WeaponOrchestrator;
        if (typeof Slingshot !== 'undefined') window.Slingshot = Slingshot;
        if (typeof WaterGun !== 'undefined') window.WaterGun = WaterGun;
        if (typeof NerfGun !== 'undefined') window.NerfGun = NerfGun;
        if (typeof WeaponPickup !== 'undefined') window.WeaponPickup = WeaponPickup;
        if (typeof PickupOrchestrator !== 'undefined') window.PickupOrchestrator = PickupOrchestrator;

        // Projectile domain
        if (typeof Projectile !== 'undefined') window.Projectile = Projectile;
        if (typeof ProjectileVisual !== 'undefined') window.ProjectileVisual = ProjectileVisual;
        if (typeof ProjectileOrchestrator !== 'undefined') window.ProjectileOrchestrator = ProjectileOrchestrator;

        // Enemy domain
        if (typeof Enemy !== 'undefined') window.Enemy = Enemy;
        if (typeof SkeletonMesh !== 'undefined') window.SkeletonMesh = SkeletonMesh;
        if (typeof DinosaurMesh !== 'undefined') window.DinosaurMesh = DinosaurMesh;
        if (typeof SkeletonAnimation !== 'undefined') window.SkeletonAnimation = SkeletonAnimation;
        if (typeof DinosaurAnimation !== 'undefined') window.DinosaurAnimation = DinosaurAnimation;
        if (typeof EnemyOrchestrator !== 'undefined') window.EnemyOrchestrator = EnemyOrchestrator;

        // Room domain
        if (typeof Room !== 'undefined') window.Room = Room;
        if (typeof RoomTheme !== 'undefined') window.RoomTheme = RoomTheme;
        if (typeof RoomMesh !== 'undefined') window.RoomMesh = RoomMesh;
        if (typeof RoomOrchestrator !== 'undefined') window.RoomOrchestrator = RoomOrchestrator;

        // Player domain
        if (typeof Player !== 'undefined') window.Player = Player;
        if (typeof PlayerTheme !== 'undefined') window.PlayerTheme = PlayerTheme;
        if (typeof PlayerMesh !== 'undefined') window.PlayerMesh = PlayerMesh;
        if (typeof PlayerOrchestrator !== 'undefined') window.PlayerOrchestrator = PlayerOrchestrator;

        // Environment domain
        if (typeof Obstacle !== 'undefined') window.Obstacle = Obstacle;
        if (typeof ObstacleVisual !== 'undefined') window.ObstacleVisual = ObstacleVisual;
        if (typeof Shelf !== 'undefined') window.Shelf = Shelf;
        if (typeof ShelfVisual !== 'undefined') window.ShelfVisual = ShelfVisual;
        if (typeof EnvironmentOrchestrator !== 'undefined') window.EnvironmentOrchestrator = EnvironmentOrchestrator;

        // UI domain
        if (typeof UIOrchestrator !== 'undefined') window.UIOrchestrator = UIOrchestrator;

        // Shared modules
        if (typeof MaterialsTheme !== 'undefined') window.MaterialsTheme = MaterialsTheme;

        console.log('TestBridge: Initialized successfully');
    },

    /**
     * Update array references (call when arrays change)
     */
    updateArrays() {
        const gi = window.__gameInternals;
        if (!gi) return;
        window.enemies = gi.getEnemies();
        window.obstacles = gi.getObstacles();
    }
};

// Auto-initialize when loaded
TestBridge.init();
