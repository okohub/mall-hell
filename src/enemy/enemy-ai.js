// ============================================
// ENEMY AI
// ============================================
// Behavior execution (stateless)

const EnemyAI = {
    // Behavior defaults (use Enemy.behaviorDefaults if available)
    get chaseMinDistance() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.CHASE_MIN_DISTANCE : 3; },
    get lostSightTimeout() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.LOST_SIGHT_TIMEOUT : 2; },
    get lostSightSpeed() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.LOST_SIGHT_SPEED : 0.5; },
    get wanderInterval() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.WANDER_INTERVAL : 2; },
    get wanderSpeed() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.WANDER_SPEED : 0.15; },
    get patrolSpeed() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.PATROL_SPEED : 0.2; },
    get homeReturnSpeed() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.HOME_RETURN_SPEED : 0.25; },
    get homeRadius() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.HOME_RADIUS : 8; },
    get searchLastSeenChance() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.SEARCH_LAST_SEEN_CHANCE : 0.4; },
    get fleeMinDistance() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.FLEE_MIN_DISTANCE : 10; },
    get fleeStopDistance() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.FLEE_STOP_DISTANCE : 16; },
    get fleeSpeedMult() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.FLEE_SPEED_MULT : 1.4; },

    /**
     * Update enemy AI behavior
     * @param {Object} enemy - Enemy to update (can be instance data OR THREE.Group mesh)
     * @param {Object} playerPos - Player position
     * @param {number} dt - Delta time
     * @param {number} baseSpeed - Base movement speed
     * @param {Object} [aiOptions] - AI options {collisionCheck, hasLineOfSight}
     */
    updateBehavior(enemy, playerPos, dt, baseSpeed, aiOptions = {}) {
        if (!enemy) return;

        const { collisionCheck = null, hasLineOfSight = null } = aiOptions;

        // Support both instance data and THREE.Group meshes
        const data = enemy.userData || enemy;
        if (!data.active) return;

        const config = data.config;
        if (!config) return;

        const behavior = config.behavior;
        const position = enemy.position;
        const oldX = position.x;
        const oldZ = position.z;

        // Check line of sight to player
        const canSeePlayer = hasLineOfSight
            ? hasLineOfSight(position.x, position.z, playerPos.x, playerPos.z)
            : true; // Default to true if no LOS check provided

        // Track LOS state for smooth behavior transitions
        if (canSeePlayer) {
            data.lastSeenPlayerPos = { x: playerPos.x, z: playerPos.z };
            data.lostSightTimer = 0;
        } else {
            data.lostSightTimer = (data.lostSightTimer || 0) + dt;
        }

        // Decay flee block timer (used to avoid walls/obstacles when fleeing)
        if (data.fleeBlockedTimer) {
            data.fleeBlockedTimer = Math.max(0, data.fleeBlockedTimer - dt);
        }

        // Execute behavior based on LOS
        switch (behavior) {
            case 'chase':
                if (canSeePlayer) {
                    // Can see player - chase directly
                    this._behaviorChase({ position, config }, playerPos, dt, baseSpeed);
                } else if (data.lastSeenPlayerPos && data.lostSightTimer < this.lostSightTimeout) {
                    // Lost sight recently - move to last known position
                    this._behaviorChase({ position, config }, data.lastSeenPlayerPos, dt, baseSpeed * this.lostSightSpeed);
                } else {
                    // No LOS for a while - wander in room
                    this._behaviorWander(enemy, data, dt, baseSpeed);
                }
                break;
            case 'flee':
                if (data.fleeBlockedTimer > 0) {
                    // If just hit a wall/obstacle, wander briefly to find a new path
                    this._behaviorWander(enemy, data, dt, baseSpeed);
                } else {
                    this._behaviorFlee(enemy, data, playerPos, dt, baseSpeed);
                }
                break;
            case 'patrol':
                this._behaviorPatrol({ position, config, patrolTimer: data.patrolTimer || 0 }, playerPos, dt, baseSpeed);
                data.patrolTimer = (data.patrolTimer || 0) + dt;
                break;
            case 'stationary':
                // Does nothing
                break;
            default:
                if (canSeePlayer) {
                    this._behaviorChase({ position, config }, playerPos, dt, baseSpeed);
                } else {
                    this._behaviorWander(enemy, data, dt, baseSpeed);
                }
        }

        // Random drift only when can see player (adds unpredictability to chase)
        if (canSeePlayer) {
            data.driftTimer = (data.driftTimer || 0) + dt;
            if (data.driftTimer > config.driftInterval) {
                data.driftTimer = 0;
                data.driftSpeed = (Math.random() - 0.5) * config.driftSpeed;
            }
            position.x += (data.driftSpeed || 0) * dt;
        }

        // Wall collision check - revert movement if blocked
        if (collisionCheck) {
            const collision = collisionCheck(position.x, position.z, oldX, oldZ);
            if (collision.blockedX) {
                position.x = oldX;
                data.driftSpeed = -(data.driftSpeed || 0);
                data.wanderDirX = -(data.wanderDirX || 0); // Reverse wander direction
            }
            if (collision.blockedZ) {
                position.z = oldZ;
                data.wanderDirZ = -(data.wanderDirZ || 0);
            }
            if ((collision.blockedX || collision.blockedZ) && behavior === 'flee') {
                data.fleeBlockedTimer = 0.6;
            }
        }

        // Update mesh position if this is instance data with a mesh reference
        if (enemy.mesh) {
            enemy.mesh.position.set(position.x, 0, position.z);
        }
    },

    /**
     * Chase behavior - move towards target
     */
    _behaviorChase(enemy, targetPos, dt, baseSpeed) {
        const position = enemy.position;
        const toTarget = {
            x: targetPos.x - position.x,
            z: targetPos.z - position.z
        };
        const dist = Math.sqrt(toTarget.x * toTarget.x + toTarget.z * toTarget.z);

        if (dist > this.chaseMinDistance) {
            const nx = toTarget.x / dist;
            const nz = toTarget.z / dist;
            const speed = baseSpeed * enemy.config.speed;
            position.x += nx * speed * dt;
            position.z += nz * speed * dt;
        }
    },

    /**
     * Wander behavior - smart movement when can't see player
     * Priorities: 1) Return home if too far, 2) Search last seen position, 3) Random wander
     */
    _behaviorWander(enemy, data, dt, baseSpeed) {
        const position = enemy.position;

        // Get spawn position (home) - from userData or data
        const home = data.spawnPosition || enemy.userData?.spawnPosition || position;

        // Calculate distance from home
        const dxHome = position.x - home.x;
        const dzHome = position.z - home.z;
        const distFromHome = Math.sqrt(dxHome * dxHome + dzHome * dzHome);

        // Priority 1: Return home if too far
        if (distFromHome > this.homeRadius) {
            const nx = -dxHome / distFromHome;
            const nz = -dzHome / distFromHome;
            const speed = baseSpeed * this.homeReturnSpeed;
            position.x += nx * speed * dt;
            position.z += nz * speed * dt;
            return;
        }

        // Priority 2: Occasionally move towards last seen player position
        if (data.lastSeenPlayerPos && Math.random() < this.searchLastSeenChance * dt) {
            const dx = data.lastSeenPlayerPos.x - position.x;
            const dz = data.lastSeenPlayerPos.z - position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist > 2) {
                data.wanderDirX = dx / dist;
                data.wanderDirZ = dz / dist;
                data.wanderTimer = 0;
            }
        }

        // Priority 3: Random wander (change direction periodically)
        data.wanderTimer = (data.wanderTimer || 0) + dt;
        if (!data.wanderDirX || !data.wanderDirZ || data.wanderTimer > this.wanderInterval) {
            data.wanderTimer = 0;
            const angle = Math.random() * Math.PI * 2;
            data.wanderDirX = Math.cos(angle);
            data.wanderDirZ = Math.sin(angle);
        }

        // Move slowly in wander direction
        const wanderSpeed = baseSpeed * this.wanderSpeed;
        position.x += data.wanderDirX * wanderSpeed * dt;
        position.z += data.wanderDirZ * wanderSpeed * dt;
    },

    /**
     * Flee behavior - move away from player, wander when far enough
     */
    _behaviorFlee(enemy, data, playerPos, dt, baseSpeed) {
        const position = enemy.position;
        const dx = position.x - playerPos.x;
        const dz = position.z - playerPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > this.fleeStopDistance) {
            this._behaviorWander(enemy, data, dt, baseSpeed);
            return;
        }

        if (dist < 0.001) return;

        const nx = dx / dist;
        const nz = dz / dist;
        const panicBoost = dist < this.fleeMinDistance ? 1.15 : 1.0;
        const speed = baseSpeed * data.config.speed * this.fleeSpeedMult * panicBoost;

        position.x += nx * speed * dt;
        position.z += nz * speed * dt;
    },

    /**
     * Patrol behavior - move back and forth
     */
    _behaviorPatrol(enemy, playerPos, dt, baseSpeed) {
        const dir = Math.sin(enemy.patrolTimer) > 0 ? 1 : -1;
        enemy.position.x += dir * baseSpeed * this.patrolSpeed * dt;
    }
};
