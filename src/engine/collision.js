// ============================================
// COLLISION - Collision Detection Utilities
// ============================================
// Pure utility functions for collision detection.
// No dependencies - works with plain position objects.

const Collision = {
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
    }
};
