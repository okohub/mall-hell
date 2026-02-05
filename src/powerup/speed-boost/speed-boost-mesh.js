// ============================================
// SPEED BOOST - Pickup Mesh
// ============================================
// Stylized energy drink can used for the speed boost pickup

const SpeedBoostMesh = {
    /**
     * Create pickup mesh for speed boost
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Power-up config (includes visual)
     * @returns {THREE.Group}
     */
    createPickupMesh(THREE, config) {
        const pickup = new THREE.Group();
        const visual = config?.visual || {};

        const canColor = visual.color || 0xff3333;
        const glowColor = visual.glowColor || 0xffaa00;
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

        return pickup;
    }
};
