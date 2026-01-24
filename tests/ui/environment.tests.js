/**
 * Environment UI Tests
 * Tests for Visual Rendering, Shelves, Scene objects
 */

(function(runner) {
    'use strict';

    // Visual Rendering Tests
    runner.addTest('visual-canvas-exists', 'Visual Rendering', 'Canvas element exists',
        'Verifies the Three.js canvas element is present in the DOM',
        async () => {
            runner.resetGame();
            await runner.wait(200);
            const canvas = runner.gameDocument.querySelector('canvas');
            if (!canvas) {
                throw new Error('Canvas element not found');
            }
            if (canvas.width === 0 || canvas.height === 0) {
                throw new Error('Canvas has zero dimensions');
            }
        }
    );

    runner.addTest('visual-canvas-renders', 'Visual Rendering', 'Renderer has made draw calls',
        'Verifies the renderer is actively drawing content',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(300);

            const renderer = runner.gameWindow.renderer;
            if (!renderer) throw new Error('Renderer not found');

            const info = renderer.info;
            if (!info) throw new Error('Renderer info not available');

            if (info.render.triangles === 0) {
                throw new Error('Renderer has not drawn any triangles');
            }

            const scene = runner.gameWindow.scene;
            if (!scene || scene.children.length < 3) {
                throw new Error('Scene appears empty or has too few objects');
            }
        }
    );

    runner.addTest('visual-scene-has-objects', 'Visual Rendering', 'Scene contains 3D objects',
        'Verifies the Three.js scene has objects (environment, cart, etc)',
        async () => {
            runner.resetGame();
            await runner.wait(200);

            const scene = runner.gameWindow.scene;
            if (!scene) throw new Error('Scene not found');

            if (scene.children.length < 5) {
                throw new Error(`Scene has too few objects: ${scene.children.length}`);
            }
        }
    );

    runner.addTest('visual-renderer-works', 'Visual Rendering', 'Renderer is functioning',
        'Verifies the WebGL renderer is initialized and working',
        async () => {
            runner.resetGame();
            await runner.wait(200);

            const renderer = runner.gameWindow.renderer;
            if (!renderer) throw new Error('Renderer not found');

            const info = renderer.info;
            if (!info) throw new Error('Renderer info not available');

            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(300);

            if (info.render.calls === 0) {
                throw new Error('Renderer has not made any draw calls');
            }
        }
    );

    runner.addTest('visual-camera-positioned', 'Visual Rendering', 'Camera is properly positioned',
        'Verifies camera position is valid (not at origin, inside scene)',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);

            const camera = runner.gameWindow.camera;
            if (!camera) throw new Error('Camera not found');

            if (camera.position.y < 1) {
                throw new Error(`Camera too low: y=${camera.position.y}`);
            }

            if (!camera.projectionMatrix || camera.projectionMatrix.elements[0] === 0) {
                throw new Error('Camera projection matrix not set');
            }
        }
    );

    runner.addTest('visual-animation-running', 'Visual Rendering', 'Animation loop is running',
        'Verifies the game animation loop is active and updating',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(100);

            const camera = runner.gameWindow.camera;
            const initialZ = camera.position.z;

            await runner.wait(300);

            const newZ = camera.position.z;
            if (Math.abs(newZ - initialZ) < 0.1) {
                throw new Error('Animation not running - camera position unchanged');
            }
        }
    );

    // Shelf Design Tests
    runner.addTest('shelf-has-products', 'Shelf Design', 'Shelves have product items',
        'Verifies that shelf units contain product meshes',
        async () => {
            runner.resetGame();
            await runner.wait(200);

            const scene = runner.gameWindow.scene;
            if (!scene) throw new Error('Scene not found');

            let shelfFound = false;
            scene.traverse((obj) => {
                if (obj.children && obj.children.length > 10) {
                    shelfFound = true;
                }
            });

            if (!shelfFound) {
                throw new Error('No shelf structures found with products');
            }
        }
    );

})(window.runner);
