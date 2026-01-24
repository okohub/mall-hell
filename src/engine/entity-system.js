// ============================================
// ENTITY SYSTEM - Entity Lifecycle Management
// ============================================
// Manages entity spawning, despawning, and cleanup.
// Works with any scene/group system.

const EntitySystem = {
    // Scene reference
    _scene: null,

    // Entity type configurations
    _types: {},

    // Entity collections by type
    _entities: {},

    // ID counter for unique entity IDs
    _nextId: 1,

    // ==========================================
    // INITIALIZATION
    // ==========================================

    /**
     * Initialize the entity manager
     * @param {Object} scene - THREE.js scene or SceneManager
     */
    init(scene) {
        this._scene = scene;
        this._types = {};
        this._entities = {};
        this._nextId = 1;
    },

    /**
     * Register an entity type with its configuration
     * @param {string} typeName - Type name (e.g., 'enemy', 'projectile')
     * @param {Object} config - Configuration object
     */
    registerType(typeName, config = {}) {
        const defaults = (typeof Engine !== 'undefined' && Engine.defaults?.spawn)
            ? Engine.defaults.spawn
            : { maxEnemies: 10, maxObstacles: 15, maxProjectiles: 50, maxParticles: 100 };

        // Get max count from Engine defaults if available
        const defaultMax = defaults['max' + typeName.charAt(0).toUpperCase() + typeName.slice(1) + 's'] || 50;

        this._types[typeName] = {
            maxCount: config.maxCount !== undefined ? config.maxCount : defaultMax,
            despawnDistance: config.despawnDistance !== undefined ? config.despawnDistance : 30,
            despawnBehind: config.despawnBehind !== undefined ? config.despawnBehind : true,
            group: config.group || typeName + 's',
            onSpawn: config.onSpawn || null,
            onDespawn: config.onDespawn || null
        };

        this._entities[typeName] = [];
    },

    /**
     * Reset entity manager (clear all entities)
     */
    reset() {
        // Clear all entities from all types
        for (const typeName in this._entities) {
            const entities = this._entities[typeName];
            for (const entity of entities) {
                this._removeFromScene(entity.mesh);
            }
            this._entities[typeName] = [];
        }
        this._nextId = 1;
    },

    // ==========================================
    // ENTITY SPAWNING
    // ==========================================

    /**
     * Spawn an entity
     * @param {string} typeName - Entity type name
     * @param {Object} mesh - THREE.js mesh/group
     * @param {Object} data - Custom entity data
     * @returns {Object|null} Entity wrapper or null if spawn failed
     */
    spawn(typeName, mesh, data = {}) {
        const typeConfig = this._types[typeName];
        if (!typeConfig) {
            console.warn(`EntitySystem: Unknown type "${typeName}"`);
            return null;
        }

        const entities = this._entities[typeName];

        // Check max count
        if (entities.length >= typeConfig.maxCount) {
            return null;
        }

        // Create entity wrapper
        const entity = {
            id: this._nextId++,
            type: typeName,
            mesh: mesh,
            active: true,
            data: { ...data },
            spawnTime: performance.now()
        };

        // Store entity reference on mesh for collision detection
        mesh.userData = mesh.userData || {};
        mesh.userData.entityId = entity.id;
        mesh.userData.entityType = typeName;
        mesh.userData.active = true;
        Object.assign(mesh.userData, data);

        // Add to scene
        this._addToScene(mesh, typeConfig.group);

        // Add to collection
        entities.push(entity);

        // Fire spawn callback
        if (typeConfig.onSpawn) {
            typeConfig.onSpawn(entity);
        }

        return entity;
    },

    /**
     * Add mesh to scene (handles SceneManager or direct scene)
     * @private
     */
    _addToScene(mesh, groupName) {
        if (!this._scene) return;

        // If using SceneManager
        if (this._scene.addToGroup) {
            this._scene.addToGroup(groupName, mesh);
        }
        // If direct scene reference
        else if (this._scene.add) {
            this._scene.add(mesh);
        }
    },

    /**
     * Remove mesh from scene
     * @private
     */
    _removeFromScene(mesh) {
        if (!this._scene) return;

        // If using SceneManager with scene property
        if (this._scene.scene) {
            this._scene.scene.remove(mesh);
        }
        // If using SceneManager remove method
        else if (this._scene.remove) {
            this._scene.remove(mesh);
        }
        // Try parent removal
        else if (mesh.parent) {
            mesh.parent.remove(mesh);
        }
    },

    // ==========================================
    // ENTITY DESPAWNING
    // ==========================================

    /**
     * Despawn an entity by reference
     * @param {string} typeName - Entity type name
     * @param {Object} entity - Entity wrapper
     */
    despawn(typeName, entity) {
        if (!entity) return;

        const typeConfig = this._types[typeName];
        const entities = this._entities[typeName];
        if (!entities) return;

        // Mark as inactive
        entity.active = false;
        if (entity.mesh && entity.mesh.userData) {
            entity.mesh.userData.active = false;
        }

        // Fire despawn callback
        if (typeConfig && typeConfig.onDespawn) {
            typeConfig.onDespawn(entity);
        }

        // Remove from scene
        this._removeFromScene(entity.mesh);

        // Remove from collection
        const index = entities.indexOf(entity);
        if (index !== -1) {
            entities.splice(index, 1);
        }
    },

    /**
     * Despawn an entity by mesh reference
     * @param {string} typeName - Entity type name
     * @param {Object} mesh - THREE.js mesh
     */
    despawnByMesh(typeName, mesh) {
        const entity = this.getByMesh(typeName, mesh);
        if (entity) {
            this.despawn(typeName, entity);
        }
    },

    /**
     * Despawn an entity by ID
     * @param {string} typeName - Entity type name
     * @param {number} id - Entity ID
     */
    despawnById(typeName, id) {
        const entity = this.getById(typeName, id);
        if (entity) {
            this.despawn(typeName, entity);
        }
    },

    /**
     * Mark an entity for despawn (will be cleaned up on next updateAll)
     * @param {string} typeName - Entity type name
     * @param {Object} entity - Entity wrapper
     */
    markForDespawn(typeName, entity) {
        if (entity) {
            entity.active = false;
            if (entity.mesh && entity.mesh.userData) {
                entity.mesh.userData.active = false;
            }
        }
    },

    // ==========================================
    // ENTITY QUERIES
    // ==========================================

    /**
     * Get all active entities of a type
     * @param {string} typeName - Entity type name
     * @returns {Object[]} Array of entity wrappers
     */
    getActive(typeName) {
        const entities = this._entities[typeName];
        return entities ? entities.filter(e => e.active) : [];
    },

    /**
     * Get all entities of a type (including inactive)
     * @param {string} typeName - Entity type name
     * @returns {Object[]} Array of entity wrappers
     */
    getAll(typeName) {
        return this._entities[typeName] || [];
    },

    /**
     * Get entity count for a type
     * @param {string} typeName - Entity type name
     * @returns {number}
     */
    getCount(typeName) {
        const entities = this._entities[typeName];
        return entities ? entities.length : 0;
    },

    /**
     * Get active entity count for a type
     * @param {string} typeName - Entity type name
     * @returns {number}
     */
    getActiveCount(typeName) {
        const entities = this._entities[typeName];
        return entities ? entities.filter(e => e.active).length : 0;
    },

    /**
     * Check if at max capacity for a type
     * @param {string} typeName - Entity type name
     * @returns {boolean}
     */
    isAtCapacity(typeName) {
        const typeConfig = this._types[typeName];
        const entities = this._entities[typeName];
        if (!typeConfig || !entities) return true;
        return entities.length >= typeConfig.maxCount;
    },

    /**
     * Get entity by ID
     * @param {string} typeName - Entity type name
     * @param {number} id - Entity ID
     * @returns {Object|null} Entity wrapper or null
     */
    getById(typeName, id) {
        const entities = this._entities[typeName];
        if (!entities) return null;
        return entities.find(e => e.id === id) || null;
    },

    /**
     * Get entity by mesh
     * @param {string} typeName - Entity type name
     * @param {Object} mesh - THREE.js mesh
     * @returns {Object|null} Entity wrapper or null
     */
    getByMesh(typeName, mesh) {
        const entities = this._entities[typeName];
        if (!entities) return null;
        return entities.find(e => e.mesh === mesh) || null;
    },

    // ==========================================
    // CLEANUP
    // ==========================================

    /**
     * Clean up inactive entities and those outside range
     * @param {Object} cameraPos - Camera position {x, y, z}
     */
    updateAll(cameraPos) {
        for (const typeName in this._entities) {
            this.updateType(typeName, cameraPos);
        }
    },

    /**
     * Clean up entities of a specific type
     * @param {string} typeName - Entity type name
     * @param {Object} cameraPos - Camera position {x, y, z}
     */
    updateType(typeName, cameraPos) {
        const typeConfig = this._types[typeName];
        const entities = this._entities[typeName];
        if (!typeConfig || !entities) return;

        // Filter out inactive entities and those out of range
        const toRemove = [];

        for (const entity of entities) {
            let shouldRemove = false;

            // Check if marked inactive
            if (!entity.active) {
                shouldRemove = true;
            }
            // Check mesh userData for inactive flag
            else if (entity.mesh && entity.mesh.userData && !entity.mesh.userData.active) {
                shouldRemove = true;
            }
            // Check despawn distance (behind camera)
            else if (typeConfig.despawnBehind && cameraPos && entity.mesh) {
                const zDist = entity.mesh.position.z - cameraPos.z;
                if (zDist > typeConfig.despawnDistance) {
                    shouldRemove = true;
                }
            }

            if (shouldRemove) {
                toRemove.push(entity);
            }
        }

        // Remove entities
        for (const entity of toRemove) {
            this.despawn(typeName, entity);
        }
    },

    /**
     * Iterate over all active entities of a type
     * @param {string} typeName - Entity type name
     * @param {Function} callback - Callback(entity, mesh)
     */
    forEach(typeName, callback) {
        const entities = this._entities[typeName];
        if (!entities) return;

        for (const entity of entities) {
            if (entity.active) {
                callback(entity, entity.mesh);
            }
        }
    },

    /**
     * Find entities matching a predicate
     * @param {string} typeName - Entity type name
     * @param {Function} predicate - Predicate function(entity) -> boolean
     * @returns {Object[]} Matching entities
     */
    filter(typeName, predicate) {
        const entities = this._entities[typeName];
        if (!entities) return [];
        return entities.filter(e => e.active && predicate(e));
    },

    // ==========================================
    // ARRAY-BASED CLEANUP (for external arrays)
    // ==========================================

    /**
     * Clean up inactive meshes from an array
     * @param {Array} meshArray - Array of THREE.js meshes with userData.active flag
     * @param {Object} scene - THREE.js scene for removal
     * @param {Object} options - Cleanup options
     * @param {string} options.checkField - Field to check (default: 'active')
     * @param {*} options.checkValue - Value that indicates removal (default: false)
     * @param {boolean} options.invertCheck - Invert the check (for fields like 'life' <= 0)
     * @returns {Array} Filtered array with only active meshes
     */
    cleanupInactive(meshArray, scene, options = {}) {
        const {
            checkField = 'active',
            checkValue = false,
            invertCheck = false
        } = options;

        return meshArray.filter(mesh => {
            let shouldRemove;

            if (invertCheck) {
                // For fields like 'life' where <= 0 means remove
                shouldRemove = mesh.userData[checkField] <= checkValue;
            } else {
                // Standard check - remove if field matches checkValue
                shouldRemove = mesh.userData[checkField] === checkValue;
            }

            if (shouldRemove) {
                scene.remove(mesh);
                return false;
            }
            return true;
        });
    },

    /**
     * Clean up multiple arrays at once
     * @param {Object} arrays - Object mapping names to arrays
     * @param {Object} scene - THREE.js scene for removal
     * @returns {Object} Object with cleaned arrays
     */
    cleanupAllInactive(arrays, scene) {
        const result = {};
        for (const name in arrays) {
            const arr = arrays[name];
            // Special case for particles (check life <= 0)
            if (name === 'particles') {
                result[name] = this.cleanupInactive(arr, scene, {
                    checkField: 'life',
                    checkValue: 0,
                    invertCheck: true
                });
            } else {
                result[name] = this.cleanupInactive(arr, scene);
            }
        }
        return result;
    },

    // ==========================================
    // TYPE INFO
    // ==========================================

    /**
     * Get type configuration
     * @param {string} typeName - Entity type name
     * @returns {Object|null} Type config or null
     */
    getTypeConfig(typeName) {
        return this._types[typeName] || null;
    },

    /**
     * Check if type is registered
     * @param {string} typeName - Entity type name
     * @returns {boolean}
     */
    hasType(typeName) {
        return typeName in this._types;
    },

    /**
     * Get all registered type names
     * @returns {string[]}
     */
    getTypeNames() {
        return Object.keys(this._types);
    }
};
