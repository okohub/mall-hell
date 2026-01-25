// ============================================
// PICKUP SYSTEM - Spawn and Collection
// ============================================
// Manages weapon pickup spawning, animation, and collection

const PickupSystem = {
    // ==========================================
    // STATE
    // ==========================================

    pickups: [],        // Active pickup instances
    meshes: [],         // THREE.js meshes for pickups
    scene: null,        // Scene reference
    THREE: null,        // THREE.js reference

    // ==========================================
    // INITIALIZATION
    // ==========================================

    /**
     * Initialize the pickup system
     * @param {Object} scene - THREE.js scene
     * @param {Object} THREE - THREE.js library
     */
    init(scene, THREE) {
        this.scene = scene;
        this.THREE = THREE;
        this.pickups = [];
        this.meshes = [];
    },

    /**
     * Reset the system (on game restart)
     */
    reset() {
        // Remove all pickup meshes from scene
        this.meshes.forEach(mesh => {
            if (this.scene && mesh.parent) {
                this.scene.remove(mesh);
            }
        });
        this.pickups = [];
        this.meshes = [];
    },

    // ==========================================
    // SPAWNING
    // ==========================================

    /**
     * Try to spawn a pickup for a room
     * @param {Object} roomPosition - Room center position {x, z}
     * @param {number} roomWidth - Room width
     * @param {number} roomLength - Room length
     * @param {Array} obstacles - Optional array of obstacles to avoid
     * @param {Array} shelves - Optional array of shelves to avoid
     * @returns {boolean} Whether a pickup was spawned
     */
    trySpawnForRoom(roomPosition, roomWidth, roomLength, obstacles = [], shelves = []) {
        // Check spawn chance
        if (Math.random() > WeaponPickup.spawn.chancePerRoom) {
            return false;
        }

        // Check max per room
        const existingInRoom = this.pickups.filter(p => {
            const dx = Math.abs(p.position.x - roomPosition.x);
            const dz = Math.abs(p.position.z - roomPosition.z);
            return dx < roomWidth / 2 && dz < roomLength / 2;
        });

        if (existingInRoom.length >= WeaponPickup.spawn.maxPerRoom) {
            return false;
        }

        // Select random pickup type
        const pickupType = WeaponPickup.selectRandom();

        // Try multiple positions to find a clear spot
        const maxAttempts = 5;
        const pickupRadius = 1.2; // Collision radius for pickup placement

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Random position within room center (avoid edges where shelves are)
            const spawnX = roomPosition.x + (Math.random() - 0.5) * (roomWidth * 0.4);
            const spawnZ = roomPosition.z + (Math.random() - 0.5) * (roomLength * 0.3);
            const spawnY = WeaponPickup.spawn.heightOffset;

            // Check collision with obstacles
            let collides = false;

            for (const obs of obstacles) {
                if (!obs.userData?.active) continue;
                const dx = spawnX - obs.position.x;
                const dz = spawnZ - obs.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                const obsRadius = obs.userData?.collisionRadius || 1.5;
                if (dist < pickupRadius + obsRadius) {
                    collides = true;
                    break;
                }
            }

            // Check collision with shelves (rectangular bounds)
            if (!collides) {
                for (const shelf of shelves) {
                    const shelfWidth = shelf.userData?.width || 8;
                    const shelfDepth = shelf.userData?.depth || 2;
                    const halfW = shelfWidth / 2 + pickupRadius;
                    const halfD = shelfDepth / 2 + pickupRadius;

                    if (Math.abs(spawnX - shelf.position.x) < halfW &&
                        Math.abs(spawnZ - shelf.position.z) < halfD) {
                        collides = true;
                        break;
                    }
                }
            }

            if (!collides) {
                this.spawn(pickupType.id, { x: spawnX, y: spawnY, z: spawnZ });
                return true;
            }
        }

        // All attempts failed, spawn anyway at room center
        const spawnX = roomPosition.x;
        const spawnZ = roomPosition.z;
        const spawnY = WeaponPickup.spawn.heightOffset;
        this.spawn(pickupType.id, { x: spawnX, y: spawnY, z: spawnZ });
        return true;
    },

    /**
     * Spawn a specific pickup at position
     * @param {string} typeId - Pickup type ID
     * @param {Object} position - Spawn position {x, y, z}
     * @returns {Object} The spawned pickup instance
     */
    spawn(typeId, position) {
        if (!this.scene || !this.THREE) {
            console.warn('PickupSystem not initialized');
            return null;
        }

        // Create pickup instance
        const instance = WeaponPickup.createInstance(typeId, position);
        if (!instance) return null;

        // Create mesh based on weapon type
        const mesh = this._createMesh(instance);
        if (!mesh) return null;

        // Position mesh
        mesh.position.set(position.x, position.y, position.z);
        mesh.userData.pickupInstance = instance;
        mesh.userData.pickupIndex = this.pickups.length;

        // Add to scene
        this.scene.add(mesh);

        // Store
        this.pickups.push(instance);
        this.meshes.push(mesh);

        return instance;
    },

    /**
     * Create mesh for pickup
     * @private
     */
    _createMesh(instance) {
        const THREE = this.THREE;
        if (!THREE) return null;

        const config = instance.config;
        const weaponId = config.weaponId;
        let mesh;

        // Ammo pickups use generic ammo mesh
        if (config.isAmmo || weaponId === null) {
            mesh = this._createAmmoMesh(instance, THREE);
        } else {
            // Weapon pickups use weapon-specific mesh
            let weaponModule = null;

            // Find the weapon module
            if (typeof WeaponManager !== 'undefined' && WeaponManager.weapons[weaponId]) {
                weaponModule = WeaponManager.weapons[weaponId];
            } else if (weaponId === 'watergun' && typeof WaterGun !== 'undefined') {
                weaponModule = WaterGun;
            } else if (weaponId === 'nerfgun' && typeof NerfGun !== 'undefined') {
                weaponModule = NerfGun;
            } else if (weaponId === 'slingshot' && typeof Slingshot !== 'undefined') {
                weaponModule = Slingshot;
            }

            if (weaponModule && weaponModule.createPickupMesh) {
                mesh = weaponModule.createPickupMesh(THREE);
            } else {
                // Fallback: generic pickup mesh
                mesh = this._createGenericMesh(instance, THREE);
            }
        }

        // Add outer glow sphere for visibility
        this._addGlowEffect(mesh, instance, THREE);

        // Scale
        const scale = config.visual.scale || 1.5;
        mesh.scale.set(scale, scale, scale);

        return mesh;
    },

    /**
     * Create ammo pickup mesh (simplified for performance)
     * @private
     */
    _createAmmoMesh(instance, THREE) {
        const pickup = new THREE.Group();

        const color = instance.config.visual.color || 0xf1c40f;

        // Simple glowing ammo box - single material for performance
        const boxMat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.4,
            emissive: color,
            emissiveIntensity: 0.6
        });

        // Main ammo box
        const boxGeo = new THREE.BoxGeometry(0.6, 0.4, 0.5);
        const box = new THREE.Mesh(boxGeo, boxMat);
        pickup.add(box);

        return pickup;
    },

    /**
     * Add glow effect to pickup (no PointLight for performance)
     * @private
     */
    _addGlowEffect(mesh, instance, THREE) {
        const glowColor = instance.config.visual.glowColor || instance.config.visual.color || 0x00ff00;

        // Outer glow sphere only - NO PointLight (causes lag)
        const glowMat = new THREE.MeshBasicMaterial({
            color: glowColor,
            transparent: true,
            opacity: 0.4,
            side: THREE.BackSide
        });
        const glowGeo = new THREE.SphereGeometry(1.0, 8, 8);  // Larger glow, fewer segments
        const glow = new THREE.Mesh(glowGeo, glowMat);
        mesh.add(glow);
    },

    /**
     * Create generic pickup mesh (fallback)
     * @private
     */
    _createGenericMesh(instance, THREE) {
        const pickup = new THREE.Group();

        const color = instance.config.visual.color || 0x00ff00;
        const glowColor = instance.config.visual.glowColor || color;

        // Box shape
        const boxMat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.4,
            metalness: 0.2,
            emissive: color,
            emissiveIntensity: 0.3
        });
        const boxGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const box = new THREE.Mesh(boxGeo, boxMat);
        pickup.add(box);

        // Glow sphere
        const glowMat = new THREE.MeshBasicMaterial({
            color: glowColor,
            transparent: true,
            opacity: 0.25
        });
        const glowGeo = new THREE.SphereGeometry(0.6, 16, 16);
        const glow = new THREE.Mesh(glowGeo, glowMat);
        pickup.add(glow);

        return pickup;
    },

    // ==========================================
    // UPDATE
    // ==========================================

    /**
     * Update pickups (animation and collection check)
     * @param {number} dt - Delta time in seconds
     * @param {Object} playerPosition - Player position {x, y, z}
     * @param {number} time - Current timestamp
     * @returns {Array} Array of collected pickups
     */
    update(dt, playerPosition, time) {
        const collected = [];
        const collectionRadius = WeaponPickup.collection.radius;
        const magnetRadius = WeaponPickup.collection.magnetRadius;
        const magnetSpeed = WeaponPickup.collection.magnetSpeed;

        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            const mesh = this.meshes[i];

            if (!pickup.active || pickup.collected) continue;

            // Calculate distance to player
            const dx = playerPosition.x - pickup.position.x;
            const dz = playerPosition.z - pickup.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // Check collection
            if (distance < collectionRadius) {
                pickup.collected = true;
                pickup.active = false;
                collected.push(pickup);

                // Remove from scene
                if (mesh.parent) {
                    this.scene.remove(mesh);
                }

                // Remove from arrays
                this.pickups.splice(i, 1);
                this.meshes.splice(i, 1);
                continue;
            }

            // Magnet effect (attract toward player when close)
            if (distance < magnetRadius && distance > collectionRadius) {
                const attractSpeed = magnetSpeed * dt;
                const nx = dx / distance;
                const nz = dz / distance;
                pickup.position.x += nx * attractSpeed;
                pickup.position.z += nz * attractSpeed;
            }

            // Animate: bob up and down
            const bobOffset = pickup.bobOffset + time * 0.001 * WeaponPickup.spawn.bobSpeed;
            const bobY = WeaponPickup.spawn.heightOffset + Math.sin(bobOffset) * WeaponPickup.spawn.bobAmplitude;

            // Animate: rotation
            pickup.rotation += dt * WeaponPickup.spawn.rotationSpeed;

            // Update mesh
            if (mesh) {
                mesh.position.set(pickup.position.x, bobY, pickup.position.z);
                mesh.rotation.y = pickup.rotation;
            }
        }

        return collected;
    },

    /**
     * Handle pickup collection
     * @param {Object} pickup - The collected pickup instance
     * @param {Object} weaponManager - WeaponManager reference
     * @param {Object} THREE - THREE.js library
     * @param {Object} materials - Materials for mesh creation
     * @param {Object} camera - Camera for FPS mesh attachment
     * @returns {Object} Result {switched, ammoAdded, weaponId, isAmmo}
     */
    collect(pickup, weaponManager, THREE, materials, camera) {
        if (!pickup || !weaponManager) return null;

        const config = pickup.config;
        const weaponId = config.weaponId;
        const currentWeaponId = weaponManager.getCurrentId();

        // Ammo pickup - always adds ammo to current weapon
        if (config.isAmmo || weaponId === null) {
            weaponManager.addAmmo(config.ammoGrant);
            return {
                switched: false,
                ammoAdded: config.ammoGrant,
                weaponId: currentWeaponId,
                isAmmo: true
            };
        }

        // Weapon pickup - same weapon adds ammo
        if (currentWeaponId === weaponId) {
            weaponManager.addAmmo(config.ammoGrant);
            return {
                switched: false,
                ammoAdded: config.ammoGrant,
                weaponId: weaponId,
                isAmmo: false
            };
        }

        // Weapon pickup - different weapon switches
        weaponManager.equip(weaponId, THREE, materials, camera);
        return {
            switched: true,
            ammoAdded: 0,
            weaponId: weaponId,
            isAmmo: false
        };
    },

    // ==========================================
    // CLEANUP
    // ==========================================

    /**
     * Remove pickups that are behind the player
     * @param {number} playerZ - Player's Z position
     * @param {number} threshold - Distance behind to remove
     */
    cleanupBehind(playerZ, threshold = 30) {
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            const mesh = this.meshes[i];

            // Remove if too far behind
            if (pickup.position.z > playerZ + threshold) {
                pickup.active = false;

                if (mesh.parent) {
                    this.scene.remove(mesh);
                }

                this.pickups.splice(i, 1);
                this.meshes.splice(i, 1);
            }
        }
    },

    // ==========================================
    // QUERIES
    // ==========================================

    /**
     * Get active pickup count
     */
    getCount() {
        return this.pickups.filter(p => p.active).length;
    },

    /**
     * Get all active pickups
     */
    getAll() {
        return this.pickups.filter(p => p.active);
    }
};
