/**
 * Metrics Collector - Gathers comprehensive gameplay data during playtesting
 *
 * Tracks performance, gameplay events, player behavior, and game balance metrics.
 */

class MetricsCollector {
    constructor() {
        this.reset();
    }

    reset() {
        this.sessionStart = Date.now();
        this.sessionEnd = null;

        // Performance metrics
        this.performance = {
            fpsSamples: [],
            frameTimeSamples: [],
            memorySnapshots: [],
            entityCounts: []
        };

        // Score tracking
        this.score = {
            timeline: [],           // {time, score, event}
            finalScore: 0,
            peakScore: 0,
            scorePerMinute: 0
        };

        // Combat metrics
        this.combat = {
            shotsFired: 0,
            shotsHit: 0,
            enemiesKilled: 0,
            obstaclesHit: 0,
            totalDamageDealt: 0,
            averageChargePower: 0,
            chargePowers: []
        };

        // Survival metrics
        this.survival = {
            damageTaken: 0,
            damageEvents: [],       // {time, amount, source, healthAfter}
            deaths: 0,
            deathCauses: [],
            timeAtLowHealth: 0,     // Time spent below 30% health
            timeInvulnerable: 0,
            healthTimeline: []      // {time, health}
        };

        // Movement metrics
        this.movement = {
            totalDistance: 0,
            lateralMovement: 0,
            wallBumps: 0,
            averageSpeed: 0,
            positionSamples: []
        };

        // Input metrics
        this.input = {
            keyPresses: {},
            inputsPerSecond: [],
            reactionTimes: [],
            inputGaps: []           // Time between inputs
        };

        // Game flow metrics
        this.flow = {
            pauseCount: 0,
            totalPauseTime: 0,
            gameCompletionPercent: 0,
            endCondition: null      // 'completed', 'died', 'quit'
        };

        // Weapon metrics
        this.weapons = {
            pickupsCollected: [],
            weaponUsage: {},        // {weaponName: {shots, hits, time}}
            currentWeapon: 'slingshot',
            switchCount: 0
        };

        // Difficulty indicators
        this.difficulty = {
            enemyDensity: [],       // Enemies on screen over time
            closeCallCount: 0,      // Near misses (enemy within 5 units)
            overwhelmedTime: 0      // Time with 5+ enemies on screen
        };

        // Events log
        this.events = [];
    }

    // Start a new collection session
    startSession() {
        this.reset();
        this.sessionStart = Date.now();
        this.logEvent('session_start', {});
    }

    // End the session
    endSession(endCondition) {
        this.sessionEnd = Date.now();
        this.flow.endCondition = endCondition;
        this.logEvent('session_end', { condition: endCondition });
        this.calculateFinalMetrics();
    }

    // Log a timestamped event
    logEvent(type, data) {
        this.events.push({
            time: Date.now() - this.sessionStart,
            type,
            data
        });
    }

    // Sample current game state (called every frame or at interval)
    sample(gameState) {
        const time = Date.now() - this.sessionStart;

        // Performance sampling
        if (gameState.fps !== undefined) {
            this.performance.fpsSamples.push({ time, value: gameState.fps });
        }
        if (gameState.frameTime !== undefined) {
            this.performance.frameTimeSamples.push({ time, value: gameState.frameTime });
        }
        if (gameState.memory !== undefined) {
            this.performance.memorySnapshots.push({ time, value: gameState.memory });
        }

        // Entity counts
        this.performance.entityCounts.push({
            time,
            enemies: gameState.enemyCount || 0,
            obstacles: gameState.obstacleCount || 0,
            projectiles: gameState.projectileCount || 0
        });

        // Health tracking
        if (gameState.health !== undefined) {
            this.survival.healthTimeline.push({ time, health: gameState.health });

            // Track time at low health
            if (gameState.health < 30) {
                this.survival.timeAtLowHealth += gameState.dt || 16;
            }
        }

        // Position tracking
        if (gameState.position) {
            this.movement.positionSamples.push({
                time,
                x: gameState.position.x,
                z: gameState.position.z
            });
        }

        // Difficulty tracking
        const enemyCount = gameState.enemyCount || 0;
        this.difficulty.enemyDensity.push({ time, count: enemyCount });
        if (enemyCount >= 5) {
            this.difficulty.overwhelmedTime += gameState.dt || 16;
        }

        // Score tracking
        if (gameState.score !== undefined && gameState.score !== this.score.finalScore) {
            this.score.timeline.push({ time, score: gameState.score });
            this.score.finalScore = gameState.score;
            if (gameState.score > this.score.peakScore) {
                this.score.peakScore = gameState.score;
            }
        }
    }

    // Record a shot fired
    recordShot(chargePower, weaponType = 'slingshot') {
        this.combat.shotsFired++;
        this.combat.chargePowers.push(chargePower);
        this.logEvent('shot_fired', { charge: chargePower, weapon: weaponType });

        // Track weapon usage
        if (!this.weapons.weaponUsage[weaponType]) {
            this.weapons.weaponUsage[weaponType] = { shots: 0, hits: 0, time: 0 };
        }
        this.weapons.weaponUsage[weaponType].shots++;
    }

    // Record a hit
    recordHit(targetType, points, weaponType = 'slingshot') {
        this.combat.shotsHit++;
        if (targetType === 'enemy') {
            this.combat.totalDamageDealt++;
        } else if (targetType === 'obstacle') {
            this.combat.obstaclesHit++;
        }
        this.logEvent('hit', { target: targetType, points, weapon: weaponType });

        if (this.weapons.weaponUsage[weaponType]) {
            this.weapons.weaponUsage[weaponType].hits++;
        }
    }

    // Record enemy killed
    recordEnemyKill() {
        this.combat.enemiesKilled++;
        this.logEvent('enemy_killed', {});
    }

    // Record damage taken
    recordDamage(amount, source, healthAfter) {
        this.survival.damageTaken += amount;
        this.survival.damageEvents.push({
            time: Date.now() - this.sessionStart,
            amount,
            source,
            healthAfter
        });
        this.logEvent('damage_taken', { amount, source, healthAfter });

        if (healthAfter <= 0) {
            this.survival.deaths++;
            this.survival.deathCauses.push(source);
            this.logEvent('player_died', { cause: source });
        }
    }

    // Record wall bump
    recordWallBump() {
        this.movement.wallBumps++;
        this.logEvent('wall_bump', {});
    }

    // Record close call with enemy
    recordCloseCall(distance) {
        this.difficulty.closeCallCount++;
        this.logEvent('close_call', { distance });
    }

    // Record weapon pickup
    recordPickup(weaponType) {
        this.weapons.pickupsCollected.push({
            time: Date.now() - this.sessionStart,
            weapon: weaponType
        });
        this.weapons.switchCount++;
        this.weapons.currentWeapon = weaponType;
        this.logEvent('pickup_collected', { weapon: weaponType });
    }

    // Record input
    recordInput(inputType, duration = null) {
        if (!this.input.keyPresses[inputType]) {
            this.input.keyPresses[inputType] = 0;
        }
        this.input.keyPresses[inputType]++;
        this.logEvent('input', { type: inputType, duration });
    }

    // Record pause
    recordPause() {
        this.flow.pauseCount++;
        this.logEvent('pause', {});
    }

    // Calculate final metrics after session ends
    calculateFinalMetrics() {
        const duration = (this.sessionEnd - this.sessionStart) / 1000; // seconds

        // Score per minute
        if (duration > 0) {
            this.score.scorePerMinute = (this.score.finalScore / duration) * 60;
        }

        // Average charge power
        if (this.combat.chargePowers.length > 0) {
            this.combat.averageChargePower =
                this.combat.chargePowers.reduce((a, b) => a + b, 0) /
                this.combat.chargePowers.length;
        }

        // Hit accuracy
        this.combat.accuracy = this.combat.shotsFired > 0
            ? this.combat.shotsHit / this.combat.shotsFired
            : 0;

        // Average FPS
        if (this.performance.fpsSamples.length > 0) {
            this.performance.averageFps =
                this.performance.fpsSamples.reduce((a, b) => a + b.value, 0) /
                this.performance.fpsSamples.length;
            this.performance.minFps = Math.min(...this.performance.fpsSamples.map(s => s.value));
            this.performance.maxFps = Math.max(...this.performance.fpsSamples.map(s => s.value));
        }

        // Movement distance
        if (this.movement.positionSamples.length > 1) {
            let totalDist = 0;
            let lateralDist = 0;
            for (let i = 1; i < this.movement.positionSamples.length; i++) {
                const prev = this.movement.positionSamples[i - 1];
                const curr = this.movement.positionSamples[i];
                const dx = curr.x - prev.x;
                const dz = curr.z - prev.z;
                totalDist += Math.sqrt(dx * dx + dz * dz);
                lateralDist += Math.abs(dx);
            }
            this.movement.totalDistance = totalDist;
            this.movement.lateralMovement = lateralDist;
            this.movement.averageSpeed = totalDist / duration;
        }

        // Game completion percentage
        if (this.movement.positionSamples.length > 0) {
            const lastZ = this.movement.positionSamples[this.movement.positionSamples.length - 1].z;
            this.flow.gameCompletionPercent = Math.min(100, Math.abs(lastZ / 800) * 100);
        }

        // Average enemy density
        if (this.difficulty.enemyDensity.length > 0) {
            this.difficulty.averageEnemyDensity =
                this.difficulty.enemyDensity.reduce((a, b) => a + b.count, 0) /
                this.difficulty.enemyDensity.length;
        }

        // Session duration
        this.flow.duration = duration;
    }

    // Generate a summary report
    generateReport() {
        return {
            session: {
                duration: this.flow.duration,
                endCondition: this.flow.endCondition,
                completionPercent: this.flow.gameCompletionPercent.toFixed(1)
            },
            score: {
                final: this.score.finalScore,
                peak: this.score.peakScore,
                perMinute: Math.round(this.score.scorePerMinute)
            },
            combat: {
                shotsFired: this.combat.shotsFired,
                shotsHit: this.combat.shotsHit,
                accuracy: (this.combat.accuracy * 100).toFixed(1) + '%',
                enemiesKilled: this.combat.enemiesKilled,
                obstaclesHit: this.combat.obstaclesHit,
                averageCharge: (this.combat.averageChargePower * 100).toFixed(0) + '%'
            },
            survival: {
                totalDamage: this.survival.damageTaken,
                damageEvents: this.survival.damageEvents.length,
                deaths: this.survival.deaths,
                timeAtLowHealth: (this.survival.timeAtLowHealth / 1000).toFixed(1) + 's'
            },
            movement: {
                totalDistance: Math.round(this.movement.totalDistance),
                lateralMovement: Math.round(this.movement.lateralMovement),
                wallBumps: this.movement.wallBumps,
                averageSpeed: this.movement.averageSpeed.toFixed(1)
            },
            performance: {
                averageFps: this.performance.averageFps?.toFixed(1) || 'N/A',
                minFps: this.performance.minFps?.toFixed(1) || 'N/A',
                maxFps: this.performance.maxFps?.toFixed(1) || 'N/A'
            },
            difficulty: {
                averageEnemyDensity: this.difficulty.averageEnemyDensity?.toFixed(1) || '0',
                closeCalls: this.difficulty.closeCallCount,
                overwhelmedTime: (this.difficulty.overwhelmedTime / 1000).toFixed(1) + 's'
            },
            weapons: {
                pickups: this.weapons.pickupsCollected.length,
                switches: this.weapons.switchCount,
                usage: this.weapons.weaponUsage
            },
            events: {
                total: this.events.length,
                byType: this.countEventsByType()
            }
        };
    }

    countEventsByType() {
        const counts = {};
        for (const event of this.events) {
            counts[event.type] = (counts[event.type] || 0) + 1;
        }
        return counts;
    }

    // Export raw data for detailed analysis
    exportRawData() {
        return {
            performance: this.performance,
            score: this.score,
            combat: this.combat,
            survival: this.survival,
            movement: this.movement,
            input: this.input,
            flow: this.flow,
            weapons: this.weapons,
            difficulty: this.difficulty,
            events: this.events
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MetricsCollector;
}
