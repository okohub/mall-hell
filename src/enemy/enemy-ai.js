// ============================================
// ENEMY AI
// ============================================
// Behavior execution (stateless)

const EnemyAI = {
    // Behavior defaults (use Enemy.behaviorDefaults if available)
    get chaseMinDistance() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.CHASE_MIN_DISTANCE : 3; },
    get chaseStuckTimeout() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.CHASE_STUCK_TIMEOUT : 0.45; },
    get chaseProgressEpsilon() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.CHASE_PROGRESS_EPSILON : 0.12; },
    get chaseBypassDuration() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.CHASE_BYPASS_DURATION : 0.9; },
    get chaseBypassDistance() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.CHASE_BYPASS_DISTANCE : 3.2; },
    get chaseBypassForwardBias() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.CHASE_BYPASS_FORWARD_BIAS : 2.0; },
    get chaseReplanCooldown() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.CHASE_REPLAN_COOLDOWN : 0.25; },
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
        data.chaseIsBypassing = false;

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
        if (data.chaseBlockedTimer) {
            data.chaseBlockedTimer = Math.max(0, data.chaseBlockedTimer - dt);
        }
        if (data.chaseReplanCooldown) {
            data.chaseReplanCooldown = Math.max(0, data.chaseReplanCooldown - dt);
        }
        if (data.chaseBypassTimer) {
            data.chaseBypassTimer = Math.max(0, data.chaseBypassTimer - dt);
            if (data.chaseBypassTimer === 0) {
                data.chaseBypassTarget = null;
            }
        }

        // Execute behavior based on LOS
        switch (behavior) {
            case 'chase':
                if (canSeePlayer) {
                    // Can see player - chase with local bypass logic when physically blocked
                    this._behaviorChaseHybrid(enemy, data, playerPos, dt, baseSpeed, {
                        collisionCheck,
                        hasLineOfSight,
                        canSeeTarget: canSeePlayer
                    });
                } else if (data.lastSeenPlayerPos && data.lostSightTimer < this.lostSightTimeout) {
                    // Lost sight recently - move to last known position
                    this._behaviorChaseHybrid(enemy, data, data.lastSeenPlayerPos, dt, baseSpeed * this.lostSightSpeed, {
                        collisionCheck,
                        hasLineOfSight,
                        canSeeTarget: false
                    });
                } else {
                    // No LOS for a while - wander in room
                    data.chaseBypassTarget = null;
                    data.chaseBypassTimer = 0;
                    data.chaseNoProgressTimer = 0;
                    data.chaseLastDistToTarget = null;
                    data.chaseIsBypassing = false;
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

        // Random drift only for non-chase behaviors with LOS.
        // Chase behavior should move directly when LOS is clear.
        const allowDrift = canSeePlayer && behavior !== 'chase';
        if (allowDrift) {
            data.driftTimer = (data.driftTimer || 0) + dt;
            if (data.driftTimer > config.driftInterval) {
                data.driftTimer = 0;
                data.driftSpeed = (Math.random() - 0.5) * config.driftSpeed;
            }
            position.x += (data.driftSpeed || 0) * dt;
        } else if (behavior === 'chase') {
            data.driftTimer = 0;
            data.driftSpeed = 0;
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
            if ((collision.blockedX || collision.blockedZ) && behavior === 'chase') {
                data.chaseBlockedTimer = Math.max(data.chaseBlockedTimer || 0, this.chaseStuckTimeout);
                data.chaseNoProgressTimer = Math.max(data.chaseNoProgressTimer || 0, this.chaseStuckTimeout);
                data.chaseBypassTarget = null;
                data.chaseBypassTimer = 0;
                data.chaseReplanCooldown = 0;
                data.chaseStrafeSign = (data.chaseStrafeSign || 1) * -1;
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
     * Distance helper in X/Z plane
     */
    _distance2D(a, b) {
        const dx = (b.x - a.x);
        const dz = (b.z - a.z);
        return Math.sqrt(dx * dx + dz * dz);
    },

    /**
     * Move position toward target in X/Z plane by speed*dt, clamped to target.
     */
    _moveTowards2D(position, target, speed, dt) {
        const dx = target.x - position.x;
        const dz = target.z - position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 0.001) return dist;

        const step = Math.min(speed * dt, dist);
        position.x += (dx / dist) * step;
        position.z += (dz / dist) * step;
        return dist;
    },

    /**
     * Choose a local bypass waypoint to route around blockers.
     */
    _pickChaseBypassTarget(position, targetPos, data, aiOptions = {}) {
        const { collisionCheck = null, hasLineOfSight = null } = aiOptions;
        const toTargetX = targetPos.x - position.x;
        const toTargetZ = targetPos.z - position.z;
        const toTargetDist = Math.sqrt(toTargetX * toTargetX + toTargetZ * toTargetZ);
        if (toTargetDist < 0.001) return null;

        const nx = toTargetX / toTargetDist;
        const nz = toTargetZ / toTargetDist;
        const leftX = -nz;
        const leftZ = nx;

        const preferredSign = (typeof data.chaseStrafeSign === 'number' && data.chaseStrafeSign !== 0)
            ? Math.sign(data.chaseStrafeSign)
            : (Math.random() < 0.5 ? -1 : 1);
        const signOrder = [preferredSign, -preferredSign];
        const sideBase = this.chaseBypassDistance;
        const sideMultipliers = [1, 1.35];
        const forwardBias = this.chaseBypassForwardBias;
        const candidates = [];

        signOrder.forEach((sign) => {
            sideMultipliers.forEach((multiplier) => {
                const side = sideBase * multiplier;
                const candidate = {
                    x: position.x + leftX * side * sign + nx * forwardBias,
                    z: position.z + leftZ * side * sign + nz * forwardBias
                };

                if (collisionCheck) {
                    const probe = collisionCheck(candidate.x, candidate.z, position.x, position.z);
                    // Allow candidates with one free axis so chase can slide around blockers.
                    if (probe?.blockedX && probe?.blockedZ) return;
                }

                const opensLOS = hasLineOfSight
                    ? !!hasLineOfSight(candidate.x, candidate.z, targetPos.x, targetPos.z)
                    : true;
                const distToTarget = this._distance2D(candidate, targetPos);
                candidates.push({ candidate, sign, opensLOS, distToTarget });
            });
        });

        if (candidates.length === 0) return null;

        candidates.sort((a, b) => {
            if (a.opensLOS !== b.opensLOS) return a.opensLOS ? -1 : 1;
            return a.distToTarget - b.distToTarget;
        });

        const best = candidates[0];
        data.chaseStrafeSign = best.sign;
        return best.candidate;
    },

    /**
     * Chase with local bypass steering when direct pursuit is blocked.
     */
    _behaviorChaseHybrid(enemy, data, targetPos, dt, baseSpeed, aiOptions = {}) {
        const position = enemy.position;
        const config = enemy.config || data.config || {};
        const speed = baseSpeed * (config.speed || 0);
        const distToTarget = this._distance2D(position, targetPos);

        if (speed <= 0 || distToTarget <= this.chaseMinDistance) {
            data.chaseBypassTarget = null;
            data.chaseBypassTimer = 0;
            data.chaseNoProgressTimer = 0;
            data.chaseLastDistToTarget = distToTarget;
            data.chaseIsBypassing = false;
            return;
        }

        const hasLineOfSight = aiOptions.hasLineOfSight || null;
        const collisionCheck = aiOptions.collisionCheck || null;
        const canSeeTarget = (typeof aiOptions.canSeeTarget === 'boolean')
            ? aiOptions.canSeeTarget
            : (hasLineOfSight ? hasLineOfSight(position.x, position.z, targetPos.x, targetPos.z) : true);

        // Probe one direct chase step; LOS may be clear while immediate movement is still blocked.
        let directStepBlocked = false;
        if (canSeeTarget && collisionCheck && distToTarget > 0.001) {
            const step = Math.min(speed * dt, distToTarget);
            const dirX = (targetPos.x - position.x) / distToTarget;
            const dirZ = (targetPos.z - position.z) / distToTarget;
            const probeX = position.x + dirX * step;
            const probeZ = position.z + dirZ * step;
            const probe = collisionCheck(probeX, probeZ, position.x, position.z);
            directStepBlocked = !!(probe?.blocked || probe?.blockedX || probe?.blockedZ);
        }

        if (typeof data.chaseLastDistToTarget === 'number') {
            const progress = data.chaseLastDistToTarget - distToTarget;
            // Scale progress floor by frame step to avoid false "stuck" detection at high FPS.
            const expectedStep = speed * dt;
            const minProgress = Math.min(this.chaseProgressEpsilon, Math.max(0.01, expectedStep * 0.35));
            if (progress < minProgress) {
                data.chaseNoProgressTimer = (data.chaseNoProgressTimer || 0) + dt;
            } else {
                data.chaseNoProgressTimer = Math.max(0, (data.chaseNoProgressTimer || 0) - dt * 0.5);
            }
        } else {
            data.chaseNoProgressTimer = 0;
        }
        data.chaseLastDistToTarget = distToTarget;

        let bypassActive = !!data.chaseBypassTarget && (data.chaseBypassTimer || 0) > 0;
        if (bypassActive && this._distance2D(position, data.chaseBypassTarget) < 0.45) {
            data.chaseBypassTarget = null;
            data.chaseBypassTimer = 0;
            data.chaseReplanCooldown = this.chaseReplanCooldown;
            bypassActive = false;
        }

        const shouldBypass = !canSeeTarget
            || directStepBlocked
            || (data.chaseBlockedTimer || 0) > 0
            || (data.chaseNoProgressTimer || 0) >= this.chaseStuckTimeout;

        if (!bypassActive && shouldBypass && (data.chaseReplanCooldown || 0) <= 0) {
            const bypassTarget = this._pickChaseBypassTarget(position, targetPos, data, aiOptions);
            if (bypassTarget) {
                data.chaseBypassTarget = bypassTarget;
                data.chaseBypassTimer = this.chaseBypassDuration;
                data.chaseBlockedTimer = 0;
                data.chaseNoProgressTimer = 0;
                bypassActive = true;
            } else {
                // No viable bypass this frame: briefly wander and retry soon.
                data.chaseBypassTarget = null;
                data.chaseBypassTimer = 0;
                data.chaseReplanCooldown = this.chaseReplanCooldown;
                data.chaseIsBypassing = false;
                this._behaviorWander(enemy, data, Math.min(dt, 0.12), baseSpeed);
                return;
            }
        }

        if (bypassActive && canSeeTarget && !directStepBlocked && (data.chaseBlockedTimer || 0) <= 0) {
            data.chaseBypassTarget = null;
            data.chaseBypassTimer = 0;
            bypassActive = false;
        }

        if (bypassActive && data.chaseBypassTarget) {
            this._moveTowards2D(position, data.chaseBypassTarget, speed, dt);
            data.chaseIsBypassing = true;
        } else {
            this._moveTowards2D(position, targetPos, speed, dt);
            data.chaseIsBypassing = false;
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
