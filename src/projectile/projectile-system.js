// ============================================
// PROJECTILE SYSTEM - Orchestrator
// ============================================
// Manages projectile spawning, movement, and collision
// Uses Projectile data definitions (assumes Projectile is loaded globally)

const ProjectileSystem = {
    // Active projectiles
    projectiles: [],

    // Configuration (use Projectile.system if available)
    get maxProjectiles() {
        return (typeof Projectile !== 'undefined' && Projectile.system)
            ? Projectile.system.MAX_PROJECTILES : 50;
    },
    get despawnDistance() {
        return (typeof Projectile !== 'undefined' && Projectile.system)
            ? Projectile.system.DESPAWN_DISTANCE : 200;
    },
    get boundsX() {
        return (typeof Projectile !== 'undefined' && Projectile.system)
            ? Projectile.system.BOUNDS_X : 50;
    },
    get boundsYMin() {
        return (typeof Projectile !== 'undefined' && Projectile.system)
            ? Projectile.system.BOUNDS_Y_MIN : -5;
    },
    get boundsYMax() {
        return (typeof Projectile !== 'undefined' && Projectile.system)
            ? Projectile.system.BOUNDS_Y_MAX : 20;
    },
    get defaultLifetime() {
        return (typeof Projectile !== 'undefined' && Projectile.system)
            ? Projectile.system.DEFAULT_LIFETIME : 5000;
    },
    get spawnForwardOffset() {
        return (typeof Projectile !== 'undefined' && Projectile.system)
            ? Projectile.system.SPAWN_FORWARD_OFFSET : 0.5;
    },
    get spawnDownOffset() {
        return (typeof Projectile !== 'undefined' && Projectile.system)
            ? Projectile.system.SPAWN_DOWN_OFFSET : 0.3;
    },
    get farPointDistance() {
        return (typeof Projectile !== 'undefined' && Projectile.system)
            ? Projectile.system.FAR_POINT_DISTANCE : 100;
    },
    get updateMaxDistance() {
        return (typeof Projectile !== 'undefined' && Projectile.system)
            ? Projectile.system.UPDATE_MAX_DISTANCE : 150;
    },
    get updateMinY() {
        return (typeof Projectile !== 'undefined' && Projectile.system)
            ? Projectile.system.UPDATE_MIN_Y : 0;
    },
    get updateMaxY() {
        return (typeof Projectile !== 'undefined' && Projectile.system)
            ? Projectile.system.UPDATE_MAX_Y : 15;
    },

    // Visual config
    get sizeScaleBase() {
        return (typeof Projectile !== 'undefined' && Projectile.visual)
            ? Projectile.visual.SIZE_SCALE_BASE : 0.8;
    },
    get sizeScalePower() {
        return (typeof Projectile !== 'undefined' && Projectile.visual)
            ? Projectile.visual.SIZE_SCALE_POWER : 0.4;
    },
    get glowOpacityBase() {
        return (typeof Projectile !== 'undefined' && Projectile.visual)
            ? Projectile.visual.GLOW_OPACITY_BASE : 0.2;
    },
    get glowOpacityPower() {
        return (typeof Projectile !== 'undefined' && Projectile.visual)
            ? Projectile.visual.GLOW_OPACITY_POWER : 0.3;
    },

    // References
    projectileData: null,
    scene: null,

    /**
     * Initialize the projectile system
     * @param {Object} projectileData - Reference to Projectile data object
     * @param {THREE.Scene} scene - Three.js scene for adding projectiles
     */
    init(projectileData, scene) {
        this.projectileData = projectileData || (typeof Projectile !== 'undefined' ? Projectile : null);
        this.scene = scene;
        this.reset();
    },

    /**
     * Reset all projectiles
     */
    reset() {
        // Remove all projectiles from scene
        this.projectiles.forEach(p => {
            if (p.mesh && this.scene) {
                this.scene.remove(p.mesh);
            }
        });
        this.projectiles = [];
    },

    /**
     * Spawn a new projectile
     * @param {string} typeId - Projectile type ID
     * @param {Object} position - Spawn position {x, y, z}
     * @param {Object} direction - Direction vector {x, y, z}
     * @param {number} speed - Projectile speed
     * @param {number} damage - Damage amount
     * @param {number} power - Fire power (affects visuals)
     * @param {THREE} THREE - Three.js library
     * @returns {Object} Spawned projectile data
     */
    spawn(typeId, position, direction, speed, damage, power, THREE) {
        if (this.projectiles.length >= this.maxProjectiles) {
            // Remove oldest projectile
            this.despawn(this.projectiles[0]);
        }

        const config = this.projectileData ? this.projectileData.get(typeId) : null;
        if (!config) return null;

        // Create visual
        let mesh = null;
        if (THREE && typeof ProjectileVisual !== 'undefined') {
            mesh = ProjectileVisual.createProjectileGroup(THREE, config, power);
            mesh.position.set(position.x, position.y, position.z);
            if (this.scene) {
                this.scene.add(mesh);
            }
        }

        const projectile = {
            type: typeId,
            config: config,
            mesh: mesh,
            position: { x: position.x, y: position.y, z: position.z },
            direction: { x: direction.x, y: direction.y, z: direction.z },
            speed: speed,
            damage: damage,
            power: power,
            createdAt: Date.now(),
            active: true
        };

        this.projectiles.push(projectile);
        return projectile;
    },

    /**
     * Despawn a projectile
     * @param {Object} projectile - Projectile to remove
     */
    despawn(projectile) {
        if (!projectile) return;

        projectile.active = false;

        if (projectile.mesh && this.scene) {
            this.scene.remove(projectile.mesh);
        }

        const index = this.projectiles.indexOf(projectile);
        if (index > -1) {
            this.projectiles.splice(index, 1);
        }
    },

    /**
     * Update all projectiles (call each frame)
     * @param {number} dt - Delta time in seconds
     * @param {Object} cameraPosition - Camera position for despawn check
     * @returns {Array} List of projectiles that moved (for collision checking)
     */
    update(dt, cameraPosition) {
        const moved = [];

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            if (!p.active) continue;

            // Move projectile
            p.position.x += p.direction.x * p.speed * dt;
            p.position.y += p.direction.y * p.speed * dt;
            p.position.z += p.direction.z * p.speed * dt;

            // Apply gravity if configured
            if (p.config.gravity) {
                p.direction.y -= p.config.gravity * dt;
            }

            // Update mesh position
            if (p.mesh) {
                p.mesh.position.set(p.position.x, p.position.y, p.position.z);
            }

            // Check despawn conditions
            const distFromCamera = cameraPosition
                ? Math.abs(p.position.z - cameraPosition.z)
                : 0;

            const age = Date.now() - p.createdAt;
            const outOfBounds = Math.abs(p.position.x) > this.boundsX ||
                               p.position.y < this.boundsYMin ||
                               p.position.y > this.boundsYMax ||
                               distFromCamera > this.despawnDistance;

            if (outOfBounds || age > (p.config.lifetime || this.defaultLifetime)) {
                this.despawn(p);
            } else {
                moved.push(p);
            }
        }

        return moved;
    },

    /**
     * Check collision between projectile and a target
     * @param {Object} projectile - Projectile to check
     * @param {THREE.Object3D} target - Target object with position
     * @param {number} radius - Collision radius
     * @returns {boolean} True if collision detected
     */
    checkCollision(projectile, target, radius) {
        if (!projectile || !projectile.active || !target) return false;

        const dx = projectile.position.x - target.position.x;
        const dy = projectile.position.y - target.position.y;
        const dz = projectile.position.z - target.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        return dist < radius;
    },

    /**
     * Handle projectile hitting something
     * @param {Object} projectile - Projectile that hit
     * @param {Object} hitInfo - Info about what was hit
     */
    onHit(projectile, hitInfo) {
        if (!projectile || !projectile.active) return;

        // If not piercing, despawn
        if (!projectile.config.piercing) {
            this.despawn(projectile);
        }

        // Could trigger particle effects here
        // ProjectileVisual.createImpact(...)
    },

    /**
     * Get all active projectiles
     */
    getActive() {
        return this.projectiles.filter(p => p.active);
    },

    /**
     * Get projectile count
     */
    getCount() {
        return this.projectiles.length;
    },

    /**
     * Create projectile mesh group (for external array management in index.html)
     * @param {THREE} THREE - Three.js library
     * @param {Object} direction - Direction vector (THREE.Vector3)
     * @param {Object} spawnPos - Spawn position (THREE.Vector3)
     * @param {number} speed - Projectile speed
     * @param {Object} options - Additional options
     * @param {number} options.speedMin - Min speed for power calculation
     * @param {number} options.speedMax - Max speed for power calculation
     * @param {Object} options.fallbackCamera - Camera for fallback position
     * @returns {THREE.Group} Projectile mesh group with userData
     */
    createMesh(THREE, direction, spawnPos, speed, options = {}) {
        const {
            speedMin = 60,
            speedMax = 180,
            fallbackCamera = null,
            projectileType = 'stone'
        } = options;

        const group = new THREE.Group();

        // Get projectile config from Projectile data definitions
        const projConfig = (typeof Projectile !== 'undefined' && Projectile.get)
            ? Projectile.get(projectileType)
            : { size: 0.2, color: 0xf39c12, glow: true, geometry: 'sphere' };

        const baseSize = projConfig.size || 0.2;
        const baseColor = projConfig.color || 0xf39c12;
        const hasGlow = projConfig.glow !== false;
        const emissiveMin = projConfig.emissiveIntensity?.min || 0.2;
        const emissiveMax = projConfig.emissiveIntensity?.max || 0.6;
        const geometry = projConfig.geometry || 'sphere';

        // Size scales slightly with power
        const sizeScale = this.sizeScaleBase + (speed / speedMax) * this.sizeScalePower;

        // Create geometry based on type
        let geo;
        const isLaser = projectileType === 'laser';
        const isDart = projectileType === 'dart';

        if (isLaser && projConfig.length) {
            // Laser beam: thin, uniform width, very elongated
            const laserRadius = baseSize * sizeScale * 0.4;
            const laserLength = projConfig.length * sizeScale * 1.5;
            geo = new THREE.CylinderGeometry(laserRadius, laserRadius, laserLength, 8);
        } else if (isDart && projConfig.length) {
            // Dart-style: tapered elongated projectile
            geo = new THREE.CylinderGeometry(baseSize * sizeScale * 0.5, baseSize * sizeScale * 0.3, projConfig.length * sizeScale, 8);
        } else if (geometry === 'cylinder' && projConfig.length) {
            // Generic cylinder: uniform width
            geo = new THREE.CylinderGeometry(baseSize * sizeScale * 0.5, baseSize * sizeScale * 0.5, projConfig.length * sizeScale, 8);
        } else {
            // Default sphere
            geo = new THREE.SphereGeometry(baseSize * sizeScale, 12, 12);
        }

        const emissiveIntensity = emissiveMin + (speed / speedMax) * (emissiveMax - emissiveMin);
        const projMat = new THREE.MeshStandardMaterial({
            color: baseColor,
            emissive: hasGlow ? (projConfig.glowColor || baseColor) : 0x000000,
            emissiveIntensity: isLaser ? emissiveIntensity * 1.5 : emissiveIntensity  // Brighter for laser
        });
        const projMesh = new THREE.Mesh(geo, projMat);

        // Rotate cylinder to face forward
        if (geometry === 'cylinder' || isLaser || isDart) {
            projMesh.rotation.x = Math.PI / 2;
        }

        group.add(projMesh);

        // Glow - brighter for faster projectiles (if enabled)
        if (hasGlow) {
            const glowColor = projConfig.glowColor || baseColor;
            let glowGeo;
            if (isLaser) {
                // Elongated glow for laser beams
                const glowRadius = baseSize * 2.5 * sizeScale;
                const glowLength = projConfig.length * sizeScale * 1.3;
                glowGeo = new THREE.CylinderGeometry(glowRadius, glowRadius, glowLength, 8);
            } else {
                // Spherical glow for other projectiles
                glowGeo = new THREE.SphereGeometry(baseSize * 1.5 * sizeScale, 12, 12);
            }
            const glowMat = new THREE.MeshBasicMaterial({
                color: glowColor,
                transparent: true,
                opacity: isLaser
                    ? (this.glowOpacityBase + (speed / speedMax) * this.glowOpacityPower) * 1.5
                    : this.glowOpacityBase + (speed / speedMax) * this.glowOpacityPower
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            if (isLaser) {
                glow.rotation.x = Math.PI / 2;  // Match laser orientation
            }
            group.add(glow);
        }

        // Use provided spawn position (slingshot) or fallback to camera
        if (spawnPos) {
            group.position.copy(spawnPos);
        } else if (fallbackCamera) {
            group.position.copy(fallbackCamera.position);
            group.position.y -= 0.5;
        }

        // Calculate power (0-1) based on speed
        const power = (speed - speedMin) / (speedMax - speedMin);

        // Get gravity from projectile config (default 0 for arcade feel)
        const gravity = projConfig.gravity || 0;

        group.userData = {
            velocity: direction.clone().multiplyScalar(speed),
            active: true,
            prevPosition: group.position.clone(),
            power: Math.max(0, Math.min(1, power)),
            projectileType: projectileType,
            projectileConfig: projConfig,  // Store config for splash damage detection
            gravity: gravity  // Store per-projectile gravity
        };

        return group;
    },

    /**
     * Calculate spawn position for FPS projectile
     * @param {THREE} THREE - Three.js library
     * @param {Object} camera - Camera object
     * @param {Object} options - Options
     * @param {number} options.forwardOffset - How far in front of camera (default: 0.5)
     * @param {number} options.downOffset - How far below camera (default: 0.3)
     * @returns {THREE.Vector3} Spawn position
     */
    calculateSpawnPosition(THREE, camera, options = {}) {
        const { forwardOffset = this.spawnForwardOffset, downOffset = this.spawnDownOffset } = options;

        const spawnPos = camera.position.clone();
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        spawnPos.add(forward.multiplyScalar(forwardOffset));
        spawnPos.y -= downOffset;

        return spawnPos;
    },

    /**
     * Calculate fire direction from crosshair position
     * @param {THREE} THREE - Three.js library
     * @param {Object} camera - Camera object
     * @param {number} crosshairX - Crosshair X screen position
     * @param {number} crosshairY - Crosshair Y screen position
     * @param {THREE.Vector3} spawnPos - Projectile spawn position
     * @returns {THREE.Vector3} Normalized direction vector
     */
    calculateFireDirection(THREE, camera, crosshairX, crosshairY, spawnPos) {
        // Create raycaster from crosshair
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(
            (crosshairX / window.innerWidth) * 2 - 1,
            -(crosshairY / window.innerHeight) * 2 + 1
        );
        raycaster.setFromCamera(mouse, camera);

        // Calculate far point where crosshair is aiming
        const farPoint = new THREE.Vector3();
        farPoint.copy(raycaster.ray.direction).multiplyScalar(this.farPointDistance).add(raycaster.ray.origin);

        // Direction from spawn position to far point
        const direction = new THREE.Vector3();
        direction.subVectors(farPoint, spawnPos);
        direction.normalize();

        return direction;
    },

    /**
     * Full fire calculation (spawn position + direction)
     * @param {THREE} THREE - Three.js library
     * @param {Object} camera - Camera object
     * @param {number} crosshairX - Crosshair X screen position
     * @param {number} crosshairY - Crosshair Y screen position
     * @returns {Object} { spawnPos, direction }
     */
    calculateFire(THREE, camera, crosshairX, crosshairY) {
        const spawnPos = this.calculateSpawnPosition(THREE, camera);
        const direction = this.calculateFireDirection(THREE, camera, crosshairX, crosshairY, spawnPos);
        return { spawnPos, direction };
    },

    /**
     * Update mesh-based projectiles (for external array management)
     * @param {Array} projectiles - Array of projectile mesh groups
     * @param {Object} options - Update options
     * @param {number} options.dt - Delta time in seconds
     * @param {THREE.Vector3} options.cameraPosition - Camera position for distance check
     * @param {number} options.maxDistance - Max distance from camera
     * @param {number} options.minY - Min Y position
     * @param {number} options.maxY - Max Y position
     */
    updateMeshArray(projectiles, options = {}) {
        const {
            dt,
            cameraPosition,
            maxDistance = this.updateMaxDistance,
            minY = this.updateMinY,
            maxY = this.updateMaxY
        } = options;

        projectiles.forEach(proj => {
            if (!proj.userData.active) return;

            // Store previous position for sweep collision
            if (!proj.userData.prevPosition) {
                proj.userData.prevPosition = proj.position.clone();
            } else {
                proj.userData.prevPosition.copy(proj.position);
            }

            // Apply per-projectile gravity (from projectile config)
            const gravity = proj.userData.gravity || 0;
            if (gravity > 0) {
                proj.userData.velocity.y -= gravity * dt;
            }

            // Move projectile based on velocity
            proj.position.add(proj.userData.velocity.clone().multiplyScalar(dt));

            // Check if out of bounds
            const distFromCamera = cameraPosition
                ? proj.position.distanceTo(cameraPosition)
                : 0;

            if (distFromCamera > maxDistance ||
                proj.position.y < minY ||
                proj.position.y > maxY) {
                proj.userData.active = false;
            }
        });
    }
};
