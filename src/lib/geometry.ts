import { RoomVertex, Point, RoomShape } from './types';

export const distance = (p1: Point, p2: Point): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const midpoint = (p1: Point, p2: Point): Point => {
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
    };
};

export const subtract = (p1: Point, p2: Point): Point => ({
    x: p1.x - p2.x,
    y: p1.y - p2.y
});

export const add = (p1: Point, p2: Point): Point => ({
    x: p1.x + p2.x,
    y: p1.y + p2.y
});

export const scale = (p: Point, s: number): Point => ({
    x: p.x * s,
    y: p.y * s,
});

export const normalize = (p: Point): Point => {
    const len = Math.sqrt(p.x * p.x + p.y * p.y);
    return len === 0 ? { x: 0, y: 0 } : { x: p.x / len, y: p.y / len };
};

export const dot = (p1: Point, p2: Point): number => p1.x * p2.x + p1.y * p2.y;

export const generateRoomPath = (vertices: RoomVertex[]): string => {
    if (vertices.length === 0) return '';

    let d = '';

    for (let i = 0; i < vertices.length; i++) {
        const curr = vertices[i];
        const prev = vertices[(i - 1 + vertices.length) % vertices.length];
        const next = vertices[(i + 1) % vertices.length];

        const vPrev = normalize(subtract(prev, curr));
        const vNext = normalize(subtract(next, curr));

        const r = curr.radius || 0;

        const distPrev = distance(curr, prev);
        const distNext = distance(curr, next);
        const maxR = Math.min(distPrev, distNext) / 2;
        const effectiveR = Math.min(r, maxR);

        if (curr.type === 'CORNER' || effectiveR < 1) {
            if (i === 0) d += `M ${curr.x} ${curr.y}`;
            else d += ` L ${curr.x} ${curr.y}`;
        } else {
            const pStart = {
                x: curr.x + vPrev.x * effectiveR,
                y: curr.y + vPrev.y * effectiveR
            };
            const pEnd = {
                x: curr.x + vNext.x * effectiveR,
                y: curr.y + vNext.y * effectiveR
            };

            if (i === 0) d += `M ${pStart.x} ${pStart.y}`;
            else d += ` L ${pStart.x} ${pStart.y}`;

            // Quadratic curve for fillet
            d += ` Q ${curr.x} ${curr.y} ${pEnd.x} ${pEnd.y}`;
        }
    }

    d += ' Z';
    return d;
};

export const getRenderSegments = (vertices: RoomVertex[]) => {
    const segments = [];
    for (let i = 0; i < vertices.length; i++) {
        segments.push({
            start: vertices[i],
            end: vertices[(i + 1) % vertices.length],
            length: distance(vertices[i], vertices[(i + 1) % vertices.length])
        });
    }
    return segments;
};

export const calculateInteriorAngle = (p1: Point, p2: Point, p3: Point) => {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    const angle1 = Math.atan2(v1.y, v1.x);
    const angle2 = Math.atan2(v2.y, v2.x);

    let angleDiff = (angle2 - angle1) * 180 / Math.PI;
    if (angleDiff < 0) angleDiff += 360;

    return angleDiff;
};

export const getCornerBisector = (prev: Point, curr: Point, next: Point) => {
    const v1 = normalize(subtract(prev, curr));
    const v2 = normalize(subtract(next, curr));
    const sum = add(v1, v2);
    // If vectors are opposite, sum is zero. Handle specific case?
    if (Math.abs(sum.x) < 0.001 && Math.abs(sum.y) < 0.001) {
        // Just return perpendicular to one
        return { x: -v1.y, y: v1.x };
    }
    return normalize(sum);
};

export const projectPointOnSegment = (p: Point, a: Point, b: Point) => {
    const ab = subtract(b, a);
    const ap = subtract(p, a);
    const lenSq = ab.x * ab.x + ab.y * ab.y;
    if (lenSq === 0) return { point: a, t: 0 };

    let t = dot(ap, ab) / lenSq;
    t = Math.max(0, Math.min(1, t));

    return {
        point: { x: a.x + t * ab.x, y: a.y + t * ab.y },
        t
    };
};

export const getNearestSegmentPoint = (p: Point, a: Point, b: Point) => {
    const proj = projectPointOnSegment(p, a, b);
    const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    return { point: proj.point, angle };
};

export const snapPoint = (p: Point, others: Point[], threshold: number = 10) => {
    let bestX = p.x;
    let bestY = p.y;
    let snappedX = false;
    let snappedY = false;
    const guides = [];

    for (const other of others) {
        if (!snappedX && Math.abs(other.x - p.x) < threshold) {
            bestX = other.x;
            snappedX = true;
            guides.push({ start: other, end: { x: other.x, y: p.y }, axis: 'x' });
        }
        if (!snappedY && Math.abs(other.y - p.y) < threshold) {
            bestY = other.y;
            snappedY = true;
            guides.push({ start: other, end: { x: p.x, y: other.y }, axis: 'y' });
        }
    }

    return { point: { x: bestX, y: bestY }, guides: guides as any[] };
};

export const isPointInPolygon = (point: Point, vs: Point[]) => {
    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i].x, yi = vs[i].y;
        let xj = vs[j].x, yj = vs[j].y;

        let intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

export const getPolygonBounds = (vs: Point[]) => {
    if (vs.length === 0) return { x: 0, y: 0, width: 0, height: 0, center: { x: 0, y: 0 } };
    const xs = vs.map(v => v.x);
    const ys = vs.map(v => v.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
        x: minX, y: minY,
        width: maxX - minX,
        height: maxY - minY,
        center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
    };
};

export const calculatePolygonArea = (vertices: Point[]): number => {
    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
        let j = (i + 1) % vertices.length;
        area += vertices[i].x * vertices[j].y;
        area -= vertices[j].x * vertices[i].y;
    }
    return Math.abs(area / 2);
};

export const calculatePolygonPerimeter = (vertices: Point[]): number => {
    let perimeter = 0;
    for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length;
        perimeter += distance(vertices[i], vertices[j]);
    }
    return perimeter;
};

export const scalePolygon = (vertices: RoomVertex[], scaleX: number, scaleY: number, center: Point): RoomVertex[] => {
    return vertices.map(v => ({
        ...v,
        x: center.x + (v.x - center.x) * scaleX,
        y: center.y + (v.y - center.y) * scaleY
    }));
};

export const rotatePolygon = (vertices: RoomVertex[], angleDeg: number, center: Point): RoomVertex[] => {
    const rad = angleDeg * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    return vertices.map(v => {
        const dx = v.x - center.x;
        const dy = v.y - center.y;
        return {
            ...v,
            x: center.x + (dx * cos - dy * sin),
            y: center.y + (dx * sin + dy * cos)
        };
    });
};

export interface WallMatch {
    point: Point;
    angle: number;
    shapeId: string;
    wallStart: Point;
    wallEnd: Point;
}

export const getNearestWall = (point: Point, shapes: RoomShape[], threshold: number = 30): WallMatch | null => {
    let bestDist = threshold;
    let bestMatch: WallMatch | null = null;

    shapes.forEach(shape => {
        shape.vertices.forEach((v1, i) => {
            const v2 = shape.vertices[(i + 1) % shape.vertices.length];
            const { point: proj } = projectPointOnSegment(point, v1, v2);
            const d = distance(point, proj);

            if (d < bestDist) {
                bestDist = d;
                const angle = Math.atan2(v2.y - v1.y, v2.x - v1.x) * 180 / Math.PI;
                bestMatch = {
                    point: proj,
                    angle: angle,
                    shapeId: shape.id,
                    wallStart: v1,
                    wallEnd: v2
                };
            }
        });
    });

    return bestMatch;
};

export const getWallSegmentPoints = (point: Point, shapes: RoomShape[], tolerance: number = 20): { start: Point; end: Point, shapeId: string, wallIndex: number } | null => {
    let bestDist = tolerance;
    let bestMatch = null;

    shapes.forEach(shape => {
        shape.vertices.forEach((v1, i) => {
            const v2 = shape.vertices[(i + 1) % shape.vertices.length];
            const { point: proj } = projectPointOnSegment(point, v1, v2);
            const d = distance(point, proj);

            if (d < bestDist) {
                bestDist = d;
                bestMatch = {
                    start: v1,
                    end: v2,
                    shapeId: shape.id,
                    wallIndex: i,
                    proj
                };
            }
        });
    });

    return bestMatch;
}

export const offsetPolygon = (vertices: Point[], offset: number): Point[] => {
    const result: Point[] = [];
    if (vertices.length < 3) return vertices;

    for (let i = 0; i < vertices.length; i++) {
        const prev = vertices[(i - 1 + vertices.length) % vertices.length];
        const curr = vertices[i];
        const next = vertices[(i + 1) % vertices.length];

        const v1 = normalize(subtract(curr, prev));
        const v2 = normalize(subtract(next, curr));

        // Normal vectors (perpendicular)
        const n1 = { x: -v1.y, y: v1.x };
        const n2 = { x: -v2.y, y: v2.x };

        // Determine miter point
        // Miter direction is sum of normals (bisector)
        // Or intersection of two parallel lines

        // Simple approach: Average normal divided by sin(angle/2)
        // But for wall rendering, purely visual offset might be enough?
        // Let's do true geometric offset for accuracy.

        // Line 1: P = (curr + offset * n1) + t * v1
        // Line 2: P = (curr + offset * n2) + u * v2
        // Intersect them.

        // Simplified:
        // Bisector vector
        const bisector = normalize(add(n1, n2));
        const dotN = dot(bisector, n1);
        // If lines are parallel (dotN ~ 0), just offset by normal
        if (Math.abs(dotN) < 0.001) {
            result.push(add(curr, scale(n1, offset)));
        } else {
            const dist = offset / dotN;
            result.push(add(curr, scale(bisector, dist)));
        }
    }
    return result;
};

export const getSmoothedPath = (points: Point[]): string => {
    if (points.length < 2) return '';

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
        // Simple line for now, could use bezier for true smoothing
        d += ` L ${points[i].x} ${points[i].y}`;
    }

    return d;
};