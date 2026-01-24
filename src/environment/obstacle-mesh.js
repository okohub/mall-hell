// ============================================
// OBSTACLE VISUAL - Mesh Creation
// ============================================
// Self-contained, zero external dependencies
// Creates obstacle meshes - receives THREE as parameter

const ObstacleVisual = {
    /**
     * Create obstacle mesh based on type
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Obstacle type config
     * @param {Array} themeColors - Optional theme colors for products
     * @returns {THREE.Group} Obstacle mesh group
     */
    createMesh(THREE, config, themeColors = null) {
        switch (config.shape) {
            case 'pyramid':
                return this.createStack(THREE, config, themeColors);
            case 'cylinder':
                return this.createBarrel(THREE, config);
            case 'box':
                return this.createDisplay(THREE, config);
            default:
                return this.createStack(THREE, config, themeColors);
        }
    },

    /**
     * Create product stack (pyramid of boxes)
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Obstacle config
     * @param {Array} themeColors - Theme colors for boxes
     * @returns {THREE.Group} Stack mesh group
     */
    createStack(THREE, config, themeColors) {
        const group = new THREE.Group();
        const colors = themeColors || [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f];

        // Create pyramid of boxes
        const levels = 3;
        const boxSize = 0.5;

        for (let level = 0; level < levels; level++) {
            const boxesInLevel = levels - level;
            const levelY = level * boxSize + boxSize / 2;

            for (let i = 0; i < boxesInLevel; i++) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                const mat = new THREE.MeshStandardMaterial({
                    color: color,
                    roughness: 0.8,
                    metalness: 0.1
                });

                const box = new THREE.Mesh(
                    new THREE.BoxGeometry(boxSize * 0.9, boxSize * 0.9, boxSize * 0.9),
                    mat
                );

                const offsetX = (i - (boxesInLevel - 1) / 2) * boxSize;
                box.position.set(offsetX, levelY, 0);
                box.userData.originalY = levelY;
                group.add(box);
            }
        }

        group.userData.config = config;
        return group;
    },

    /**
     * Create barrel obstacle
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Obstacle config
     * @returns {THREE.Group} Barrel mesh group
     */
    createBarrel(THREE, config) {
        const group = new THREE.Group();
        const visual = config.visual;

        // Main barrel body
        const bodyMat = new THREE.MeshStandardMaterial({
            color: visual.bodyColor,
            roughness: 0.6,
            metalness: 0.2
        });

        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(config.size.r, config.size.r * 0.9, config.size.h, 16),
            bodyMat
        );
        body.position.y = config.size.h / 2;
        group.add(body);

        // Metal bands
        const bandMat = new THREE.MeshStandardMaterial({
            color: visual.bandColor,
            roughness: 0.3,
            metalness: 0.8
        });

        const bandPositions = [0.2, 0.5, 0.8];
        bandPositions.forEach(yPercent => {
            const band = new THREE.Mesh(
                new THREE.TorusGeometry(config.size.r + 0.02, 0.03, 8, 24),
                bandMat
            );
            band.rotation.x = Math.PI / 2;
            band.position.y = config.size.h * yPercent;
            group.add(band);
        });

        group.userData.config = config;
        group.userData.body = body;
        return group;
    },

    /**
     * Create display stand obstacle
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Obstacle config
     * @returns {THREE.Group} Display mesh group
     */
    createDisplay(THREE, config) {
        const group = new THREE.Group();
        const visual = config.visual;
        const size = config.size;

        // Frame
        const frameMat = new THREE.MeshStandardMaterial({
            color: visual.frameColor,
            roughness: 0.5,
            metalness: 0.3
        });

        // Base
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(size.w, 0.1, size.d),
            frameMat
        );
        base.position.y = 0.05;
        group.add(base);

        // Back panel
        const back = new THREE.Mesh(
            new THREE.BoxGeometry(size.w, size.h, 0.05),
            frameMat
        );
        back.position.set(0, size.h / 2, -size.d / 2 + 0.025);
        group.add(back);

        // Sign
        const signMat = new THREE.MeshStandardMaterial({
            color: visual.signColor,
            emissive: visual.signColor,
            emissiveIntensity: 0.3
        });

        const sign = new THREE.Mesh(
            new THREE.BoxGeometry(size.w * 0.8, 0.5, 0.05),
            signMat
        );
        sign.position.set(0, size.h - 0.3, -size.d / 2 + 0.06);
        group.add(sign);

        // Add text texture if available
        // (Would need canvas texture for actual text)

        group.userData.config = config;
        return group;
    },

    /**
     * Animate obstacle falling
     * @param {THREE.Group} mesh - Obstacle mesh
     * @param {number} progress - Fall progress (0-1)
     */
    animateFall(mesh, progress) {
        if (!mesh) return;

        // Rotate as it falls
        mesh.rotation.x = progress * (Math.PI / 2);
        mesh.rotation.z = progress * 0.3;

        // Move down slightly
        const config = mesh.userData.config;
        if (config) {
            const fallDistance = config.size.h || 1;
            mesh.position.y = -progress * fallDistance * 0.3;
        }
    },

    /**
     * Create obstacle by type string (factory method for index.html)
     * @param {THREE} THREE - Three.js library
     * @param {string} type - Type string ('stack', 'barrel', 'display')
     * @param {Object} options - Optional customization
     * @returns {THREE.Group} Obstacle mesh group with userData
     */
    createByType(THREE, type, options = {}) {
        const group = new THREE.Group();
        const colors = options.colors || [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6];

        if (type === 'stack') {
            const color = colors[Math.floor(Math.random() * colors.length)];
            // Pyramid of boxes
            for (let row = 0; row < 3; row++) {
                const boxesInRow = 3 - row;
                for (let col = 0; col < boxesInRow; col++) {
                    const boxGeo = new THREE.BoxGeometry(1, 0.8, 1);
                    const boxMat = new THREE.MeshStandardMaterial({ color: color });
                    const box = new THREE.Mesh(boxGeo, boxMat);
                    box.position.set(
                        (col - (boxesInRow - 1) / 2) * 1.1,
                        0.4 + row * 0.85,
                        0
                    );
                    box.castShadow = true;
                    group.add(box);
                }
            }
            group.userData.width = 3;
            group.userData.height = 3;
        } else if (type === 'barrel') {
            const barrelGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 16);
            const barrelMat = new THREE.MeshStandardMaterial({ color: 0x2980b9 });
            const barrel = new THREE.Mesh(barrelGeo, barrelMat);
            barrel.position.y = 0.75;
            barrel.castShadow = true;
            group.add(barrel);

            // Bands
            const bandGeo = new THREE.TorusGeometry(0.62, 0.05, 8, 32);
            const bandMat = new THREE.MeshStandardMaterial({ color: 0x1a5276 });
            [-0.4, 0.4].forEach(y => {
                const band = new THREE.Mesh(bandGeo, bandMat);
                band.rotation.x = Math.PI / 2;
                band.position.y = 0.75 + y;
                group.add(band);
            });

            group.userData.width = 1.5;
            group.userData.height = 2;
        } else if (type === 'display') {
            // Promotional display stand
            const standGeo = new THREE.BoxGeometry(2, 3, 1.5);
            const standMat = new THREE.MeshStandardMaterial({ color: 0xf39c12 });
            const stand = new THREE.Mesh(standGeo, standMat);
            stand.position.y = 1.5;
            stand.castShadow = true;
            group.add(stand);

            // Sale sign
            const signGeo = new THREE.BoxGeometry(1.8, 0.8, 0.1);
            const signCanvas = document.createElement('canvas');
            signCanvas.width = 256;
            signCanvas.height = 128;
            const ctx = signCanvas.getContext('2d');
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(0, 0, 256, 128);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SALE!', 128, 80);
            const signTex = new THREE.CanvasTexture(signCanvas);
            const signMat = new THREE.MeshStandardMaterial({ map: signTex });
            const sign = new THREE.Mesh(signGeo, signMat);
            sign.position.set(0, 3.5, 0);
            group.add(sign);

            group.userData.width = 2.5;
            group.userData.height = 4;
        }

        // Set common userData for all obstacle types
        group.userData.type = type;
        group.userData.active = true;
        group.userData.hit = false;
        group.userData.fallAngle = 0;
        group.userData.fallSpeed = 0;

        return group;
    },

    /**
     * Create hit effect (scatter boxes for stack)
     * @param {THREE} THREE - Three.js library
     * @param {THREE.Group} mesh - Obstacle mesh
     * @param {THREE.Scene} scene - Scene to add particles to
     */
    createHitEffect(THREE, mesh, scene) {
        if (!mesh || !scene) return;

        // For stacks, scatter the boxes
        mesh.children.forEach((child, i) => {
            if (child.isMesh) {
                const velocity = {
                    x: (Math.random() - 0.5) * 5,
                    y: Math.random() * 5 + 2,
                    z: (Math.random() - 0.5) * 5
                };
                child.userData.velocity = velocity;
                child.userData.angularVelocity = {
                    x: (Math.random() - 0.5) * 5,
                    y: (Math.random() - 0.5) * 5,
                    z: (Math.random() - 0.5) * 5
                };
            }
        });
    }
};
