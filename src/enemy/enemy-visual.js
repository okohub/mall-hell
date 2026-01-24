// ============================================
// ENEMY VISUAL - Mesh Creation
// ============================================
// Self-contained, zero external dependencies
// Creates enemy meshes - receives THREE as parameter

const EnemyVisual = {
    /**
     * Create enemy cart mesh
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Enemy type config
     * @returns {THREE.Group} Enemy mesh group
     */
    createCartMesh(THREE, config) {
        const cart = new THREE.Group();
        const visual = config.visual;
        const size = visual.size;

        // Body
        const bodyMat = new THREE.MeshStandardMaterial({
            color: visual.bodyColor,
            roughness: 0.6,
            metalness: 0.3
        });

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(size.w, size.h, size.d),
            bodyMat
        );
        body.position.y = size.h / 2 + 0.5;
        cart.add(body);

        // Wire frame top
        const wireMat = new THREE.MeshStandardMaterial({
            color: visual.wireColor,
            roughness: 0.4,
            metalness: 0.6
        });

        // Front wire
        const frontWire = new THREE.Mesh(
            new THREE.BoxGeometry(size.w - 0.2, 0.8, 0.1),
            wireMat
        );
        frontWire.position.set(0, size.h + 0.5, -size.d / 2 + 0.1);
        cart.add(frontWire);

        // Back wire
        const backWire = new THREE.Mesh(
            new THREE.BoxGeometry(size.w - 0.2, 0.8, 0.1),
            wireMat
        );
        backWire.position.set(0, size.h + 0.5, size.d / 2 - 0.1);
        cart.add(backWire);

        // Side wires
        const leftWire = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.8, size.d - 0.2),
            wireMat
        );
        leftWire.position.set(-size.w / 2 + 0.1, size.h + 0.5, 0);
        cart.add(leftWire);

        const rightWire = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.8, size.d - 0.2),
            wireMat
        );
        rightWire.position.set(size.w / 2 - 0.1, size.h + 0.5, 0);
        cart.add(rightWire);

        // Evil eyes
        const eyeMat = new THREE.MeshStandardMaterial({
            color: visual.eyeColor,
            emissive: visual.eyeColor,
            emissiveIntensity: 0.8
        });

        const leftEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 8, 8),
            eyeMat
        );
        leftEye.position.set(-0.4, size.h + 0.3, -size.d / 2 - 0.1);
        cart.add(leftEye);

        const rightEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 8, 8),
            eyeMat
        );
        rightEye.position.set(0.4, size.h + 0.3, -size.d / 2 - 0.1);
        cart.add(rightEye);

        // Wheels
        const wheelMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });

        const wheelPositions = [
            [-size.w / 2 + 0.2, 0.3, -size.d / 2 + 0.3],
            [size.w / 2 - 0.2, 0.3, -size.d / 2 + 0.3],
            [-size.w / 2 + 0.2, 0.3, size.d / 2 - 0.3],
            [size.w / 2 - 0.2, 0.3, size.d / 2 - 0.3]
        ];

        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.3, 0.15, 12),
                wheelMat
            );
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...pos);
            cart.add(wheel);
        });

        // Store references for animation
        cart.userData.body = body;
        cart.userData.leftEye = leftEye;
        cart.userData.rightEye = rightEye;
        cart.userData.config = config;

        return cart;
    },

    /**
     * Create health bar for enemy
     * @param {THREE} THREE - Three.js library
     * @param {number} width - Health bar width
     * @returns {THREE.Group} Health bar group
     */
    createHealthBar(THREE, width = 2) {
        const group = new THREE.Group();

        // Background
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const bg = new THREE.Mesh(
            new THREE.PlaneGeometry(width, 0.2),
            bgMat
        );
        group.add(bg);

        // Fill
        const fillMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const fill = new THREE.Mesh(
            new THREE.PlaneGeometry(width - 0.05, 0.15),
            fillMat
        );
        fill.position.z = 0.01;
        group.add(fill);

        group.userData.fill = fill;
        group.userData.fillMat = fillMat;
        group.userData.width = width;

        return group;
    },

    /**
     * Update health bar display
     * @param {THREE.Group} healthBar - Health bar group
     * @param {number} percent - Health percentage (0-1)
     */
    updateHealthBar(healthBar, percent) {
        if (!healthBar || !healthBar.userData.fill) return;

        const fill = healthBar.userData.fill;
        const width = healthBar.userData.width || 2;

        // Scale fill
        fill.scale.x = Math.max(0, percent);
        fill.position.x = -(width / 2) * (1 - percent);

        // Color based on health
        const mat = healthBar.userData.fillMat;
        if (percent > 0.6) {
            mat.color.setHex(0x00ff00); // Green
        } else if (percent > 0.3) {
            mat.color.setHex(0xffff00); // Yellow
        } else {
            mat.color.setHex(0xff0000); // Red
        }
    },

    /**
     * Apply hit flash effect
     * @param {THREE.Group} enemyMesh - Enemy mesh group
     * @param {number} intensity - Flash intensity (0-1)
     */
    applyHitFlash(enemyMesh, intensity) {
        if (!enemyMesh || !enemyMesh.userData.body) return;

        const body = enemyMesh.userData.body;
        if (intensity > 0) {
            body.material.emissive = body.material.emissive || new THREE.Color();
            body.material.emissive.setHex(0xffffff);
            body.material.emissiveIntensity = intensity;
        } else {
            body.material.emissiveIntensity = 0;
        }
    },

    /**
     * Animate enemy eyes (look at target)
     * @param {THREE.Group} enemyMesh - Enemy mesh group
     * @param {THREE.Vector3} targetPos - Position to look at
     */
    animateEyes(enemyMesh, targetPos) {
        if (!enemyMesh || !enemyMesh.userData.leftEye) return;

        const leftEye = enemyMesh.userData.leftEye;
        const rightEye = enemyMesh.userData.rightEye;

        // Simple look-at by adjusting eye positions slightly
        const dx = targetPos.x - enemyMesh.position.x;
        const lookX = Math.max(-0.05, Math.min(0.05, dx * 0.01));

        leftEye.position.x = -0.4 + lookX;
        rightEye.position.x = 0.4 + lookX;
    },

    /**
     * Create complete enemy with health bar
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Enemy type config
     * @returns {THREE.Group} Complete enemy group
     */
    createEnemy(THREE, config) {
        const group = new THREE.Group();

        // Create cart mesh
        const cart = this.createCartMesh(THREE, config);
        group.add(cart);
        group.userData.cart = cart;

        // Create health bar
        const healthBar = this.createHealthBar(THREE, 2);
        healthBar.position.y = config.visual.size.h + 1.5;
        healthBar.rotation.x = -0.3; // Tilt towards camera
        group.add(healthBar);
        group.userData.healthBar = healthBar;

        return group;
    }
};
