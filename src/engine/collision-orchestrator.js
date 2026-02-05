// ============================================
// COLLISION SYSTEM - Collision Detection Utilities
// ============================================
// Pure utility functions for collision detection.
// No dependencies - works with plain position objects.

const CollisionOrchestrator = {
    // Config getters (use Engine.defaults.collision if available)
    get config() {
        return (typeof Engine !== 'undefined' && Engine.defaults && Engine.defaults.collision)
            ? Engine.defaults.collision
            : {
                enemyQuickCheckDist: 100,
                obstacleQuickCheckDist: 64,
                enemyHitboxYOffset: 1.2,
                enemyHitRadius: 2.5,
                obstacleHitYFactor: 0.4,
                obstacleHitRadiusFactor: 0.8,
                defaultHitRadius: 2,
                defaultObstacleHeight: 2,
                defaultObstacleWidth: 2,
                losRayStepSize: 2,
                losDoorTolerance: 1
            };
    },
    // ==========================================
    // DISTANCE-BASED COLLISION
    // ==========================================

    /**
     * Check if two 2D positions are within a radius (XZ plane)
     * @param {Object} pos1 - First position {x, z}
     * @param {Object} pos2 - Second position {x, z}
     * @param {number} radius - Collision radius
     * @returns {boolean}
     */
    checkDistance2D(pos1, pos2, radius) {
        const dx = pos1.x - pos2.x;
        const dz = pos1.z - pos2.z;
        return (dx * dx + dz * dz) <= (radius * radius);
    },

    /**
     * Calculate squared 2D distance (for efficient comparisons)
     * @param {Object} pos1 - First position {x, z}
     * @param {Object} pos2 - Second position {x, z}
     * @returns {number} Squared distance
     */
    distance2DSquared(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dz = pos1.z - pos2.z;
        return dx * dx + dz * dz;
    },

    /**
     * Calculate 2D distance
     * @param {Object} pos1 - First position {x, z}
     * @param {Object} pos2 - Second position {x, z}
     * @returns {number} Distance
     */
    distance2D(pos1, pos2) {
        return Math.sqrt(this.distance2DSquared(pos1, pos2));
    },

    /**
     * Check if two 3D positions are within a radius
     * @param {Object} pos1 - First position {x, y, z}
     * @param {Object} pos2 - Second position {x, y, z}
     * @param {number} radius - Collision radius
     * @returns {boolean}
     */
    checkDistance3D(pos1, pos2, radius) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return (dx * dx + dy * dy + dz * dz) <= (radius * radius);
    },

    /**
     * Calculate squared 3D distance
     * @param {Object} pos1 - First position {x, y, z}
     * @param {Object} pos2 - Second position {x, y, z}
     * @returns {number} Squared distance
     */
    distance3DSquared(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return dx * dx + dy * dy + dz * dz;
    },

    /**
     * Calculate 3D distance
     * @param {Object} pos1 - First position {x, y, z}
     * @param {Object} pos2 - Second position {x, y, z}
     * @returns {number} Distance
     */
    distance3D(pos1, pos2) {
        return Math.sqrt(this.distance3DSquared(pos1, pos2));
    },

    // ==========================================
    // SWEEP COLLISION (Moving objects)
    // ==========================================

    /**
     * Sweep test for a moving sphere against a static point
     * Good for detecting fast-moving projectiles
     * @param {Object} prevPos - Previous position {x, y, z}
     * @param {Object} currPos - Current position {x, y, z}
     * @param {Object} targetPos - Target position {x, y, z}
     * @param {number} radius - Combined collision radius
     * @returns {Object|null} Hit info {t, point} or null if no hit
     */
    sweepSphere(prevPos, currPos, targetPos, radius) {
        // Direction and length of movement
        const dx = currPos.x - prevPos.x;
        const dy = currPos.y - prevPos.y;
        const dz = currPos.z - prevPos.z;

        // Vector from prev to target
        const fx = prevPos.x - targetPos.x;
        const fy = prevPos.y - targetPos.y;
        const fz = prevPos.z - targetPos.z;

        // Quadratic equation coefficients
        const a = dx * dx + dy * dy + dz * dz;
        const b = 2 * (fx * dx + fy * dy + fz * dz);
        const c = fx * fx + fy * fy + fz * fz - radius * radius;

        // Check discriminant
        const discriminant = b * b - 4 * a * c;

        if (discriminant < 0 || a === 0) {
            return null; // No intersection
        }

        const sqrtDisc = Math.sqrt(discriminant);
        const t1 = (-b - sqrtDisc) / (2 * a);
        const t2 = (-b + sqrtDisc) / (2 * a);

        // Find the first valid intersection
        let t = -1;
        if (t1 >= 0 && t1 <= 1) {
            t = t1;
        } else if (t2 >= 0 && t2 <= 1) {
            t = t2;
        }

        if (t < 0) {
            return null;
        }

        // Calculate hit point
        return {
            t: t,
            point: {
                x: prevPos.x + dx * t,
                y: prevPos.y + dy * t,
                z: prevPos.z + dz * t
            }
        };
    },

    /**
     * Simple line-sphere intersection for 2D (XZ plane)
     * @param {Object} lineStart - Start point {x, z}
     * @param {Object} lineEnd - End point {x, z}
     * @param {Object} circleCenter - Circle center {x, z}
     * @param {number} radius - Circle radius
     * @returns {boolean} True if line intersects circle
     */
    lineCircle2D(lineStart, lineEnd, circleCenter, radius) {
        // Vector from start to end
        const dx = lineEnd.x - lineStart.x;
        const dz = lineEnd.z - lineStart.z;

        // Vector from start to circle center
        const fx = lineStart.x - circleCenter.x;
        const fz = lineStart.z - circleCenter.z;

        const a = dx * dx + dz * dz;
        const b = 2 * (fx * dx + fz * dz);
        const c = fx * fx + fz * fz - radius * radius;

        const discriminant = b * b - 4 * a * c;

        if (discriminant < 0) {
            return false;
        }

        const sqrtDisc = Math.sqrt(discriminant);
        const t1 = (-b - sqrtDisc) / (2 * a);
        const t2 = (-b + sqrtDisc) / (2 * a);

        return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
    },

    // ==========================================
    // AABB COLLISION (Axis-Aligned Bounding Box)
    // ==========================================

    /**
     * Check if two AABBs overlap
     * @param {Object} box1 - First box {min: {x,y,z}, max: {x,y,z}}
     * @param {Object} box2 - Second box {min: {x,y,z}, max: {x,y,z}}
     * @returns {boolean}
     */
    checkAABB(box1, box2) {
        return (
            box1.min.x <= box2.max.x &&
            box1.max.x >= box2.min.x &&
            box1.min.y <= box2.max.y &&
            box1.max.y >= box2.min.y &&
            box1.min.z <= box2.max.z &&
            box1.max.z >= box2.min.z
        );
    },

    /**
     * Check if two 2D AABBs overlap (XZ plane)
     * @param {Object} box1 - First box {min: {x,z}, max: {x,z}}
     * @param {Object} box2 - Second box {min: {x,z}, max: {x,z}}
     * @returns {boolean}
     */
    checkAABB2D(box1, box2) {
        return (
            box1.min.x <= box2.max.x &&
            box1.max.x >= box2.min.x &&
            box1.min.z <= box2.max.z &&
            box1.max.z >= box2.min.z
        );
    },

    /**
     * Create an AABB from center and half-extents
     * @param {Object} center - Center position {x, y, z}
     * @param {Object} halfExtents - Half-extents {x, y, z}
     * @returns {Object} AABB {min, max}
     */
    createAABB(center, halfExtents) {
        return {
            min: {
                x: center.x - halfExtents.x,
                y: center.y - halfExtents.y,
                z: center.z - halfExtents.z
            },
            max: {
                x: center.x + halfExtents.x,
                y: center.y + halfExtents.y,
                z: center.z + halfExtents.z
            }
        };
    },

    /**
     * Create a 2D AABB from center and half-extents
     * @param {Object} center - Center position {x, z}
     * @param {Object} halfExtents - Half-extents {x, z}
     * @returns {Object} AABB {min, max}
     */
    createAABB2D(center, halfExtents) {
        return {
            min: {
                x: center.x - halfExtents.x,
                z: center.z - halfExtents.z
            },
            max: {
                x: center.x + halfExtents.x,
                z: center.z + halfExtents.z
            }
        };
    },

    // ==========================================
    // POINT TESTS
    // ==========================================

    /**
     * Check if a point is inside an AABB
     * @param {Object} point - Point {x, y, z}
     * @param {Object} box - AABB {min, max}
     * @returns {boolean}
     */
    pointInAABB(point, box) {
        return (
            point.x >= box.min.x && point.x <= box.max.x &&
            point.y >= box.min.y && point.y <= box.max.y &&
            point.z >= box.min.z && point.z <= box.max.z
        );
    },

    /**
     * Check if a point is inside a 2D AABB (XZ plane)
     * @param {Object} point - Point {x, z}
     * @param {Object} box - AABB {min, max}
     * @returns {boolean}
     */
    pointInAABB2D(point, box) {
        return (
            point.x >= box.min.x && point.x <= box.max.x &&
            point.z >= box.min.z && point.z <= box.max.z
        );
    },

    /**
     * Check if a point is inside a circle (2D)
     * @param {Object} point - Point {x, z}
     * @param {Object} center - Circle center {x, z}
     * @param {number} radius - Circle radius
     * @returns {boolean}
     */
    pointInCircle(point, center, radius) {
        return this.checkDistance2D(point, center, radius);
    },

    /**
     * Check if a point is inside a sphere (3D)
     * @param {Object} point - Point {x, y, z}
     * @param {Object} center - Sphere center {x, y, z}
     * @param {number} radius - Sphere radius
     * @returns {boolean}
     */
    pointInSphere(point, center, radius) {
        return this.checkDistance3D(point, center, radius);
    },

    // ==========================================
    // GRID-AWARE COLLISION (Maze/Room System)
    // ==========================================

    /**
     * Check wall collision for grid-based maze
     * @param {number} newX - New X position
     * @param {number} newZ - New Z position
     * @param {number} oldX - Previous X position (unused but kept for API consistency)
     * @param {number} oldZ - Previous Z position (unused but kept for API consistency)
     * @param {Object} gridOrchestrator - Grid system with getRoomAtWorld method
     * @param {Object} roomConfig - Room config {UNIT, DOOR_WIDTH}
     * @param {number} [margin=1.2] - Player collision radius
     * @returns {Object} Result {blocked, blockedX, blockedZ}
     */
    checkWallCollision(newX, newZ, oldX, oldZ, gridOrchestrator, roomConfig, margin = 1.2) {
        const result = { blocked: false, blockedX: false, blockedZ: false };
        const ROOM_UNIT = roomConfig.UNIT;
        const DOOR_WIDTH = roomConfig.DOOR_WIDTH;

        // Get current room
        const room = gridOrchestrator.getRoomAtWorld(newX, newZ);
        if (!room) {
            // Outside grid - block movement
            return { blocked: true, blockedX: true, blockedZ: true };
        }

        // Calculate room boundaries
        const roomMinX = room.gridX * ROOM_UNIT;
        const roomMaxX = roomMinX + ROOM_UNIT;
        const roomMinZ = room.gridZ * ROOM_UNIT;
        const roomMaxZ = roomMinZ + ROOM_UNIT;

        // Door center positions
        const doorCenterX = roomMinX + ROOM_UNIT / 2;
        const doorCenterZ = roomMinZ + ROOM_UNIT / 2;
        const doorHalf = DOOR_WIDTH / 2;
        const doorPassHalf = Math.max(0, doorHalf - margin);

        // Check each wall
        const doors = room.doors || [];

        // West wall (x min)
        if (newX < roomMinX + margin) {
            if (doors.includes('west') && Math.abs(newZ - doorCenterZ) < doorPassHalf) {
                // In doorway - allow
            } else {
                result.blockedX = true;
            }
        }

        // East wall (x max)
        if (newX > roomMaxX - margin) {
            if (doors.includes('east') && Math.abs(newZ - doorCenterZ) < doorPassHalf) {
                // In doorway - allow
            } else {
                result.blockedX = true;
            }
        }

        // North wall (z min)
        if (newZ < roomMinZ + margin) {
            if (doors.includes('north') && Math.abs(newX - doorCenterX) < doorPassHalf) {
                // In doorway - allow
            } else {
                result.blockedZ = true;
            }
        }

        // South wall (z max)
        if (newZ > roomMaxZ - margin) {
            if (doors.includes('south') && Math.abs(newX - doorCenterX) < doorPassHalf) {
                // In doorway - allow
            } else {
                result.blockedZ = true;
            }
        }

        result.blocked = result.blockedX || result.blockedZ;
        return result;
    },

    /**
     * Check collision with obstacles for player movement
     * @param {number} newX - New X position
     * @param {number} newZ - New Z position
     * @param {number} oldX - Previous X position
     * @param {number} oldZ - Previous Z position
     * @param {Array} obstacles - Array of obstacle meshes
     * @param {number} playerRadius - Player collision radius
     * @returns {Object} Result {blocked, blockedX, blockedZ}
     */
    checkObstacleCollision(newX, newZ, oldX, oldZ, obstacles, playerRadius = 1.2) {
        const result = { blocked: false, blockedX: false, blockedZ: false };

        if (!obstacles || obstacles.length === 0) return result;

        for (const obs of obstacles) {
            if (!obs.userData.active || obs.userData.hit) continue;

            // Get obstacle collision radius
            const obsRadius = obs.userData.collisionRadius ||
                obs.userData.config?.collisionRadius ||
                (obs.userData.width ? obs.userData.width / 2 : 1.5);

            const minDist = playerRadius + obsRadius;
            const obsX = obs.position.x;
            const obsZ = obs.position.z;

            // Check current distance from obstacle
            const dxOld = oldX - obsX;
            const dzOld = oldZ - obsZ;
            const oldDist = Math.sqrt(dxOld * dxOld + dzOld * dzOld);

            // Check new distance from obstacle
            const dxNew = newX - obsX;
            const dzNew = newZ - obsZ;
            const newDist = Math.sqrt(dxNew * dxNew + dzNew * dzNew);

            // Only block if we're moving INTO the obstacle (getting closer while inside collision zone)
            if (newDist < minDist) {
                // We would be inside collision zone at new position
                // Only block the axis that's moving toward the obstacle center

                // Check if X movement is toward obstacle
                const movingTowardX = Math.abs(dxNew) < Math.abs(dxOld);
                // Check if Z movement is toward obstacle
                const movingTowardZ = Math.abs(dzNew) < Math.abs(dzOld);

                // Only block axes that are moving toward the obstacle
                if (movingTowardX && Math.abs(dxNew) < minDist * 0.9) {
                    result.blockedX = true;
                }
                if (movingTowardZ && Math.abs(dzNew) < minDist * 0.9) {
                    result.blockedZ = true;
                }

                // If already very close (stuck), allow sliding by only blocking one axis
                if (oldDist < minDist * 0.8 && result.blockedX && result.blockedZ) {
                    // Allow movement along the tangent (perpendicular to obstacle direction)
                    // Unblock the axis that's more tangential
                    if (Math.abs(dxOld) > Math.abs(dzOld)) {
                        result.blockedZ = false; // More X-aligned, allow Z movement
                    } else {
                        result.blockedX = false; // More Z-aligned, allow X movement
                    }
                }
            }
        }

        result.blocked = result.blockedX || result.blockedZ;
        return result;
    },

    /**
     * Check collision with shelves for player movement
     * @param {number} newX - New X position
     * @param {number} newZ - New Z position
     * @param {number} oldX - Previous X position
     * @param {number} oldZ - Previous Z position
     * @param {Array} shelves - Array of shelf meshes
     * @param {number} playerRadius - Player collision radius
     * @returns {Object} Result {blocked, blockedX, blockedZ}
     */
    checkShelfCollision(newX, newZ, oldX, oldZ, shelves, playerRadius = 1.2) {
        const result = { blocked: false, blockedX: false, blockedZ: false };

        if (!shelves || shelves.length === 0) return result;

        for (const shelf of shelves) {
            if (!shelf.position) continue;

            // Get shelf dimensions
            const shelfWidth = shelf.userData?.width || 4;
            const shelfDepth = shelf.userData?.depth || 2;
            const halfW = shelfWidth / 2 + playerRadius;
            const halfD = shelfDepth / 2 + playerRadius;

            // Check if new X position would collide
            const dxNew = newX - shelf.position.x;
            const dzOld = oldZ - shelf.position.z;
            if (Math.abs(dxNew) < halfW && Math.abs(dzOld) < halfD) {
                result.blockedX = true;
            }

            // Check if new Z position would collide
            const dxOld = oldX - shelf.position.x;
            const dzNew = newZ - shelf.position.z;
            if (Math.abs(dxOld) < halfW && Math.abs(dzNew) < halfD) {
                result.blockedZ = true;
            }
        }

        result.blocked = result.blockedX || result.blockedZ;
        return result;
    },

    /**
     * Combined collision check for walls, obstacles, and shelves
     * @param {number} newX - New X position
     * @param {number} newZ - New Z position
     * @param {number} oldX - Previous X position
     * @param {number} oldZ - Previous Z position
     * @param {Object} options - Collision options
     * @param {Object} options.gridOrchestrator - Grid system for wall collision
     * @param {Object} options.roomConfig - Room config {UNIT, DOOR_WIDTH}
     * @param {Array} options.obstacles - Obstacle meshes
     * @param {Array} options.shelves - Shelf meshes
     * @param {number} options.playerRadius - Player collision radius
     * @returns {Object} Result {blocked, blockedX, blockedZ}
     */
    checkAllCollisions(newX, newZ, oldX, oldZ, options) {
        const {
            gridOrchestrator,
            roomConfig,
            obstacles = null,
            shelves = null,
            playerRadius = 1.2
        } = options;

        const result = { blocked: false, blockedX: false, blockedZ: false };

        // Check wall collision
        if (gridOrchestrator && roomConfig) {
            const wallResult = this.checkWallCollision(newX, newZ, oldX, oldZ, gridOrchestrator, roomConfig, playerRadius);
            if (wallResult.blockedX) result.blockedX = true;
            if (wallResult.blockedZ) result.blockedZ = true;
        }

        // Check obstacle collision
        if (obstacles) {
            const obsResult = this.checkObstacleCollision(newX, newZ, oldX, oldZ, obstacles, playerRadius);
            if (obsResult.blockedX) result.blockedX = true;
            if (obsResult.blockedZ) result.blockedZ = true;
        }

        // Check shelf collision
        if (shelves) {
            const shelfResult = this.checkShelfCollision(newX, newZ, oldX, oldZ, shelves, playerRadius);
            if (shelfResult.blockedX) result.blockedX = true;
            if (shelfResult.blockedZ) result.blockedZ = true;
        }

        result.blocked = result.blockedX || result.blockedZ;
        return result;
    },

    /**
     * Push entity out of overlapping obstacles and shelves
     * @param {Object} position - Entity position {x, z} - will be modified
     * @param {Array} obstacles - Obstacle meshes
     * @param {Array} shelves - Shelf meshes
     * @param {number} entityRadius - Entity collision radius
     * @returns {boolean} True if any push-out was applied
     */
    pushOutOfOverlaps(position, obstacles, shelves, entityRadius = 1.2) {
        let pushed = false;

        // Push out of obstacles
        if (obstacles) {
            for (const obs of obstacles) {
                if (!obs.userData?.active || obs.userData.hit) continue;

                const obsRadius = obs.userData.collisionRadius ||
                    obs.userData.config?.collisionRadius ||
                    (obs.userData.width ? obs.userData.width / 2 : 1.5);

                const minDist = entityRadius + obsRadius;
                const dx = position.x - obs.position.x;
                const dz = position.z - obs.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist < minDist && dist > 0.01) {
                    // Push out along the shortest path
                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const nz = dz / dist;
                    position.x += nx * overlap;
                    position.z += nz * overlap;
                    pushed = true;
                }
            }
        }

        // Push out of shelves
        if (shelves) {
            for (const shelf of shelves) {
                if (!shelf.position) continue;

                const shelfWidth = shelf.userData?.width || 4;
                const shelfDepth = shelf.userData?.depth || 2;
                const halfW = shelfWidth / 2 + entityRadius;
                const halfD = shelfDepth / 2 + entityRadius;

                const dx = position.x - shelf.position.x;
                const dz = position.z - shelf.position.z;

                // Check if overlapping
                if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
                    // Find shortest push-out direction
                    const overlapX = halfW - Math.abs(dx);
                    const overlapZ = halfD - Math.abs(dz);

                    if (overlapX < overlapZ) {
                        position.x += Math.sign(dx) * overlapX;
                    } else {
                        position.z += Math.sign(dz) * overlapZ;
                    }
                    pushed = true;
                }
            }
        }

        return pushed;
    },

    /**
     * Check if a position is hitting a room wall (for projectile collision)
     * Unlike hasLineOfSight which checks room-to-room transitions, this checks
     * if a position is at/past a wall boundary within a room.
     * @param {number} x - X position
     * @param {number} z - Z position
     * @param {Object} gridOrchestrator - Grid system for room lookup
     * @param {Object} roomConfig - Room configuration {UNIT, DOOR_WIDTH}
     * @param {number} margin - How close to wall counts as hitting (default 0.2)
     * @returns {boolean} True if position is hitting a wall
     */
    isHittingRoomWall(x, z, gridOrchestrator, roomConfig, margin = 0.2) {
        const ROOM_UNIT = roomConfig.UNIT;
        const DOOR_WIDTH = roomConfig.DOOR_WIDTH;
        const room = gridOrchestrator.getRoomAtWorld(x, z);

        // Outside grid entirely - hitting outer wall
        if (!room) return true;

        const roomMinX = room.gridX * ROOM_UNIT + margin;
        const roomMaxX = (room.gridX + 1) * ROOM_UNIT - margin;
        const roomMinZ = room.gridZ * ROOM_UNIT + margin;
        const roomMaxZ = (room.gridZ + 1) * ROOM_UNIT - margin;

        const doorCenterX = room.gridX * ROOM_UNIT + ROOM_UNIT / 2;
        const doorCenterZ = room.gridZ * ROOM_UNIT + ROOM_UNIT / 2;
        const doorHalf = DOOR_WIDTH / 2;
        const doors = room.doors || [];

        // Check west wall
        if (x <= roomMinX) {
            const inDoor = doors.includes('west') && z > doorCenterZ - doorHalf && z < doorCenterZ + doorHalf;
            if (!inDoor) return true;
        }
        // Check east wall
        if (x >= roomMaxX) {
            const inDoor = doors.includes('east') && z > doorCenterZ - doorHalf && z < doorCenterZ + doorHalf;
            if (!inDoor) return true;
        }
        // Check north wall
        if (z <= roomMinZ) {
            const inDoor = doors.includes('north') && x > doorCenterX - doorHalf && x < doorCenterX + doorHalf;
            if (!inDoor) return true;
        }
        // Check south wall
        if (z >= roomMaxZ) {
            const inDoor = doors.includes('south') && x > doorCenterX - doorHalf && x < doorCenterX + doorHalf;
            if (!inDoor) return true;
        }

        return false;
    },

    /**
     * Hard clamp position to stay within room bounds (last resort safety)
     * @param {Object} position - Entity position {x, z} - will be modified
     * @param {Object} gridOrchestrator - Grid system for room lookup
     * @param {Object} roomConfig - Room configuration
     * @param {number} margin - Distance from walls
     * @returns {boolean} True if position was clamped
     */
    clampToRoomBounds(position, gridOrchestrator, roomConfig, margin = 1.5) {
        const ROOM_UNIT = roomConfig.UNIT;
        const room = gridOrchestrator.getRoomAtWorld(position.x, position.z);

        if (!room) {
            // Outside grid entirely - find nearest valid room and clamp
            const gridX = Math.floor(position.x / ROOM_UNIT);
            const gridZ = Math.floor(position.z / ROOM_UNIT);
            // Clamp to grid bounds
            const clampedGridX = Math.max(0, Math.min(gridOrchestrator.width - 1, gridX));
            const clampedGridZ = Math.max(0, Math.min(gridOrchestrator.height - 1, gridZ));
            position.x = clampedGridX * ROOM_UNIT + ROOM_UNIT / 2;
            position.z = clampedGridZ * ROOM_UNIT + ROOM_UNIT / 2;
            return true;
        }

        let clamped = false;
        const roomMinX = room.gridX * ROOM_UNIT + margin;
        const roomMaxX = (room.gridX + 1) * ROOM_UNIT - margin;
        const roomMinZ = room.gridZ * ROOM_UNIT + margin;
        const roomMaxZ = (room.gridZ + 1) * ROOM_UNIT - margin;

        // Only clamp if NOT in a doorway
        const doorCenterX = room.gridX * ROOM_UNIT + ROOM_UNIT / 2;
        const doorCenterZ = room.gridZ * ROOM_UNIT + ROOM_UNIT / 2;
        const doorHalf = roomConfig.DOOR_WIDTH / 2;
        const doorPassHalf = Math.max(0, doorHalf - margin);
        const doors = room.doors || [];

        // Clamp X
        if (position.x < roomMinX) {
            const inWestDoor = doors.includes('west') && Math.abs(position.z - doorCenterZ) < doorPassHalf;
            if (!inWestDoor) {
                position.x = roomMinX;
                clamped = true;
            }
        }
        if (position.x > roomMaxX) {
            const inEastDoor = doors.includes('east') && Math.abs(position.z - doorCenterZ) < doorPassHalf;
            if (!inEastDoor) {
                position.x = roomMaxX;
                clamped = true;
            }
        }

        // Clamp Z
        if (position.z < roomMinZ) {
            const inNorthDoor = doors.includes('north') && Math.abs(position.x - doorCenterX) < doorPassHalf;
            if (!inNorthDoor) {
                position.z = roomMinZ;
                clamped = true;
            }
        }
        if (position.z > roomMaxZ) {
            const inSouthDoor = doors.includes('south') && Math.abs(position.x - doorCenterX) < doorPassHalf;
            if (!inSouthDoor) {
                position.z = roomMaxZ;
                clamped = true;
            }
        }

        return clamped;
    },

    /**
     * Get wall direction between two adjacent rooms
     * @param {Object} fromRoom - Source room {gridX, gridZ}
     * @param {Object} toRoom - Target room {gridX, gridZ}
     * @returns {string|null} Direction ('north', 'south', 'east', 'west') or null if not adjacent
     */
    getWallDirection(fromRoom, toRoom) {
        const dx = toRoom.gridX - fromRoom.gridX;
        const dz = toRoom.gridZ - fromRoom.gridZ;

        if (dx === 1 && dz === 0) return 'east';
        if (dx === -1 && dz === 0) return 'west';
        if (dx === 0 && dz === 1) return 'south';
        if (dx === 0 && dz === -1) return 'north';

        return null; // Not adjacent
    },

    // ==========================================
    // PROJECTILE HIT DETECTION
    // ==========================================

    /**
     * Process projectile hits against enemies, obstacles, walls, and shelves
     * Uses sweep collision for fast-moving projectiles
     * @param {Array} projectiles - Array of projectile meshes
     * @param {Array} enemies - Array of enemy meshes
     * @param {Array} obstacles - Array of obstacle meshes
     * @param {Object} options - Options and callbacks
     * @param {Function} options.onEnemyHit - Callback(enemy, damage, closestPoint, destroyed)
     * @param {Function} options.onObstacleHit - Callback(obstacle, closestPoint)
     * @param {Function} options.onWallHit - Callback(position) when hitting wall/shelf
     * @param {Object} options.gridOrchestrator - Grid system for wall collision
     * @param {Object} options.roomConfig - Room config for wall collision
     * @param {Array} options.shelves - Shelf meshes for collision
     * @param {Object} options.THREE - Three.js library reference
     */
    processProjectileHits(projectiles, enemies, obstacles, options) {
        const {
            onEnemyHit = null,
            onObstacleHit = null,
            onWallHit = null,
            onSplashHit = null,
            gridOrchestrator = null,
            roomConfig = null,
            shelves = null,
            THREE
        } = options;

        projectiles.forEach(proj => {
            if (!proj.userData.active) return;

            // Store previous position for sweep check
            const prevPos = proj.userData.prevPosition || proj.position.clone();
            const currPos = proj.position;

            // Calculate projectile direction and length
            const projDir = currPos.clone().sub(prevPos);
            const projLen = projDir.length();
            if (projLen > 0) {
                projDir.normalize();
            }

            // Check wall collision (using 2D line check + room boundary check)
            // Only check if projectile has moved a meaningful distance (not just spawned)
            if (gridOrchestrator && roomConfig && proj.userData.active && projLen > 0.5) {
                let hitWall = false;
                // Check if LOS is blocked between prev and current position (room-to-room)
                if (!this.hasLineOfSight(prevPos.x, prevPos.z, currPos.x, currPos.z, gridOrchestrator, roomConfig)) {
                    hitWall = true;
                }
                // Also check if projectile hit a room wall (within same room)
                // Use small margin (0.2) to catch wall impacts
                else if (this.isHittingRoomWall(currPos.x, currPos.z, gridOrchestrator, roomConfig, 0.2)) {
                    hitWall = true;
                }

                if (hitWall) {
                    proj.userData.active = false;
                    if (onWallHit) {
                        onWallHit(currPos.clone());
                    }
                    // Process splash damage on wall hit
                    const projConfig = proj.userData.projectileConfig ||
                        (typeof Projectile !== 'undefined' && proj.userData.projectileType
                            ? Projectile.get(proj.userData.projectileType) : null);
                    if (projConfig?.splash && projConfig.splashRadius > 0) {
                        this.processSplashDamage(
                            { x: currPos.x, y: currPos.y, z: currPos.z },
                            projConfig.splashRadius,
                            projConfig.splashDamage || 0.5,
                            enemies,
                            null,
                            onSplashHit || onEnemyHit
                        );
                    }
                }
            }

            // Check shelf collision
            if (shelves && shelves.length > 0 && proj.userData.active) {
                for (const shelf of shelves) {
                    if (!shelf.position) continue;

                    const shelfWidth = shelf.userData?.width || 4;
                    const shelfDepth = shelf.userData?.depth || 2;
                    const shelfHeight = shelf.userData?.height || 3;

                    // Check Y range (shelf height)
                    if (currPos.y < 0 || currPos.y > shelfHeight) continue;

                    const box = {
                        minX: shelf.position.x - shelfWidth / 2,
                        maxX: shelf.position.x + shelfWidth / 2,
                        minZ: shelf.position.z - shelfDepth / 2,
                        maxZ: shelf.position.z + shelfDepth / 2
                    };

                    if (this.lineAABB2D({ x: prevPos.x, z: prevPos.z }, { x: currPos.x, z: currPos.z }, box)) {
                        proj.userData.active = false;
                        if (onWallHit) {
                            onWallHit(currPos.clone());
                        }
                        // Process splash damage on shelf hit
                        const projConfig = proj.userData.projectileConfig ||
                            (typeof Projectile !== 'undefined' && proj.userData.projectileType
                                ? Projectile.get(proj.userData.projectileType) : null);
                        if (projConfig?.splash && projConfig.splashRadius > 0) {
                            this.processSplashDamage(
                                { x: currPos.x, y: currPos.y, z: currPos.z },
                                projConfig.splashRadius,
                                projConfig.splashDamage || 0.5,
                                enemies,
                                null,
                                onSplashHit || onEnemyHit
                            );
                        }
                        break;
                    }
                }
            }

            // Check enemy collisions with early exit and optimized vectors
            const cfg = this.config;
            for (let i = 0; i < enemies.length && proj.userData.active; i++) {
                const enemy = enemies[i];
                if (!enemy.userData.active) continue;

                // Quick distance check first (cheaper than full calculation)
                const dx = enemy.position.x - currPos.x;
                const dz = enemy.position.z - currPos.z;
                if (dx * dx + dz * dz > cfg.enemyQuickCheckDist) continue;

                // Enemy hitbox center
                const enemyCenter = enemy.position.clone();
                enemyCenter.y += cfg.enemyHitboxYOffset;

                const hitRadius = cfg.enemyHitRadius;
                const toEnemy = enemyCenter.sub(prevPos);  // Reuse enemyCenter vector

                if (projLen > 0) {
                    const dot = toEnemy.dot(projDir);
                    const clampedDot = Math.max(0, Math.min(projLen, dot));
                    const closestPoint = prevPos.clone().addScaledVector(projDir, clampedDot);
                    enemyCenter.copy(enemy.position).y += cfg.enemyHitboxYOffset;  // Restore for distance check
                    const dist = closestPoint.distanceTo(enemyCenter);

                    if (dist < hitRadius) {
                        proj.userData.active = false;
                        const damage = proj.userData.damage || 1;

                        // Get projectile config for status effects
                        const projConfig = proj.userData.projectileConfig ||
                            (typeof Projectile !== 'undefined' && proj.userData.projectileType
                                ? Projectile.get(proj.userData.projectileType) : null);

                        // Transform enemies into toys (special weapon)
                        if (projConfig?.transformToToy) {
                            if (onEnemyHit) {
                                onEnemyHit(enemy, damage, closestPoint, {
                                    hit: true,
                                    destroyed: false,
                                    scoreHit: 0,
                                    scoreDestroy: 0,
                                    totalScore: 0,
                                    transformed: true
                                });
                            }
                            return;
                        }

                        // Use EnemyOrchestrator for damage handling
                        const result = typeof EnemyOrchestrator !== 'undefined'
                            ? EnemyOrchestrator.damage(enemy, damage)
                            : { hit: true, destroyed: enemy.userData.health <= damage };

                        if (result && onEnemyHit) {
                            onEnemyHit(enemy, damage, closestPoint, result);
                        }

                        // Apply slow effect if projectile has slow and enemy not destroyed
                        if (projConfig?.slow?.enabled && result && !result.destroyed) {
                            enemy.userData.slowedUntil = Date.now() + (projConfig.slow.duration * 1000);
                            enemy.userData.slowMultiplier = projConfig.slow.speedMultiplier;
                        }

                        // Process splash damage if projectile has splash properties
                        if (projConfig?.splash && projConfig.splashRadius > 0) {
                            this.processSplashDamage(
                                closestPoint,
                                projConfig.splashRadius,
                                projConfig.splashDamage || 0.5,
                                enemies,
                                enemy,
                                onSplashHit || onEnemyHit
                            );
                        }
                    }
                }
            }

            // Check obstacle collisions with optimization
            for (let i = 0; i < obstacles.length && proj.userData.active; i++) {
                const obs = obstacles[i];
                if (!obs.userData.active || obs.userData.hit) continue;

                // Quick distance check
                const obsDx = obs.position.x - currPos.x;
                const obsDz = obs.position.z - currPos.z;
                if (obsDx * obsDx + obsDz * obsDz > cfg.obstacleQuickCheckDist) continue;

                const obsHeight = obs.userData.height || cfg.defaultObstacleHeight;
                const obsWidth = obs.userData.width || cfg.defaultObstacleWidth;
                const obsCenter = obs.position.clone();
                obsCenter.y += obsHeight * cfg.obstacleHitYFactor;
                const obsHitRadius = obsWidth * cfg.obstacleHitRadiusFactor;

                const toObs = obsCenter.sub(prevPos);

                if (projLen > 0) {
                    const dot = toObs.dot(projDir);
                    const clampedDot = Math.max(0, Math.min(projLen, dot));
                    const closestPoint = prevPos.clone().addScaledVector(projDir, clampedDot);
                    obsCenter.copy(obs.position).y += obsHeight * cfg.obstacleHitYFactor;
                    const dist = closestPoint.distanceTo(obsCenter);

                    if (dist < obsHitRadius) {
                        proj.userData.active = false;
                        obs.userData.hit = true;

                        if (onObstacleHit) {
                            onObstacleHit(obs, closestPoint);
                        }

                        // Process splash damage if projectile has splash properties
                        const projConfig = proj.userData.projectileConfig ||
                            (typeof Projectile !== 'undefined' && proj.userData.projectileType
                                ? Projectile.get(proj.userData.projectileType) : null);
                        if (projConfig?.splash && projConfig.splashRadius > 0) {
                            this.processSplashDamage(
                                closestPoint,
                                projConfig.splashRadius,
                                projConfig.splashDamage || 0.5,
                                enemies,
                                null,
                                onSplashHit || onEnemyHit
                            );
                        }
                    }
                }
            }

            // Store current position for next frame's sweep check
            proj.userData.prevPosition = proj.position.clone();
        });
    },

    /**
     * Process splash damage from a projectile impact
     * @param {Object} impactPos - Impact position {x, y, z}
     * @param {number} splashRadius - Splash damage radius
     * @param {number} splashDamage - Damage dealt to targets in splash zone
     * @param {Array} enemies - Enemy meshes to check
     * @param {Object} hitEnemy - The enemy that was directly hit (to exclude)
     * @param {Function} onSplashHit - Callback(enemy, damage, result)
     */
    processSplashDamage(impactPos, splashRadius, splashDamage, enemies, hitEnemy, onSplashHit) {
        if (!enemies || splashRadius <= 0 || splashDamage <= 0) return;

        const splashRadiusSq = splashRadius * splashRadius;

        for (const enemy of enemies) {
            // Skip inactive enemies and the one that was directly hit
            if (!enemy.userData?.active || enemy === hitEnemy) continue;

            // Calculate distance from impact
            const dx = enemy.position.x - impactPos.x;
            const dz = enemy.position.z - impactPos.z;
            const distSq = dx * dx + dz * dz;

            // Check if within splash radius
            if (distSq < splashRadiusSq) {
                // Apply damage with falloff (closer = more damage)
                const dist = Math.sqrt(distSq);
                const falloff = 1 - (dist / splashRadius);
                const damage = Math.ceil(splashDamage * falloff);

                if (damage > 0) {
                    const result = typeof EnemyOrchestrator !== 'undefined'
                        ? EnemyOrchestrator.damage(enemy, damage)
                        : { hit: true, destroyed: enemy.userData.health <= damage };

                    if (result && onSplashHit) {
                        // Pass 4 args to match onEnemyHit signature (enemy, damage, closestPoint, result)
                        onSplashHit(enemy, damage, impactPos, result);
                    }
                }
            }
        }
    },

    /**
     * Check if a 2D line segment intersects an axis-aligned bounding box
     * @param {Object} lineStart - Start point {x, z}
     * @param {Object} lineEnd - End point {x, z}
     * @param {Object} box - AABB {minX, minZ, maxX, maxZ}
     * @returns {boolean} True if line intersects box
     */
    lineAABB2D(lineStart, lineEnd, box) {
        // Parametric line: P = lineStart + t * (lineEnd - lineStart), t in [0, 1]
        const dx = lineEnd.x - lineStart.x;
        const dz = lineEnd.z - lineStart.z;

        let tMin = 0;
        let tMax = 1;

        // Check X axis slab
        if (Math.abs(dx) < 0.0001) {
            // Line is parallel to Y axis
            if (lineStart.x < box.minX || lineStart.x > box.maxX) {
                return false;
            }
        } else {
            const invDx = 1 / dx;
            let t1 = (box.minX - lineStart.x) * invDx;
            let t2 = (box.maxX - lineStart.x) * invDx;

            if (t1 > t2) {
                const temp = t1;
                t1 = t2;
                t2 = temp;
            }

            tMin = Math.max(tMin, t1);
            tMax = Math.min(tMax, t2);

            if (tMin > tMax) {
                return false;
            }
        }

        // Check Z axis slab
        if (Math.abs(dz) < 0.0001) {
            // Line is parallel to X axis
            if (lineStart.z < box.minZ || lineStart.z > box.maxZ) {
                return false;
            }
        } else {
            const invDz = 1 / dz;
            let t1 = (box.minZ - lineStart.z) * invDz;
            let t2 = (box.maxZ - lineStart.z) * invDz;

            if (t1 > t2) {
                const temp = t1;
                t1 = t2;
                t2 = temp;
            }

            tMin = Math.max(tMin, t1);
            tMax = Math.min(tMax, t2);

            if (tMin > tMax) {
                return false;
            }
        }

        return true;
    },

    /**
     * Check line of sight between two points (respects room walls and doors)
     * @param {number} fromX - Source X position
     * @param {number} fromZ - Source Z position
     * @param {number} toX - Target X position
     * @param {number} toZ - Target Z position
     * @param {Object} gridOrchestrator - Grid system with getRoomAtWorld method
     * @param {Object} roomConfig - Room config {UNIT, DOOR_WIDTH}
     * @returns {boolean} True if line of sight exists
     */
    hasLineOfSight(fromX, fromZ, toX, toZ, gridOrchestrator, roomConfig) {
        const ROOM_UNIT = roomConfig.UNIT;
        const DOOR_WIDTH = roomConfig.DOOR_WIDTH;

        // Get rooms for both positions
        const fromRoom = gridOrchestrator.getRoomAtWorld(fromX, fromZ);
        const toRoom = gridOrchestrator.getRoomAtWorld(toX, toZ);

        // If either position is outside the grid, no line of sight
        if (!fromRoom || !toRoom) return false;

        // Same room - always has line of sight
        if (fromRoom.gridX === toRoom.gridX && fromRoom.gridZ === toRoom.gridZ) {
            return true;
        }

        // Different rooms - ray march to check for wall intersections
        const dx = toX - fromX;
        const dz = toZ - fromZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // Step size for ray march
        const stepSize = this.config.losRayStepSize;
        const steps = Math.ceil(dist / stepSize);

        let prevRoom = fromRoom;

        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const checkX = fromX + dx * t;
            const checkZ = fromZ + dz * t;

            const checkRoom = gridOrchestrator.getRoomAtWorld(checkX, checkZ);
            if (!checkRoom) return false; // Outside grid

            // Check if we crossed into a different room
            if (checkRoom.gridX !== prevRoom.gridX || checkRoom.gridZ !== prevRoom.gridZ) {
                // Determine which wall we crossed
                const wallDir = this.getWallDirection(prevRoom, checkRoom);

                // Check if there's a door connecting these rooms
                if (!wallDir || !prevRoom.doors.includes(wallDir)) {
                    return false; // No door - wall blocks line of sight
                }

                // Check if we're actually going through the door opening
                const doorCenterX = prevRoom.gridX * ROOM_UNIT + ROOM_UNIT / 2;
                const doorCenterZ = prevRoom.gridZ * ROOM_UNIT + ROOM_UNIT / 2;
                const doorHalf = DOOR_WIDTH / 2 + this.config.losDoorTolerance; // Slightly wider for tolerance

                if (wallDir === 'east' || wallDir === 'west') {
                    // Horizontal door - check Z alignment
                    if (checkZ < doorCenterZ - doorHalf || checkZ > doorCenterZ + doorHalf) {
                        return false; // Not going through door
                    }
                } else {
                    // Vertical door - check X alignment
                    if (checkX < doorCenterX - doorHalf || checkX > doorCenterX + doorHalf) {
                        return false; // Not going through door
                    }
                }

                prevRoom = checkRoom;
            }
        }

        return true;
    },

    /**
     * Enhanced line of sight check that includes obstacles and shelves
     * @param {number} fromX - Source X position
     * @param {number} fromZ - Source Z position
     * @param {number} toX - Target X position
     * @param {number} toZ - Target Z position
     * @param {Object} options - Check options
     * @param {Object} options.gridOrchestrator - Grid system with getRoomAtWorld method
     * @param {Object} options.roomConfig - Room config {UNIT, DOOR_WIDTH}
     * @param {Array} options.obstacles - Obstacle meshes to check against
     * @param {Array} options.shelves - Shelf meshes to check against
     * @param {number} options.playerRadius - Player collision radius (for margin)
     * @returns {boolean} True if line of sight exists
     */
    hasLineOfSightWithPhysicals(fromX, fromZ, toX, toZ, options) {
        const {
            gridOrchestrator,
            roomConfig,
            obstacles = null,
            shelves = null,
            playerRadius = 1.2
        } = options;

        // 1. First check basic wall/door LOS
        if (gridOrchestrator && roomConfig) {
            if (!this.hasLineOfSight(fromX, fromZ, toX, toZ, gridOrchestrator, roomConfig)) {
                return false;
            }
        }

        const lineStart = { x: fromX, z: fromZ };
        const lineEnd = { x: toX, z: toZ };

        // 2. Check obstacles: use lineCircle2D for each active obstacle
        if (obstacles && obstacles.length > 0) {
            for (const obs of obstacles) {
                // Skip inactive or hit obstacles
                if (!obs.userData?.active || obs.userData.hit) continue;

                // Get obstacle collision radius
                const obsRadius = obs.userData.collisionRadius ||
                    obs.userData.config?.collisionRadius ||
                    (obs.userData.width ? obs.userData.width / 2 : 1.5);

                // Add small margin for LOS blocking (half player radius)
                const blockRadius = obsRadius + playerRadius * 0.5;

                if (this.lineCircle2D(lineStart, lineEnd, obs.position, blockRadius)) {
                    return false;
                }
            }
        }

        // 3. Check shelves: use lineAABB2D for each shelf
        if (shelves && shelves.length > 0) {
            for (const shelf of shelves) {
                if (!shelf.position) continue;

                // Get shelf dimensions
                const shelfWidth = shelf.userData?.width || 4;
                const shelfDepth = shelf.userData?.depth || 2;

                // Create AABB for shelf (with small margin)
                const halfW = shelfWidth / 2 + playerRadius * 0.25;
                const halfD = shelfDepth / 2 + playerRadius * 0.25;

                const box = {
                    minX: shelf.position.x - halfW,
                    maxX: shelf.position.x + halfW,
                    minZ: shelf.position.z - halfD,
                    maxZ: shelf.position.z + halfD
                };

                if (this.lineAABB2D(lineStart, lineEnd, box)) {
                    return false;
                }
            }
        }

        return true;
    }
};
