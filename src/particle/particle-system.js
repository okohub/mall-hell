// ============================================
// PARTICLE SYSTEM - Visual Effects
// ============================================
// Manages particle spawning, movement, and lifecycle.
// Self-contained with no external dependencies.

const ParticleSystem = {
    // Active particles array (managed externally in index.html)
    // This system provides utilities for particle creation and management

    // Configuration
    maxParticles: 50,
    particleSize: 0.2,
    defaultLife: 0.8,

    // Shared geometry (created on init)
    _geometry: null,
    _THREE: null,

    /**
     * Initialize the particle system
     * @param {THREE} THREE - Three.js library reference
     */
    init(THREE) {
        this._THREE = THREE;
        this._geometry = new THREE.BoxGeometry(this.particleSize, this.particleSize, this.particleSize);
    },

    /**
     * Get shared particle geometry
     * @param {THREE} THREE - Three.js library (fallback if not initialized)
     * @returns {THREE.BoxGeometry}
     */
    getGeometry(THREE) {
        if (!this._geometry && THREE) {
            this._geometry = new THREE.BoxGeometry(this.particleSize, this.particleSize, this.particleSize);
        }
        return this._geometry;
    },

    /**
     * Create a single particle mesh
     * @param {THREE} THREE - Three.js library
     * @param {Object} position - Position vector (THREE.Vector3 or {x,y,z})
     * @param {number} color - Particle color
     * @param {Object} options - Optional particle configuration
     * @returns {THREE.Mesh} Particle mesh with userData
     */
    createParticle(THREE, position, color, options = {}) {
        const {
            velocitySpread = 10,
            upwardVelocity = { min: 2, max: 10 },
            life = this.defaultLife
        } = options;

        const geometry = this.getGeometry(THREE);
        const material = new THREE.MeshBasicMaterial({ color: color });
        const particle = new THREE.Mesh(geometry, material);

        // Copy position
        if (position.clone) {
            particle.position.copy(position);
        } else {
            particle.position.set(position.x, position.y, position.z);
        }

        // Set velocity and life
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * velocitySpread,
                Math.random() * (upwardVelocity.max - upwardVelocity.min) + upwardVelocity.min,
                (Math.random() - 0.5) * velocitySpread
            ),
            life: life
        };

        return particle;
    },

    /**
     * Spawn multiple particles at a position
     * @param {THREE} THREE - Three.js library
     * @param {Object} position - Spawn position
     * @param {number} color - Particle color
     * @param {number} count - Number of particles to spawn
     * @param {Array} particlesArray - External particles array to add to
     * @param {THREE.Scene} scene - Scene to add particles to
     * @param {Object} options - Particle options
     * @returns {number} Number of particles actually spawned
     */
    spawn(THREE, position, color, count, particlesArray, scene, options = {}) {
        // Limit particles based on current count
        const available = this.maxParticles - particlesArray.length;
        const toSpawn = Math.min(count, available);

        for (let i = 0; i < toSpawn; i++) {
            const particle = this.createParticle(THREE, position, color, options);
            scene.add(particle);
            particlesArray.push(particle);
        }

        return toSpawn;
    },

    /**
     * Update all particles in an array
     * @param {Array} particlesArray - Array of particle meshes
     * @param {number} dt - Delta time in seconds
     * @param {Object} options - Update options
     * @param {number} options.gravity - Gravity to apply (default: 15)
     * @param {number} options.fadeRate - Life decay rate (default: 1)
     */
    updateAll(particlesArray, dt, options = {}) {
        const {
            gravity = 15,
            fadeRate = 1
        } = options;

        particlesArray.forEach(particle => {
            if (!particle.userData) return;

            const vel = particle.userData.velocity;
            if (vel) {
                // Apply gravity
                vel.y -= gravity * dt;

                // Move particle
                particle.position.x += vel.x * dt;
                particle.position.y += vel.y * dt;
                particle.position.z += vel.z * dt;
            }

            // Decay life
            particle.userData.life -= dt * fadeRate;

            // Update transparency based on remaining life
            if (particle.material && particle.material.transparent !== undefined) {
                particle.material.transparent = true;
                particle.material.opacity = Math.max(0, particle.userData.life / this.defaultLife);
            }
        });
    },

    /**
     * Check if can spawn more particles
     * @param {Array} particlesArray - Current particles array
     * @returns {boolean}
     */
    canSpawn(particlesArray) {
        return particlesArray.length < this.maxParticles;
    },

    /**
     * Get available spawn count
     * @param {Array} particlesArray - Current particles array
     * @returns {number}
     */
    getAvailableCount(particlesArray) {
        return Math.max(0, this.maxParticles - particlesArray.length);
    },

    /**
     * Reset system state
     */
    reset() {
        // Geometry is kept for reuse
    }
};
