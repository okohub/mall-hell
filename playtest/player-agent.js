/**
 * Player Agent - Simulates human-like gameplay based on player profiles
 *
 * Uses the Puppeteer page context to control the game and make decisions
 * like a real player would, based on the assigned profile parameters.
 */

class PlayerAgent {
    constructor(page, profile) {
        this.page = page;
        this.profile = profile;
        this.isRunning = false;
        this.lastDecisionTime = 0;
        this.currentAction = null;
        this.actionEndTime = 0;

        // Agent state
        this.state = {
            isCharging: false,
            chargeStartTime: 0,
            targetChargeTime: 0,
            isMovingLeft: false,
            isMovingRight: false,
            isMovingForward: false,
            lastShotTime: 0,
            targetsCached: [],
            lastTargetUpdate: 0
        };
    }

    // Initialize the agent in the browser context
    async init() {
        // Inject helper functions into the page
        await this.page.evaluate(() => {
            window.__agentHelpers = {
                // Get visible enemies with their screen positions
                getTargets: () => {
                    const targets = [];
                    const enemies = window.enemies || [];
                    const obstacles = window.obstacles || [];
                    const camera = window.camera;

                    if (!camera) return targets;

                    // Get camera world position and direction
                    const camPos = camera.position.clone();
                    const camDir = new THREE.Vector3();
                    camera.getWorldDirection(camDir);

                    // Check enemies
                    for (const enemy of enemies) {
                        if (!enemy.mesh) continue;
                        const pos = enemy.mesh.position;
                        const toEnemy = pos.clone().sub(camPos);
                        const distance = toEnemy.length();
                        const dot = toEnemy.normalize().dot(camDir);

                        // Only include enemies in front of camera
                        if (dot > 0.5 && distance < 100) {
                            targets.push({
                                type: 'enemy',
                                distance,
                                x: pos.x,
                                z: pos.z,
                                health: enemy.health || 3,
                                priority: (100 - distance) + (enemy.health < 3 ? 50 : 0)
                            });
                        }
                    }

                    // Check obstacles
                    for (const obstacle of obstacles) {
                        if (!obstacle.mesh || obstacle.falling) continue;
                        const pos = obstacle.mesh.position;
                        const toObs = pos.clone().sub(camPos);
                        const distance = toObs.length();
                        const dot = toObs.normalize().dot(camDir);

                        if (dot > 0.5 && distance < 80) {
                            targets.push({
                                type: 'obstacle',
                                distance,
                                x: pos.x,
                                z: pos.z,
                                priority: (80 - distance)
                            });
                        }
                    }

                    return targets.sort((a, b) => b.priority - a.priority);
                },

                // Check if there are nearby threats
                getNearbyThreats: () => {
                    const threats = [];
                    const enemies = window.enemies || [];
                    const playerPos = window.playerPosition || { x: 0, z: 0 };

                    for (const enemy of enemies) {
                        if (!enemy.mesh) continue;
                        const pos = enemy.mesh.position;
                        const dx = pos.x - playerPos.x;
                        const dz = pos.z - playerPos.z;
                        const distance = Math.sqrt(dx * dx + dz * dz);

                        if (distance < 15) {
                            threats.push({
                                distance,
                                direction: dx > 0 ? 'right' : 'left',
                                x: pos.x
                            });
                        }
                    }

                    return threats.sort((a, b) => a.distance - b.distance);
                },

                // Get pickups in view
                getPickups: () => {
                    const pickups = [];
                    if (!window.PickupSystem?.activePickups) return pickups;

                    const playerPos = window.playerPosition || { x: 0, z: 0 };

                    for (const pickup of window.PickupSystem.activePickups) {
                        if (!pickup.mesh) continue;
                        const pos = pickup.mesh.position;
                        const dx = pos.x - playerPos.x;
                        const dz = pos.z - playerPos.z;
                        const distance = Math.sqrt(dx * dx + dz * dz);

                        if (distance < 30 && dz < 0) {  // In front of player
                            pickups.push({
                                type: pickup.weaponType,
                                distance,
                                x: pos.x,
                                direction: dx > 0 ? 'right' : 'left'
                            });
                        }
                    }

                    return pickups;
                },

                // Get current game metrics
                getMetrics: () => {
                    return {
                        health: window.playerHealth || 100,
                        score: window.score || 0,
                        position: window.playerPosition || { x: 0, z: 0 },
                        isCharging: window.isChargingSlingshot || false,
                        tension: window.slingshotTension || 0,
                        enemyCount: (window.enemies || []).length,
                        obstacleCount: (window.obstacles || []).length,
                        projectileCount: (window.projectiles || []).length,
                        gameState: window.gameState || 'MENU',
                        gameTimer: window.gameTimer || 0
                    };
                }
            };
        });
    }

    // Start the agent
    async start() {
        this.isRunning = true;
        console.log(`[Agent] Starting ${this.profile.name} player agent`);
    }

    // Stop the agent
    async stop() {
        this.isRunning = false;
        // Release all keys
        await this.releaseAllKeys();
        console.log(`[Agent] Stopped ${this.profile.name} player agent`);
    }

    // Release all held keys
    async releaseAllKeys() {
        await this.page.evaluate(() => {
            ['KeyW', 'KeyA', 'KeyD', 'KeyS', 'Space'].forEach(key => {
                document.dispatchEvent(new KeyboardEvent('keyup', { code: key, bubbles: true }));
            });
        });
        this.state.isCharging = false;
        this.state.isMovingLeft = false;
        this.state.isMovingRight = false;
        this.state.isMovingForward = false;
    }

    // Main decision loop - called repeatedly
    async tick(metrics) {
        if (!this.isRunning) return;

        const now = Date.now();

        // Check reaction time before making decisions
        if (now - this.lastDecisionTime < this.getReactionTime()) {
            return;
        }
        this.lastDecisionTime = now;

        // Get game state
        const gameData = await this.page.evaluate(() => {
            return {
                metrics: window.__agentHelpers.getMetrics(),
                targets: window.__agentHelpers.getTargets(),
                threats: window.__agentHelpers.getNearbyThreats(),
                pickups: window.__agentHelpers.getPickups()
            };
        });

        // Make decisions based on profile
        await this.makeDecisions(gameData, now);
    }

    getReactionTime() {
        const rt = this.profile.reactionTime;
        return rt.min + Math.random() * (rt.max - rt.min);
    }

    async makeDecisions(gameData, now) {
        const { metrics, targets, threats, pickups } = gameData;

        // Priority 1: Handle charging/shooting
        await this.handleCombat(metrics, targets, now);

        // Priority 2: Handle movement/dodging
        await this.handleMovement(metrics, threats, pickups, now);
    }

    async handleCombat(metrics, targets, now) {
        const shooting = this.profile.shooting;
        const decisions = this.profile.decisions;

        // If currently charging, check if we should release
        if (this.state.isCharging) {
            const chargeTime = now - this.state.chargeStartTime;
            if (chargeTime >= this.state.targetChargeTime) {
                await this.fireWeapon();
                return;
            }
            return;  // Keep charging
        }

        // Check cooldown (300ms game cooldown)
        if (now - this.state.lastShotTime < 350) {
            return;
        }

        // Decide whether to shoot
        if (!this.checkProbability(shooting.fireRate)) {
            return;
        }

        // Check if we have targets
        if (targets.length === 0 && decisions.targetPriority !== 'random') {
            return;
        }

        // Panic fire if low health
        if (metrics.health < 30 && shooting.panicFire) {
            await this.startCharging(50);  // Quick shot
            return;
        }

        // Start charging based on profile
        const chargeTime = this.randomInRange(shooting.chargeTime);
        await this.startCharging(chargeTime);
    }

    async startCharging(chargeTime) {
        this.state.isCharging = true;
        this.state.chargeStartTime = Date.now();
        this.state.targetChargeTime = chargeTime;

        await this.page.evaluate(() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
        });
    }

    async fireWeapon() {
        this.state.isCharging = false;
        this.state.lastShotTime = Date.now();

        await this.page.evaluate(() => {
            document.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }));
        });
    }

    async handleMovement(metrics, threats, pickups, now) {
        const movement = this.profile.movement;
        const decisions = this.profile.decisions;

        // Always move forward if profile says so
        if (movement.constantForward && !this.state.isMovingForward) {
            await this.pressKey('KeyW');
            this.state.isMovingForward = true;
        }

        // Handle dodging based on threats
        if (threats.length > 0) {
            const closestThreat = threats[0];

            // Check if we should dodge
            if (this.checkProbability(movement.dodgeChance)) {
                // Dodge away from threat
                const dodgeDirection = closestThreat.direction === 'right' ? 'KeyA' : 'KeyD';
                const currentKey = closestThreat.direction === 'right' ? 'KeyD' : 'KeyA';

                // Release opposite key
                await this.releaseKey(currentKey);
                await this.pressKey(dodgeDirection);

                // Schedule release
                const duration = this.randomInRange(movement.dodgeDuration);
                setTimeout(async () => {
                    if (this.isRunning) {
                        await this.releaseKey(dodgeDirection);
                        this.state.isMovingLeft = false;
                        this.state.isMovingRight = false;
                    }
                }, duration);

                return;
            }
        }

        // Handle pickup collection
        if (pickups.length > 0 && this.checkProbability(decisions.pickupAwareness)) {
            const pickup = pickups[0];
            if (pickup.direction === 'right' && !this.state.isMovingRight) {
                await this.releaseKey('KeyA');
                await this.pressKey('KeyD');
                this.state.isMovingRight = true;
                this.state.isMovingLeft = false;
            } else if (pickup.direction === 'left' && !this.state.isMovingLeft) {
                await this.releaseKey('KeyD');
                await this.pressKey('KeyA');
                this.state.isMovingLeft = true;
                this.state.isMovingRight = false;
            }
            return;
        }

        // Random turning based on profile
        if (this.checkProbability(movement.turnFrequency)) {
            const turnDir = Math.random() > 0.5 ? 'KeyA' : 'KeyD';
            const otherDir = turnDir === 'KeyA' ? 'KeyD' : 'KeyA';

            await this.releaseKey(otherDir);
            await this.pressKey(turnDir);

            const duration = this.randomInRange({ min: 100, max: 400 });
            setTimeout(async () => {
                if (this.isRunning) {
                    await this.releaseKey(turnDir);
                    this.state.isMovingLeft = false;
                    this.state.isMovingRight = false;
                }
            }, duration);
        }
    }

    async pressKey(code) {
        await this.page.evaluate((keyCode) => {
            document.dispatchEvent(new KeyboardEvent('keydown', { code: keyCode, bubbles: true }));
        }, code);
    }

    async releaseKey(code) {
        await this.page.evaluate((keyCode) => {
            document.dispatchEvent(new KeyboardEvent('keyup', { code: keyCode, bubbles: true }));
        }, code);
    }

    randomInRange(range) {
        return range.min + Math.random() * (range.max - range.min);
    }

    checkProbability(chance) {
        return Math.random() < chance;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerAgent;
}
