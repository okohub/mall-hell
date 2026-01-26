// ============================================
// POST-PROCESS SYSTEM - Visual Effects
// ============================================
// Manages post-processing effects (bloom, vignette, color grading).
// Self-contained with inline EffectComposer for r128 compatibility.

const PostProcessSystem = {
    // References
    composer: null,
    bloomPass: null,
    vignettePass: null,
    renderer: null,

    // ==========================================
    // HELPER CLASSES
    // ==========================================

    /**
     * RenderPass - renders scene to texture
     */
    RenderPass: class {
        constructor(scene, camera) {
            this.scene = scene;
            this.camera = camera;
            this.clear = true;
            this.clearDepth = false;
            this.needsSwap = false;
            this.enabled = true;
        }
        render(renderer, writeBuffer, readBuffer) {
            renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
            if (this.clear) renderer.clear();
            renderer.render(this.scene, this.camera);
        }
    },

    /**
     * ShaderPass - applies a shader to the scene
     */
    ShaderPass: class {
        constructor(shader, THREE) {
            this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
            this.material = new THREE.ShaderMaterial({
                uniforms: this.uniforms,
                vertexShader: shader.vertexShader,
                fragmentShader: shader.fragmentShader
            });
            this.fsQuad = null; // Set after FullScreenQuad is available
            this.enabled = true;
            this.needsSwap = true;
            this.clear = false;
            this.renderToScreen = false;
            this._THREE = THREE;
        }
        setFullScreenQuad(fsQuad) {
            this.fsQuad = fsQuad;
        }
        render(renderer, writeBuffer, readBuffer) {
            this.uniforms.tDiffuse.value = readBuffer.texture;
            renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
            if (this.clear) renderer.clear();
            if (this.fsQuad) this.fsQuad.render(renderer);
        }
    },

    /**
     * FullScreenQuad helper
     */
    FullScreenQuad: class {
        constructor(material, THREE) {
            const geo = new THREE.PlaneGeometry(2, 2);
            this.mesh = new THREE.Mesh(geo, material);
            this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            this.scene = new THREE.Scene();
            this.scene.add(this.mesh);
        }
        render(renderer) {
            renderer.render(this.scene, this.camera);
        }
        get material() { return this.mesh.material; }
        set material(v) { this.mesh.material = v; }
    },

    /**
     * EffectComposer
     */
    EffectComposer: class {
        constructor(renderer, renderTarget, THREE) {
            this.renderer = renderer;
            const size = renderer.getSize(new THREE.Vector2());
            this.renderTarget1 = renderTarget || new THREE.WebGLRenderTarget(size.x, size.y, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat
            });
            this.renderTarget2 = this.renderTarget1.clone();
            this.writeBuffer = this.renderTarget1;
            this.readBuffer = this.renderTarget2;
            this.passes = [];
            this._THREE = THREE;
        }
        addPass(pass) {
            this.passes.push(pass);
            const size = this.renderer.getSize(new this._THREE.Vector2());
            pass.setSize && pass.setSize(size.x, size.y);
        }
        render(deltaTime) {
            let maskActive = false;
            for (let i = 0; i < this.passes.length; i++) {
                const pass = this.passes[i];
                if (!pass.enabled) continue;
                pass.renderToScreen = (i === this.passes.length - 1);
                pass.render(this.renderer, this.writeBuffer, this.readBuffer, deltaTime, maskActive);
                if (pass.needsSwap) {
                    const tmp = this.readBuffer;
                    this.readBuffer = this.writeBuffer;
                    this.writeBuffer = tmp;
                }
            }
        }
        setSize(width, height) {
            this.renderTarget1.setSize(width, height);
            this.renderTarget2.setSize(width, height);
            this.passes.forEach(pass => pass.setSize && pass.setSize(width, height));
        }
    },

    // ==========================================
    // SHADERS
    // ==========================================

    /**
     * Bloom shader (simplified UnrealBloom)
     */
    getBloomShader() {
        return {
            uniforms: {
                tDiffuse: { value: null },
                bloomStrength: { value: 0.5 },
                bloomThreshold: { value: 0.85 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float bloomStrength;
                uniform float bloomThreshold;
                varying vec2 vUv;

                void main() {
                    vec4 texel = texture2D(tDiffuse, vUv);
                    float brightness = dot(texel.rgb, vec3(0.2126, 0.7152, 0.0722));
                    vec3 bloom = vec3(0.0);
                    if (brightness > bloomThreshold) {
                        bloom = (texel.rgb - bloomThreshold) * bloomStrength;
                    }
                    // Simple box blur for bloom spread
                    vec2 texelSize = vec2(1.0 / 1920.0, 1.0 / 1080.0);
                    for (int x = -2; x <= 2; x++) {
                        for (int y = -2; y <= 2; y++) {
                            vec4 neighbor = texture2D(tDiffuse, vUv + vec2(float(x), float(y)) * texelSize * 2.0);
                            float nb = dot(neighbor.rgb, vec3(0.2126, 0.7152, 0.0722));
                            if (nb > bloomThreshold) {
                                bloom += (neighbor.rgb - bloomThreshold) * bloomStrength * 0.04;
                            }
                        }
                    }
                    gl_FragColor = vec4(texel.rgb + bloom, texel.a);
                }
            `
        };
    },

    /**
     * Vignette + Color Grading shader
     */
    getVignetteShader() {
        return {
            uniforms: {
                tDiffuse: { value: null },
                damageIntensity: { value: 0.0 },
                saturation: { value: 1.1 },
                contrast: { value: 1.05 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float damageIntensity;
                uniform float saturation;
                uniform float contrast;
                varying vec2 vUv;

                void main() {
                    vec4 texel = texture2D(tDiffuse, vUv);

                    // Subtle always-on vignette for atmosphere
                    float baseVignette = 1.0 - smoothstep(0.4, 1.0, length(vUv - 0.5) * 1.2);

                    // Damage vignette (red edges)
                    float damageVignette = smoothstep(0.3, 0.9, length(vUv - 0.5) * 1.5);
                    vec3 damageColor = vec3(0.9, 0.1, 0.05);

                    // Apply color grading
                    vec3 color = texel.rgb;

                    // Saturation
                    float gray = dot(color, vec3(0.2126, 0.7152, 0.0722));
                    color = mix(vec3(gray), color, saturation);

                    // Contrast
                    color = (color - 0.5) * contrast + 0.5;

                    // Apply vignettes
                    color *= baseVignette * 0.15 + 0.85;
                    color = mix(color, damageColor, damageVignette * damageIntensity);

                    gl_FragColor = vec4(color, texel.a);
                }
            `
        };
    },

    // ==========================================
    // INITIALIZATION
    // ==========================================

    /**
     * Initialize post-processing
     * @param {THREE} THREE - Three.js library
     * @param {THREE.WebGLRenderer} renderer - WebGL renderer
     * @param {THREE.Scene} scene - Scene to render
     * @param {THREE.Camera} camera - Camera for rendering
     * @param {Object} options - Configuration options
     * @returns {Object} Composer and passes for external control
     */
    init(THREE, renderer, scene, camera, options = {}) {
        const {
            bloomStrength = 0.4,
            bloomThreshold = 0.8,
            damageIntensity = 0.0
        } = options;

        this.renderer = renderer;

        // Create composer
        this.composer = new this.EffectComposer(renderer, null, THREE);

        // Render pass
        const renderPass = new this.RenderPass(scene, camera);
        this.composer.addPass(renderPass);

        // Bloom pass
        const bloomShader = this.getBloomShader();
        this.bloomPass = new this.ShaderPass(bloomShader, THREE);
        this.bloomPass.setFullScreenQuad(new this.FullScreenQuad(this.bloomPass.material, THREE));
        this.bloomPass.uniforms.bloomStrength.value = bloomStrength;
        this.bloomPass.uniforms.bloomThreshold.value = bloomThreshold;
        this.composer.addPass(this.bloomPass);

        // Vignette + color grading pass
        const vignetteShader = this.getVignetteShader();
        this.vignettePass = new this.ShaderPass(vignetteShader, THREE);
        this.vignettePass.setFullScreenQuad(new this.FullScreenQuad(this.vignettePass.material, THREE));
        this.vignettePass.uniforms.damageIntensity.value = damageIntensity;
        this.composer.addPass(this.vignettePass);

        return {
            composer: this.composer,
            bloomPass: this.bloomPass,
            vignettePass: this.vignettePass
        };
    },

    /**
     * Render with post-processing
     * @param {number} deltaTime - Time since last frame
     */
    render(deltaTime) {
        if (this.composer) {
            this.composer.render(deltaTime);
        }
    },

    /**
     * Resize post-processing buffers
     * @param {number} width - New width
     * @param {number} height - New height
     */
    setSize(width, height) {
        if (this.composer) {
            this.composer.setSize(width, height);
        }
    },

    // ==========================================
    // EFFECT CONTROLS
    // ==========================================

    /**
     * Set damage vignette intensity
     * @param {number} intensity - Damage intensity (0-1)
     */
    setDamageIntensity(intensity) {
        if (this.vignettePass) {
            this.vignettePass.uniforms.damageIntensity.value = intensity;
        }
    },

    /**
     * Get current damage intensity
     * @returns {number}
     */
    getDamageIntensity() {
        return this.vignettePass ? this.vignettePass.uniforms.damageIntensity.value : 0;
    },

    /**
     * Set bloom strength
     * @param {number} strength - Bloom strength
     */
    setBloomStrength(strength) {
        if (this.bloomPass) {
            this.bloomPass.uniforms.bloomStrength.value = strength;
        }
    },

    /**
     * Set bloom threshold
     * @param {number} threshold - Bloom threshold
     */
    setBloomThreshold(threshold) {
        if (this.bloomPass) {
            this.bloomPass.uniforms.bloomThreshold.value = threshold;
        }
    },

    /**
     * Check if post-processing is enabled
     * @returns {boolean}
     */
    isEnabled() {
        return this.composer !== null;
    },

    /**
     * Reset post-processing state
     */
    reset() {
        if (this.vignettePass) {
            this.vignettePass.uniforms.damageIntensity.value = 0;
        }
    }
};
