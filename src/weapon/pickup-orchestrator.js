// ============================================
// PICKUP SYSTEM - Spawn and Collection
// ============================================
// Manages weapon pickup spawning, animation, and collection

const PickupOrchestrator = {
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

        // All attempts failed, don't spawn (room too cluttered)
        return false;
    },

    /**
     * Spawn a specific pickup at position
     * @param {string} typeId - Pickup type ID
     * @param {Object} position - Spawn position {x, y, z}
     * @returns {Object} The spawned pickup instance
     */
    spawn(typeId, position) {
        if (!this.scene || !this.THREE) {
            console.warn('PickupOrchestrator not initialized');
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

        // Power-up pickups use power-up-specific mesh
        if (config.isPowerup) {
            mesh = this._createPowerUpMesh(instance, THREE);
        }
        // Health pickups use heart mesh
        else if (config.isHealth) {
            mesh = this._createHealthMesh(instance, THREE);
        }
        // Ammo pickups use generic ammo mesh
        else if (config.isAmmo || weaponId === null) {
            mesh = this._createAmmoMesh(instance, THREE);
        } else {
            // Weapon pickups use weapon-specific mesh
            let weaponModule = null;

            // Find the weapon module
            if (typeof WeaponOrchestrator !== 'undefined' && WeaponOrchestrator.weapons[weaponId]) {
                weaponModule = WeaponOrchestrator.weapons[weaponId];
            } else if (weaponId === 'watergun' && typeof WaterGun !== 'undefined') {
                weaponModule = WaterGun;
            } else if (weaponId === 'lasergun' && typeof LaserGun !== 'undefined') {
                weaponModule = LaserGun;
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
     * Create ammo pickup mesh - distinctive crate design
     * @private
     */
    _createAmmoMesh(instance, THREE) {
        const pickup = new THREE.Group();

        // Purple ammo crate (distinct from water gun blue)
        const crateColor = 0x5e60ce;  // Deep purple
        const stripeColor = 0xa29bfe; // Lavender stripe

        // Main crate body
        const crateMat = new THREE.MeshStandardMaterial({
            color: crateColor,
            roughness: 0.7,
            metalness: 0.2,
            emissive: crateColor,
            emissiveIntensity: 0.2
        });

        const crateGeo = new THREE.BoxGeometry(0.8, 0.5, 0.6);
        const crate = new THREE.Mesh(crateGeo, crateMat);
        pickup.add(crate);

        // Yellow warning stripes (X pattern on top)
        const stripeMat = new THREE.MeshBasicMaterial({ color: stripeColor });

        // Stripe 1
        const stripe1Geo = new THREE.BoxGeometry(0.7, 0.02, 0.08);
        const stripe1 = new THREE.Mesh(stripe1Geo, stripeMat);
        stripe1.position.set(0, 0.26, 0);
        stripe1.rotation.y = Math.PI / 4;
        pickup.add(stripe1);

        // Stripe 2
        const stripe2 = new THREE.Mesh(stripe1Geo, stripeMat);
        stripe2.position.set(0, 0.26, 0);
        stripe2.rotation.y = -Math.PI / 4;
        pickup.add(stripe2);

        // Metal corner reinforcements
        const cornerMat = new THREE.MeshStandardMaterial({
            color: 0x7f8c8d,
            metalness: 0.8,
            roughness: 0.3
        });
        const cornerGeo = new THREE.BoxGeometry(0.12, 0.52, 0.12);
        const corners = [
            [-0.35, 0, -0.25],
            [0.35, 0, -0.25],
            [-0.35, 0, 0.25],
            [0.35, 0, 0.25]
        ];
        corners.forEach(pos => {
            const corner = new THREE.Mesh(cornerGeo, cornerMat);
            corner.position.set(pos[0], pos[1], pos[2]);
            pickup.add(corner);
        });

        return pickup;
    },

    /**
     * Create power-up pickup mesh - energy drink can
     * @private
     */
    _createPowerUpMesh(instance, THREE) {
        const pickup = new THREE.Group();
        const config = instance.config;

        // Energy drink can design
        if (config.id === 'speed_boost') {
            const canColor = config.visual.color || 0xff3333;
            const glowColor = config.visual.glowColor || 0xffaa00;
            const baseColor = new THREE.Color(canColor);
            const panelColor = baseColor.clone().offsetHSL(0, 0, 0.12);
            const stripeColor = baseColor.clone().offsetHSL(0.02, 0.12, 0.18);
            const rimColor = baseColor.clone().offsetHSL(0, 0, -0.18);

            const canHeight = 0.9;
            const canRadius = 0.3;
            const halfHeight = canHeight / 2;

            // Main can body (cylinder)
            const canMat = new THREE.MeshStandardMaterial({
                color: baseColor,
                roughness: 0.25,
                metalness: 0.65,
                emissive: baseColor,
                emissiveIntensity: 0.3
            });
            const canGeo = new THREE.CylinderGeometry(canRadius, canRadius, canHeight, 20);
            const can = new THREE.Mesh(canGeo, canMat);
            pickup.add(can);

            // Rim rings (subtle bevel feel)
            const rimMat = new THREE.MeshStandardMaterial({
                color: rimColor,
                roughness: 0.35,
                metalness: 0.7
            });
            const rimGeo = new THREE.CylinderGeometry(canRadius * 1.03, canRadius * 1.03, 0.04, 20);
            const rimTop = new THREE.Mesh(rimGeo, rimMat);
            rimTop.position.y = halfHeight - 0.02;
            pickup.add(rimTop);

            const rimBottom = new THREE.Mesh(rimGeo, rimMat);
            rimBottom.position.y = -halfHeight + 0.02;
            pickup.add(rimBottom);

            // Vertical paneling for texture
            const panelMat = new THREE.MeshStandardMaterial({
                color: panelColor,
                roughness: 0.35,
                metalness: 0.55
            });
            const panelGeo = new THREE.BoxGeometry(0.035, 0.7, 0.03);
            const panelCount = 6;
            const panelRadius = canRadius * 1.02;
            for (let i = 0; i < panelCount; i++) {
                const angle = (i / panelCount) * Math.PI * 2;
                const panel = new THREE.Mesh(panelGeo, panelMat);
                panel.position.set(
                    Math.cos(angle) * panelRadius,
                    0,
                    Math.sin(angle) * panelRadius
                );
                panel.rotation.y = angle;
                pickup.add(panel);
            }

            // Layered stripe accents
            const stripeMat = new THREE.MeshStandardMaterial({
                color: stripeColor,
                roughness: 0.2,
                metalness: 0.5
            });
            const stripeGeo = new THREE.CylinderGeometry(canRadius * 1.04, canRadius * 1.04, 0.08, 20);
            const stripeTop = new THREE.Mesh(stripeGeo, stripeMat);
            stripeTop.position.y = 0.12;
            pickup.add(stripeTop);

            const stripeBottom = new THREE.Mesh(stripeGeo, stripeMat);
            stripeBottom.position.y = -0.12;
            pickup.add(stripeBottom);

            // Glow band (subtle emissive)
            const glowBandMat = new THREE.MeshBasicMaterial({
                color: glowColor,
                transparent: true,
                opacity: 0.45
            });
            const glowBandGeo = new THREE.CylinderGeometry(canRadius * 1.03, canRadius * 1.03, 0.12, 20);
            const glowBand = new THREE.Mesh(glowBandGeo, glowBandMat);
            glowBand.position.y = 0;
            pickup.add(glowBand);

            // Halo ring
            const haloMat = new THREE.MeshBasicMaterial({
                color: glowColor,
                transparent: true,
                opacity: 0.4
            });
            const haloGeo = new THREE.TorusGeometry(canRadius * 0.9, 0.02, 10, 24);
            const halo = new THREE.Mesh(haloGeo, haloMat);
            halo.rotation.x = Math.PI / 2;
            pickup.add(halo);

            // Logo plate
            const logoMat = new THREE.MeshStandardMaterial({
                color: 0xffe0b2,
                roughness: 0.35,
                metalness: 0.6
            });
            const logoGeo = new THREE.BoxGeometry(0.18, 0.12, 0.02);
            const logo = new THREE.Mesh(logoGeo, logoMat);
            logo.position.set(0, 0.05, canRadius + 0.03);
            pickup.add(logo);

            // Top lid (metallic silver)
            const lidMat = new THREE.MeshStandardMaterial({
                color: 0xcccccc,
                roughness: 0.2,
                metalness: 0.9
            });
            const lidGeo = new THREE.CylinderGeometry(canRadius * 1.03, canRadius * 1.03, 0.04, 20);
            const lid = new THREE.Mesh(lidGeo, lidMat);
            lid.position.y = halfHeight + 0.03;
            pickup.add(lid);

            // Pull tab (small detail)
            const tabGeo = new THREE.BoxGeometry(0.12, 0.02, 0.06);
            const tab = new THREE.Mesh(tabGeo, lidMat);
            tab.position.set(0, halfHeight + 0.045, 0.08);
            pickup.add(tab);
        } else {
            // Fallback: generic power-up mesh
            const mesh = this._createGenericMesh(instance, THREE);
            return mesh;
        }

        return pickup;
    },

    /**
     * Create health pickup mesh - stylized heart
     * @private
     */
    _createHealthMesh(instance, THREE) {
        const pickup = new THREE.Group();
        const config = instance.config || {};
        const baseColor = new THREE.Color(config.visual?.color || 0xe74c3c);
        const glowColor = config.visual?.glowColor || 0xff6b6b;

        // Heart body material
        const heartMat = new THREE.MeshStandardMaterial({
            color: baseColor,
            roughness: 0.35,
            metalness: 0.2,
            emissive: baseColor,
            emissiveIntensity: 0.3
        });

        // Heart silhouette using a shape (more recognizable than spheres)
        const shape = new THREE.Shape();
        shape.moveTo(0, 0.2);
        shape.bezierCurveTo(0, 0.5, -0.5, 0.55, -0.5, 0.15);
        shape.bezierCurveTo(-0.5, -0.25, -0.1, -0.45, 0, -0.6);
        shape.bezierCurveTo(0.1, -0.45, 0.5, -0.25, 0.5, 0.15);
        shape.bezierCurveTo(0.5, 0.55, 0, 0.5, 0, 0.2);

        const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
            depth: 0.18,
            bevelEnabled: true,
            bevelThickness: 0.04,
            bevelSize: 0.04,
            bevelSegments: 2
        });
        extrudeGeo.center();

        const heart = new THREE.Mesh(extrudeGeo, heartMat);
        pickup.add(heart);

        // Subtle glow shell
        const glowMat = new THREE.MeshBasicMaterial({
            color: glowColor,
            transparent: true,
            opacity: 0.6
        });
        const glowGeo = new THREE.SphereGeometry(0.55, 16, 16);
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(0, 0.05, 0);
        pickup.add(glow);

        // Halo ring for collectible feel
        const haloMat = new THREE.MeshBasicMaterial({
            color: glowColor,
            transparent: true,
            opacity: 0.25
        });
        const haloGeo = new THREE.TorusGeometry(0.55, 0.03, 12, 24);
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.rotation.x = Math.PI / 2;
        halo.position.set(0, -0.05, 0);
        pickup.add(halo);

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

            let bobSpeed = WeaponPickup.spawn.bobSpeed;
            let bobAmplitude = WeaponPickup.spawn.bobAmplitude;
            let rotationSpeed = WeaponPickup.spawn.rotationSpeed;

            if (pickup.config && pickup.config.id === 'speed_boost') {
                bobSpeed = Math.PI; // ~0.5 Hz
                bobAmplitude = 0.06;
                rotationSpeed = 0.5;
            }

            // Animate: bob up and down
            const bobOffset = pickup.bobOffset + time * 0.001 * bobSpeed;
            const bobY = WeaponPickup.spawn.heightOffset + Math.sin(bobOffset) * bobAmplitude;

            // Animate: rotation
            pickup.rotation += dt * rotationSpeed;

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
     * @param {Object} weaponOrchestrator - WeaponOrchestrator reference
     * @param {Object} THREE - THREE.js library
     * @param {Object} materials - Materials for mesh creation
     * @param {Object} camera - Camera for FPS mesh attachment
     * @returns {Object} Result {switched, ammoAdded, weaponId, isAmmo}
     */
    collect(pickup, weaponOrchestrator, THREE, materials, camera) {
        if (!pickup || !weaponOrchestrator) return null;

        const config = pickup.config;
        const weaponId = config.weaponId;
        const currentWeaponId = weaponOrchestrator.getCurrentId();
        const getActualAmmoAdded = (grant) => {
            const before = weaponOrchestrator.getAmmo();
            weaponOrchestrator.addAmmo(grant);
            const after = weaponOrchestrator.getAmmo();
            return Math.max(0, after - before);
        };

        // Power-up pickup - activate effect
        if (config.isPowerup) {
            if (typeof PowerUpOrchestrator !== 'undefined') {
                PowerUpOrchestrator.activate(config.id, Date.now());
            }
            return {
                switched: false,
                ammoAdded: 0,
                weaponId: currentWeaponId,
                isPowerup: true,
                powerupType: config.id
            };
        }

        // Health pickup - heal player
        if (config.isHealth) {
            if (typeof PlayerOrchestrator !== 'undefined') {
                PlayerOrchestrator.heal(config.healAmount || 0);
                if (typeof UIOrchestrator !== 'undefined') {
                    UIOrchestrator.updateHealthBar(
                        PlayerOrchestrator.getHealth(),
                        PlayerOrchestrator.getMaxHealth()
                    );
                }
            }
            return {
                switched: false,
                ammoAdded: 0,
                weaponId: currentWeaponId,
                isHealth: true,
                healAmount: config.healAmount || 0
            };
        }

        // Ammo pickup - always adds ammo to current weapon
        if (config.isAmmo || weaponId === null) {
            const ammoAdded = getActualAmmoAdded(config.ammoGrant);
            return {
                switched: false,
                ammoAdded: ammoAdded,
                weaponId: currentWeaponId,
                isAmmo: true
            };
        }

        // Weapon pickup - same weapon adds ammo
        if (currentWeaponId === weaponId) {
            const ammoAdded = getActualAmmoAdded(config.ammoGrant);
            return {
                switched: false,
                ammoAdded: ammoAdded,
                weaponId: weaponId,
                isAmmo: false
            };
        }

        // Weapon pickup - different weapon switches
        weaponOrchestrator.equip(weaponId, THREE, materials, camera);
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
