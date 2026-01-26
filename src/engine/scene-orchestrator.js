// ============================================
// SCENE SYSTEM - THREE.js Scene Management
// ============================================
// Handles scene, camera, renderer setup and scene groups.
// THREE.js is passed as a parameter (no global dependency).

const SceneSystem = {
    // THREE.js reference
    _THREE: null,

    // Core components
    scene: null,
    camera: null,
    renderer: null,

    // Scene groups for organization
    _groups: {},

    // Container element
    _container: null,

    // Configuration
    _config: null,

    // ==========================================
    // INITIALIZATION
    // ==========================================

    /**
     * Initialize the scene manager
     * @param {Object} THREE - THREE.js library reference
     * @param {HTMLElement} container - DOM element to render into
     * @param {Object} config - Configuration options
     */
    init(THREE, container, config = {}) {
        this._THREE = THREE;
        this._container = container;

        // Merge with defaults
        const defaults = (typeof Engine !== 'undefined' && Engine.defaults) ? {
            render: Engine.defaults.render,
            camera: Engine.defaults.camera,
            scene: Engine.defaults.scene
        } : {
            render: {
                antialias: true,
                shadowMapEnabled: true,
                shadowMapType: 'PCFSoftShadowMap',
                pixelRatio: 1
            },
            camera: {
                fov: 75,
                near: 0.1,
                far: 1000,
                position: { x: 0, y: 3, z: 0 }
            },
            scene: {
                backgroundColor: 0x1a1a2e,
                fogColor: 0x1a1a2e,
                fogNear: 50,
                fogFar: 200
            }
        };

        this._config = {
            render: { ...defaults.render, ...config.render },
            camera: { ...defaults.camera, ...config.camera },
            scene: { ...defaults.scene, ...config.scene }
        };

        // Create scene
        this._createScene();

        // Create camera
        this._createCamera();

        // Create renderer
        this._createRenderer();

        // Create default groups
        this._createDefaultGroups();

        // Handle window resize
        window.addEventListener('resize', () => this._onWindowResize());

        return this;
    },

    /**
     * Create the THREE.js scene
     * @private
     */
    _createScene() {
        const THREE = this._THREE;
        const config = this._config.scene;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(config.backgroundColor);

        if (config.fogNear && config.fogFar) {
            this.scene.fog = new THREE.Fog(
                config.fogColor,
                config.fogNear,
                config.fogFar
            );
        }
    },

    /**
     * Create the camera
     * @private
     */
    _createCamera() {
        const THREE = this._THREE;
        const config = this._config.camera;
        const container = this._container;

        const aspect = container
            ? container.clientWidth / container.clientHeight
            : window.innerWidth / window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(
            config.fov,
            aspect,
            config.near,
            config.far
        );

        this.camera.position.set(
            config.position.x,
            config.position.y,
            config.position.z
        );

        this.camera.rotation.order = 'YXZ';

        // Add camera to scene (required for camera children like FPS weapon)
        this.scene.add(this.camera);
    },

    /**
     * Create the renderer
     * @private
     */
    _createRenderer() {
        const THREE = this._THREE;
        const config = this._config.render;
        const container = this._container;

        this.renderer = new THREE.WebGLRenderer({
            antialias: config.antialias
        });

        const width = container ? container.clientWidth : window.innerWidth;
        const height = container ? container.clientHeight : window.innerHeight;

        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(config.pixelRatio || window.devicePixelRatio);

        if (config.shadowMapEnabled) {
            this.renderer.shadowMap.enabled = true;
            if (config.shadowMapType === 'PCFSoftShadowMap') {
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            }
        }

        // Add to container
        if (container) {
            container.insertBefore(this.renderer.domElement, container.firstChild);
        }
    },

    /**
     * Create default scene groups
     * @private
     */
    _createDefaultGroups() {
        const groupNames = (typeof Engine !== 'undefined' && Engine.GROUPS)
            ? Object.values(Engine.GROUPS)
            : ['environment', 'enemies', 'obstacles', 'projectiles', 'particles', 'ui'];

        for (const name of groupNames) {
            this.createGroup(name);
        }
    },

    // ==========================================
    // GROUP MANAGEMENT
    // ==========================================

    /**
     * Create a scene group
     * @param {string} name - Group name
     * @returns {Object} THREE.Group
     */
    createGroup(name) {
        if (this._groups[name]) {
            return this._groups[name];
        }

        const THREE = this._THREE;
        const group = new THREE.Group();
        group.name = name;
        this._groups[name] = group;
        this.scene.add(group);
        return group;
    },

    /**
     * Get a scene group
     * @param {string} name - Group name
     * @returns {Object|null} THREE.Group or null
     */
    getGroup(name) {
        return this._groups[name] || null;
    },

    /**
     * Add an object to a group
     * @param {string} groupName - Group name
     * @param {Object} object - THREE.js object to add
     * @returns {boolean} Success
     */
    addToGroup(groupName, object) {
        const group = this._groups[groupName];
        if (!group) {
            console.warn(`SceneSystem: Group "${groupName}" not found`);
            return false;
        }
        group.add(object);
        return true;
    },

    /**
     * Remove an object from a group
     * @param {string} groupName - Group name
     * @param {Object} object - THREE.js object to remove
     * @returns {boolean} Success
     */
    removeFromGroup(groupName, object) {
        const group = this._groups[groupName];
        if (!group) {
            return false;
        }
        group.remove(object);
        return true;
    },

    /**
     * Clear all objects from a group
     * @param {string} groupName - Group name
     */
    clearGroup(groupName) {
        const group = this._groups[groupName];
        if (!group) return;

        while (group.children.length > 0) {
            group.remove(group.children[0]);
        }
    },

    // ==========================================
    // SCENE OPERATIONS
    // ==========================================

    /**
     * Add an object directly to the scene
     * @param {Object} object - THREE.js object
     */
    add(object) {
        this.scene.add(object);
    },

    /**
     * Remove an object from the scene
     * @param {Object} object - THREE.js object
     */
    remove(object) {
        this.scene.remove(object);
    },

    /**
     * Render the scene
     */
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    },

    /**
     * Render with a custom composer (post-processing)
     * @param {Object} composer - EffectComposer instance
     * @param {number} deltaTime - Delta time for effects
     */
    renderWithComposer(composer, deltaTime = 0) {
        if (composer) {
            composer.render(deltaTime);
        } else {
            this.render();
        }
    },

    // ==========================================
    // CAMERA OPERATIONS
    // ==========================================

    /**
     * Set camera position
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setCameraPosition(x, y, z) {
        if (this.camera) {
            this.camera.position.set(x, y, z);
        }
    },

    /**
     * Set camera rotation
     * @param {number} x - Pitch (radians)
     * @param {number} y - Yaw (radians)
     * @param {number} z - Roll (radians)
     */
    setCameraRotation(x, y, z) {
        if (this.camera) {
            this.camera.rotation.set(x, y, z);
        }
    },

    /**
     * Make camera look at a position
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    lookAt(x, y, z) {
        if (this.camera) {
            this.camera.lookAt(x, y, z);
        }
    },

    /**
     * Get camera world direction
     * @returns {Object} Direction vector {x, y, z}
     */
    getCameraDirection() {
        if (!this.camera) return { x: 0, y: 0, z: -1 };

        const THREE = this._THREE;
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        return { x: direction.x, y: direction.y, z: direction.z };
    },

    // ==========================================
    // RESIZE HANDLING
    // ==========================================

    /**
     * Handle window resize
     * @private
     */
    _onWindowResize() {
        const container = this._container;
        const width = container ? container.clientWidth : window.innerWidth;
        const height = container ? container.clientHeight : window.innerHeight;

        if (this.camera) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }

        if (this.renderer) {
            this.renderer.setSize(width, height);
        }
    },

    /**
     * Force resize update
     */
    resize() {
        this._onWindowResize();
    },

    // ==========================================
    // CLEANUP
    // ==========================================

    /**
     * Dispose of all resources
     */
    dispose() {
        // Clear all groups
        for (const name in this._groups) {
            this.clearGroup(name);
        }
        this._groups = {};

        // Dispose renderer
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            this.renderer = null;
        }

        // Clear scene
        if (this.scene) {
            while (this.scene.children.length > 0) {
                this.scene.remove(this.scene.children[0]);
            }
            this.scene = null;
        }

        this.camera = null;
        this._THREE = null;
        this._container = null;
    }
};
