import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import {
    Point, Tool, RoomVertex, ShapeType, FurnitureItem,
    WallItem, GuideLine
} from '@/lib/types';
import {
    distance, getNearestWall, isPointInPolygon, getPolygonBounds,
    normalize, subtract, add, dot
} from '@/lib/geometry';
import {
    SNAP_THRESHOLD,
    WALL_SNAP_THRESHOLD,
    DEFAULT_DOOR_WIDTH,
    DEFAULT_DOOR_HEIGHT,
    DEFAULT_WINDOW_WIDTH,
    DEFAULT_WINDOW_HEIGHT,
    DEFAULT_ROOM_COLOR,
    DEFAULT_ROOM_OPACITY,
    DEFAULT_ZONE_COLOR,
    DEFAULT_ZONE_OPACITY,
    DEFAULT_TEXT_COLOR,
    DEFAULT_TEXT_SIZE,
    DEFAULT_STROKE_COLOR,
    DEFAULT_STROKE_WIDTH,
    Z_INDEX
} from '@/lib/constants';
import { snapToGrid } from '@/lib/units';

export const useCanvasInteraction = (
    svgRef: React.RefObject<SVGSVGElement | null>,
    viewBox: { x: number, y: number, scale: number, width: number, height: number },
    setViewBox: React.Dispatch<React.SetStateAction<{ x: number, y: number, scale: number, width: number, height: number }>>
) => {
    const {
        shapes, furniture, zones, wallItems, texts, drawings,
        tool, setTool,
        selectedIds, setSelected, toggleSelection,
        addShape, addZone, addFurniture, addWallItem, addText, addDrawing,
        updateShape, updateFurniture, updateZone, updateWallItem,
        setShapes, setZones, setFurniture, setWallItems, setTexts,
        deleteSelected, saveToHistory,
        settings, isPlacingCustomFurniture, setPlacingCustomFurniture
    } = useStore(useShallow(state => ({
        shapes: state.shapes,
        furniture: state.furniture,
        zones: state.zones,
        wallItems: state.wallItems,
        texts: state.texts,
        drawings: state.drawings,
        tool: state.tool,
        setTool: state.setTool,
        selectedIds: state.selectedIds,
        setSelected: state.setSelected,
        toggleSelection: state.toggleSelection,
        addShape: state.addShape,
        addZone: state.addZone,
        addFurniture: state.addFurniture,
        addWallItem: state.addWallItem,
        addText: state.addText,
        addDrawing: state.addDrawing,
        updateShape: state.updateShape,
        updateFurniture: state.updateFurniture,
        updateZone: state.updateZone,
        updateWallItem: state.updateWallItem,
        updateText: state.updateText,
        updateDrawing: state.updateDrawing,
        setShapes: state.setShapes,
        setZones: state.setZones,
        setFurniture: state.setFurniture,
        setWallItems: state.setWallItems,
        setTexts: state.setTexts,
        deleteSelected: state.deleteSelected,
        saveToHistory: state.saveToHistory,
        settings: state.settings,
        isPlacingCustomFurniture: state.isPlacingCustomFurniture,
        setPlacingCustomFurniture: state.setPlacingCustomFurniture,
    })));

    const selectedId = selectedIds.length === 1 ? selectedIds[0] : (selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null);

    // Interaction State
    const [dragStart, setDragStart] = useState<Point | null>(null);
    const [dragAction, setDragAction] = useState<string | null>(null);
    const [hasDragged, setHasDragged] = useState(false);
    const [selectionBox, setSelectionBox] = useState<{ start: Point; end: Point } | null>(null);
    const [pendingDrawing, setPendingDrawing] = useState<Point[]>([]);
    const [ghostWallItem, setGhostWallItem] = useState<WallItem | null>(null);
    const placingCustomFurniture = isPlacingCustomFurniture; // Alias for backward compatibility if needed, else refactor usage
    const [snapLines, setSnapLines] = useState<GuideLine[]>([]);
    const [snapPoint, setSnapPoint] = useState<Point | null>(null);
    const [isPanning, setIsPanning] = useState(false);

    const movingChildrenIds = useRef<string[]>([]);
    const panStartViewBox = useRef<{ x: number; y: number } | null>(null);

    // SVG Point Helper
    const getSVGPoint = useCallback((e: React.MouseEvent | MouseEvent): Point => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        return {
            x: viewBox.x + (e.clientX - rect.left) * viewBox.width / rect.width,
            y: viewBox.y + (e.clientY - rect.top) * viewBox.height / rect.height
        };
    }, [viewBox, svgRef]);

    // Snapping Logic
    const getSnapTargets = useCallback(() => {
        const targets: Point[] = [];
        shapes.forEach(s => s.vertices.forEach(v => targets.push({ x: v.x, y: v.y })));
        zones.forEach(z => z.vertices.forEach(v => targets.push({ x: v.x, y: v.y })));
        furniture.forEach(f => {
            targets.push({ x: f.x, y: f.y });
            if (f.type !== 'CHAIR_OFFICE' && f.type !== 'PLANT') {
                const hW = f.width / 2, hH = f.height / 2;
                targets.push({ x: f.x - hW, y: f.y - hH }, { x: f.x + hW, y: f.y - hH }, { x: f.x - hW, y: f.y + hH }, { x: f.x + hW, y: f.y + hH });
            }
        });
        texts.forEach(t => targets.push({ x: t.x, y: t.y }));
        wallItems.forEach(w => targets.push({ x: w.x, y: w.y }));
        return { targets };
    }, [shapes, zones, furniture, texts, wallItems]);

    const applySnapping = useCallback((point: Point, threshold = SNAP_THRESHOLD) => {
        // First apply grid snapping if enabled
        let workingPoint = { ...point };
        if (settings.gridSnap) {
            workingPoint = {
                x: snapToGrid(point.x, settings.gridSize),
                y: snapToGrid(point.y, settings.gridSize)
            };
        }

        const { targets } = getSnapTargets();
        const guidelines: GuideLine[] = [];
        let snapP: Point | null = null;
        const snapped = { ...workingPoint };
        let minDiffX = threshold, minDiffY = threshold;
        let closestX: number | null = null, closestY: number | null = null;

        targets.forEach(t => {
            const dx = Math.abs(workingPoint.x - t.x);
            if (dx < minDiffX) { minDiffX = dx; closestX = t.x; }
            const dy = Math.abs(workingPoint.y - t.y);
            if (dy < minDiffY) { minDiffY = dy; closestY = t.y; }
        });

        if (closestX !== null) {
            snapped.x = closestX;
            guidelines.push({ start: { x: closestX, y: viewBox.y }, end: { x: closestX, y: viewBox.y + viewBox.height }, axis: 'x' });
        }
        if (closestY !== null) {
            snapped.y = closestY;
            guidelines.push({ start: { x: viewBox.x, y: closestY }, end: { x: viewBox.x + viewBox.width, y: closestY }, axis: 'y' });
        }
        if (closestX !== null || closestY !== null) snapP = { x: snapped.x, y: snapped.y };

        // If grid snap is on and no object snap found, show grid snap point
        if (settings.gridSnap && !snapP) {
            snapP = workingPoint;
        }

        return { point: settings.gridSnap && !closestX && !closestY ? workingPoint : snapped, guidelines, snapPoint: snapP };
    }, [getSnapTargets, viewBox, settings.gridSnap, settings.gridSize]);

    // Edge-based snapping for moving shapes - snaps shape edges to other shape edges
    const applyEdgeSnapping = useCallback((
        movingBounds: { x: number; y: number; width: number; height: number },
        dx: number, dy: number,
        excludeIds: string[],
        threshold = SNAP_THRESHOLD
    ): { dx: number; dy: number; guidelines: GuideLine[] } => {
        const guidelines: GuideLine[] = [];
        let snapDx = dx, snapDy = dy;

        // Calculate where the shape WOULD be after the move
        const movedLeft = movingBounds.x - movingBounds.width / 2 + dx;
        const movedRight = movingBounds.x + movingBounds.width / 2 + dx;
        const movedTop = movingBounds.y - movingBounds.height / 2 + dy;
        const movedBottom = movingBounds.y + movingBounds.height / 2 + dy;
        const movedCenterX = movingBounds.x + dx;
        const movedCenterY = movingBounds.y + dy;

        // Collect target edges from other shapes
        const targetEdges: { x?: number; y?: number }[] = [];

        shapes.filter(s => !excludeIds.includes(s.id)).forEach(s => {
            const bounds = getPolygonBounds(s.vertices);
            targetEdges.push(
                { x: bounds.x }, { x: bounds.x + bounds.width }, { x: bounds.center.x },
                { y: bounds.y }, { y: bounds.y + bounds.height }, { y: bounds.center.y }
            );
        });

        zones.filter(z => !excludeIds.includes(z.id)).forEach(z => {
            const bounds = getPolygonBounds(z.vertices);
            targetEdges.push(
                { x: bounds.x }, { x: bounds.x + bounds.width }, { x: bounds.center.x },
                { y: bounds.y }, { y: bounds.y + bounds.height }, { y: bounds.center.y }
            );
        });

        furniture.filter(f => !excludeIds.includes(f.id)).forEach(f => {
            const hW = f.width / 2, hH = f.height / 2;
            targetEdges.push(
                { x: f.x - hW }, { x: f.x + hW }, { x: f.x },
                { y: f.y - hH }, { y: f.y + hH }, { y: f.y }
            );
        });

        // Check X alignment (left, right, center edges)
        let minDiffX = threshold;
        targetEdges.forEach(t => {
            if (t.x === undefined) return;
            // Check left edge
            const diffLeft = Math.abs(movedLeft - t.x);
            if (diffLeft < minDiffX) {
                minDiffX = diffLeft;
                snapDx = dx + (t.x - movedLeft);
                guidelines.push({ start: { x: t.x, y: viewBox.y }, end: { x: t.x, y: viewBox.y + viewBox.height }, axis: 'x' });
            }
            // Check right edge
            const diffRight = Math.abs(movedRight - t.x);
            if (diffRight < minDiffX) {
                minDiffX = diffRight;
                snapDx = dx + (t.x - movedRight);
                guidelines.push({ start: { x: t.x, y: viewBox.y }, end: { x: t.x, y: viewBox.y + viewBox.height }, axis: 'x' });
            }
            // Check center
            const diffCenter = Math.abs(movedCenterX - t.x);
            if (diffCenter < minDiffX) {
                minDiffX = diffCenter;
                snapDx = dx + (t.x - movedCenterX);
                guidelines.push({ start: { x: t.x, y: viewBox.y }, end: { x: t.x, y: viewBox.y + viewBox.height }, axis: 'x' });
            }
        });

        // Check Y alignment (top, bottom, center edges)
        let minDiffY = threshold;
        targetEdges.forEach(t => {
            if (t.y === undefined) return;
            // Check top edge
            const diffTop = Math.abs(movedTop - t.y);
            if (diffTop < minDiffY) {
                minDiffY = diffTop;
                snapDy = dy + (t.y - movedTop);
                guidelines.push({ start: { x: viewBox.x, y: t.y }, end: { x: viewBox.x + viewBox.width, y: t.y }, axis: 'y' });
            }
            // Check bottom edge
            const diffBottom = Math.abs(movedBottom - t.y);
            if (diffBottom < minDiffY) {
                minDiffY = diffBottom;
                snapDy = dy + (t.y - movedBottom);
                guidelines.push({ start: { x: viewBox.x, y: t.y }, end: { x: viewBox.x + viewBox.width, y: t.y }, axis: 'y' });
            }
            // Check center
            const diffCenter = Math.abs(movedCenterY - t.y);
            if (diffCenter < minDiffY) {
                minDiffY = diffCenter;
                snapDy = dy + (t.y - movedCenterY);
                guidelines.push({ start: { x: viewBox.x, y: t.y }, end: { x: viewBox.x + viewBox.width, y: t.y }, axis: 'y' });
            }
        });

        return { dx: snapDx, dy: snapDy, guidelines };
    }, [shapes, zones, furniture, viewBox]);

    // Initialization Helpers
    const initRoomCreation = useCallback((start: Point) => {
        const id = uuidv4();
        const vertices: RoomVertex[] = Array(4).fill(null).map(() => ({ id: uuidv4(), x: start.x, y: start.y, type: 'CORNER' as const }));
        addShape({
            id, type: ShapeType.POLYGON, vertices, label: `Room ${shapes.length + 1}`, zIndex: Z_INDEX.ROOM, color: DEFAULT_ROOM_COLOR, opacity: DEFAULT_ROOM_OPACITY, wallThickness: 0
        });
        setSelected([id]);
        return id;
    }, [shapes.length, addShape, setSelected]);

    const initZoneCreation = useCallback((start: Point) => {
        const id = uuidv4();
        const vertices: RoomVertex[] = Array(4).fill(null).map(() => ({ id: uuidv4(), x: start.x, y: start.y, type: 'CORNER' as const }));
        addZone({ id, vertices, label: `Zone ${zones.length + 1}`, color: DEFAULT_ZONE_COLOR, opacity: DEFAULT_ZONE_OPACITY, zIndex: Z_INDEX.ZONE });
        setSelected([id]);
        return id;
    }, [zones.length, addZone, setSelected]);

    const initFurnitureCreation = useCallback((start: Point) => {
        const id = uuidv4();
        const vertices: RoomVertex[] = Array(4).fill(null).map(() => ({ id: uuidv4(), x: start.x, y: start.y, type: 'CORNER' as const }));
        addFurniture({ id, type: 'CUSTOM', x: start.x, y: start.y, width: 0, height: 0, rotation: 0, vertices, zIndex: Z_INDEX.FURNITURE });
        setSelected([id]);
    }, [addFurniture, setSelected]);

    const createText = useCallback((center: Point) => {
        addText({ id: uuidv4(), x: center.x, y: center.y, text: 'New Text', fontSize: DEFAULT_TEXT_SIZE, color: DEFAULT_TEXT_COLOR, rotation: 0, zIndex: Z_INDEX.TEXT });
        setTool(Tool.SELECT);
    }, [addText, setTool]);

    const createWallItem = useCallback((center: Point, type: 'DOOR' | 'WINDOW') => {
        if (ghostWallItem && ghostWallItem.type === type) {
            addWallItem({ ...ghostWallItem, id: uuidv4() });
            return;
        }
        const match = getNearestWall(center, shapes, WALL_SNAP_THRESHOLD);
        if (!match) return;
        addWallItem({
            id: uuidv4(), type, x: match.point.x, y: match.point.y,
            width: type === 'DOOR' ? DEFAULT_DOOR_WIDTH : DEFAULT_WINDOW_WIDTH,
            height: type === 'DOOR' ? DEFAULT_DOOR_HEIGHT : DEFAULT_WINDOW_HEIGHT,
            rotation: match.angle, attachedTo: match.shapeId, zIndex: Z_INDEX.WALL_ITEM
        });
    }, [shapes, ghostWallItem, addWallItem]);

    // Handlers
    const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
        const point = getSVGPoint(e);
        setHasDragged(false);

        // Pan tool
        if (tool === Tool.PAN) {
            setDragStart(point);
            setDragAction('PANNING');
            setIsPanning(true);
            panStartViewBox.current = { x: viewBox.x, y: viewBox.y };
            return;
        }

        if (tool === Tool.FURNITURE && placingCustomFurniture) {
            initFurnitureCreation(point);
            setDragStart(point);
            setDragAction('CREATING_FURNITURE_CUSTOM');
            setPlacingCustomFurniture(false);
            return;
        }
        if (tool === Tool.PENCIL) {
            setSelected([]);
            setDragStart(point);
            setPendingDrawing([point]);
            setDragAction('DRAWING_FREEHAND');
            return;
        }
        if (tool === Tool.TEXT) { createText(point); return; }
        if (tool === Tool.DOOR) { createWallItem(point, 'DOOR'); return; }
        if (tool === Tool.WINDOW) { createWallItem(point, 'WINDOW'); return; }
        if (tool === Tool.ROOM) {
            initRoomCreation(point);
            setDragStart(point);
            setDragAction('CREATING_SHAPE');
            return;
        }
        if (tool === Tool.ZONE) {
            initZoneCreation(point);
            setDragStart(point);
            setDragAction('CREATING_ZONE');
            return;
        }
        if (tool === Tool.SELECT) {
            if (!e.shiftKey) { setSelected([]); movingChildrenIds.current = []; }
            setDragStart(point);
            setSelectionBox({ start: point, end: point });
            setDragAction('SELECTING_MARQUEE');
        }
    }, [tool, getSVGPoint, initFurnitureCreation, placingCustomFurniture, initRoomCreation, initZoneCreation, createText, createWallItem, setSelected, viewBox.x, viewBox.y]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const rawPoint = getSVGPoint(e);

        if (!dragStart) {
            setSnapLines([]); setSnapPoint(null);
            if (tool === Tool.DOOR || tool === Tool.WINDOW) {
                const match = getNearestWall(rawPoint, shapes, WALL_SNAP_THRESHOLD);
                if (match) {
                    setGhostWallItem({
                        id: 'ghost', type: tool === Tool.DOOR ? 'DOOR' : 'WINDOW',
                        x: match.point.x, y: match.point.y,
                        width: tool === Tool.DOOR ? DEFAULT_DOOR_WIDTH : DEFAULT_WINDOW_WIDTH,
                        height: tool === Tool.DOOR ? DEFAULT_DOOR_HEIGHT : DEFAULT_WINDOW_HEIGHT,
                        rotation: match.angle, attachedTo: match.shapeId, zIndex: 10
                    });
                } else setGhostWallItem(null);
            } else if (ghostWallItem) setGhostWallItem(null);
            return;
        }

        if (ghostWallItem) setGhostWallItem(null);

        // Handle panning
        if (dragAction === 'PANNING' && panStartViewBox.current) {
            const dx = (e.clientX - (svgRef.current?.getBoundingClientRect().left || 0)) * viewBox.width / (svgRef.current?.getBoundingClientRect().width || 1);
            const dy = (e.clientY - (svgRef.current?.getBoundingClientRect().top || 0)) * viewBox.height / (svgRef.current?.getBoundingClientRect().height || 1);
            const startDx = (dragStart.x - panStartViewBox.current.x);
            const startDy = (dragStart.y - panStartViewBox.current.y);
            setViewBox(prev => ({
                ...prev,
                x: panStartViewBox.current!.x + startDx - dx,
                y: panStartViewBox.current!.y + startDy - dy
            }));
            return;
        }

        const shouldSnap = dragAction && (dragAction.startsWith('MOVE_') && !dragAction.includes('VERTEX'));
        const { point, guidelines, snapPoint: currentSnapPoint } = shouldSnap ? applySnapping(rawPoint) : { point: rawPoint, guidelines: [], snapPoint: null };

        setSnapLines(guidelines);
        setSnapPoint(currentSnapPoint);

        if (distance(dragStart, point) > 5) setHasDragged(true);

        if (dragAction === 'DRAWING_FREEHAND') {
            let nextPoint = point;
            if (e.shiftKey && pendingDrawing.length > 0) {
                const lastPoint = pendingDrawing[pendingDrawing.length - 1];
                const dx = Math.abs(point.x - lastPoint.x);
                const dy = Math.abs(point.y - lastPoint.y);
                if (dx > dy) {
                    nextPoint = { ...point, y: lastPoint.y };
                } else {
                    nextPoint = { ...point, x: lastPoint.x };
                }
            }
            setPendingDrawing(prev => [...prev, nextPoint]);
        } else if (dragAction === 'CREATING_SHAPE' && selectedId) {
            // Constrain to square if shift is held
            let width = Math.abs(point.x - dragStart.x);
            let height = Math.abs(point.y - dragStart.y);
            if (e.shiftKey) {
                const size = Math.max(width, height);
                width = height = size;
            }
            const dirX = point.x >= dragStart.x ? 1 : -1;
            const dirY = point.y >= dragStart.y ? 1 : -1;
            const minX = dirX > 0 ? dragStart.x : dragStart.x - width;
            const maxX = dirX > 0 ? dragStart.x + width : dragStart.x;
            const minY = dirY > 0 ? dragStart.y : dragStart.y - height;
            const maxY = dirY > 0 ? dragStart.y + height : dragStart.y;
            const shape = shapes.find(s => s.id === selectedId);
            if (shape) {
                const newVertices = [
                    { ...shape.vertices[0], x: minX, y: minY },
                    { ...shape.vertices[1], x: maxX, y: minY },
                    { ...shape.vertices[2], x: maxX, y: maxY },
                    { ...shape.vertices[3], x: minX, y: maxY },
                ];
                setShapes(shapes.map(s => s.id === selectedId ? { ...s, vertices: newVertices } : s));
            }
        } else if (dragAction === 'CREATING_ZONE' && selectedId) {
            // Constrain to square if shift is held
            let width = Math.abs(point.x - dragStart.x);
            let height = Math.abs(point.y - dragStart.y);
            if (e.shiftKey) {
                const size = Math.max(width, height);
                width = height = size;
            }
            const dirX = point.x >= dragStart.x ? 1 : -1;
            const dirY = point.y >= dragStart.y ? 1 : -1;
            const minX = dirX > 0 ? dragStart.x : dragStart.x - width;
            const maxX = dirX > 0 ? dragStart.x + width : dragStart.x;
            const minY = dirY > 0 ? dragStart.y : dragStart.y - height;
            const maxY = dirY > 0 ? dragStart.y + height : dragStart.y;
            const zone = zones.find(z => z.id === selectedId);
            if (zone) {
                const newVertices = [
                    { ...zone.vertices[0], x: minX, y: minY },
                    { ...zone.vertices[1], x: maxX, y: minY },
                    { ...zone.vertices[2], x: maxX, y: maxY },
                    { ...zone.vertices[3], x: minX, y: maxY },
                ];
                setZones(zones.map(z => z.id === selectedId ? { ...z, vertices: newVertices } : z));
            }
        } else if (dragAction === 'CREATING_FURNITURE_CUSTOM' && selectedId) {
            // Constrain to square if shift is held
            let width = Math.abs(point.x - dragStart.x);
            let height = Math.abs(point.y - dragStart.y);
            if (e.shiftKey) {
                const size = Math.max(width, height);
                width = height = size;
            }
            const dirX = point.x >= dragStart.x ? 1 : -1;
            const dirY = point.y >= dragStart.y ? 1 : -1;
            const minX = dirX > 0 ? dragStart.x : dragStart.x - width;
            const maxX = dirX > 0 ? dragStart.x + width : dragStart.x;
            const minY = dirY > 0 ? dragStart.y : dragStart.y - height;
            const maxY = dirY > 0 ? dragStart.y + height : dragStart.y;
            const f = furniture.find(f => f.id === selectedId);
            if (f && f.vertices) {
                const newVertices = [
                    { ...f.vertices[0], x: minX, y: minY },
                    { ...f.vertices[1], x: maxX, y: minY },
                    { ...f.vertices[2], x: maxX, y: maxY },
                    { ...f.vertices[3], x: minX, y: maxY },
                ];
                const w = maxX - minX;
                const h = maxY - minY;
                updateFurniture(selectedId, { vertices: newVertices, width: w, height: h, x: minX + w / 2, y: minY + h / 2 });
            }
        } else if (dragAction === 'MOVE_WALL_ITEM' && selectedId) {
            const match = getNearestWall(point, shapes, 40);
            if (match) {
                updateWallItem(selectedId, { x: match.point.x, y: match.point.y, rotation: match.angle, attachedTo: match.shapeId });
            } else {
                const dx = point.x - dragStart.x;
                const dy = point.y - dragStart.y;
                const w = wallItems.find(i => i.id === selectedId);
                if (w) {
                    // Clear attachedTo when moving freely without snap
                    updateWallItem(selectedId, { x: w.x + dx, y: w.y + dy, attachedTo: undefined });
                }
            }
            setDragStart(point);
        } else if (dragAction && dragAction.startsWith('RESIZE_FURNITURE_')) {
            const handle = dragAction.replace('RESIZE_FURNITURE_', '');
            const f = furniture.find(f => f.id === selectedId);
            if (f) {
                const dx = point.x - dragStart.x;
                const dy = point.y - dragStart.y;

                let newWidth = f.width;
                let newHeight = f.height;
                let newX = f.x;
                let newY = f.y;

                // Handle resize based on handle position
                if (handle.includes('R')) {
                    newWidth = Math.max(20, f.width + dx);
                    newX = f.x + dx / 2;
                }
                if (handle.includes('L')) {
                    newWidth = Math.max(20, f.width - dx);
                    newX = f.x + dx / 2;
                }
                if (handle.includes('B')) {
                    newHeight = Math.max(20, f.height + dy);
                    newY = f.y + dy / 2;
                }
                if (handle.includes('T')) {
                    newHeight = Math.max(20, f.height - dy);
                    newY = f.y + dy / 2;
                }

                setFurniture(furniture.map(item =>
                    item.id === selectedId
                        ? { ...item, width: newWidth, height: newHeight, x: newX, y: newY }
                        : item
                ));
            }
            setDragStart(point);
        } else if (dragAction && dragAction.startsWith('RESIZE_WALL_ITEM_')) {
            const w = wallItems.find(item => item.id === selectedId);
            if (w) {
                // For wall items, we resize symmetrically from center based on distance
                // because they are attached to linear walls and rotated
                const dist = distance({ x: w.x, y: w.y }, point);
                const newWidth = Math.max(20, dist * 2);

                setWallItems(wallItems.map(item =>
                    item.id === selectedId ? { ...item, width: newWidth } : item
                ));
            }
            setDragStart(point);
        } else if (dragAction && dragAction.startsWith('MOVE_') && !dragAction.includes('VERTEX') && dragAction !== 'MOVE_WALL_ITEM') {
            let dx = point.x - dragStart.x;
            let dy = point.y - dragStart.y;

            // Get bounds of the first selected shape for edge-based snapping
            let movingBounds: { x: number; y: number; width: number; height: number } | null = null;
            const firstSelectedShape = shapes.find(s => selectedIds.includes(s.id));
            if (firstSelectedShape) {
                const bounds = getPolygonBounds(firstSelectedShape.vertices);
                movingBounds = { x: bounds.center.x, y: bounds.center.y, width: bounds.width, height: bounds.height };
            } else {
                const firstSelectedFurniture = furniture.find(f => selectedIds.includes(f.id));
                if (firstSelectedFurniture) {
                    movingBounds = { x: firstSelectedFurniture.x, y: firstSelectedFurniture.y, width: firstSelectedFurniture.width, height: firstSelectedFurniture.height };
                }
            }

            // Apply edge-based snapping if we have bounds
            if (movingBounds) {
                const { dx: snapDx, dy: snapDy, guidelines } = applyEdgeSnapping(movingBounds, dx, dy, selectedIds);
                dx = snapDx;
                dy = snapDy;
                setSnapLines(guidelines);
            }

            // Build the moving array BEFORE checking any items - includes selected + children
            const moving = [...selectedIds, ...movingChildrenIds.current];

            if (shapes.some(s => selectedIds.includes(s.id))) {
                setShapes(shapes.map(s => selectedIds.includes(s.id) ? { ...s, vertices: s.vertices.map(v => ({ ...v, x: v.x + dx, y: v.y + dy })) } : s));
            }
            // Zones should also use the moving array (they can be children of rooms)
            if (zones.some(z => moving.includes(z.id))) {
                setZones(zones.map(z => moving.includes(z.id) ? { ...z, vertices: z.vertices.map(v => ({ ...v, x: v.x + dx, y: v.y + dy })) } : z));
            }
            if (furniture.some(f => moving.includes(f.id))) {
                setFurniture(furniture.map(f => {
                    if (!moving.includes(f.id)) return f;
                    // For custom furniture, also update vertices
                    if (f.type === 'CUSTOM' && f.vertices) {
                        return {
                            ...f,
                            x: f.x + dx,
                            y: f.y + dy,
                            vertices: f.vertices.map(v => ({ ...v, x: v.x + dx, y: v.y + dy }))
                        };
                    }
                    return { ...f, x: f.x + dx, y: f.y + dy };
                }));
            }
            if (wallItems.some(w => moving.includes(w.id))) {
                setWallItems(wallItems.map(w => moving.includes(w.id) ? { ...w, x: w.x + dx, y: w.y + dy } : w));
            }
            if (texts.some(t => moving.includes(t.id))) {
                setTexts(texts.map(t => moving.includes(t.id) ? { ...t, x: t.x + dx, y: t.y + dy } : t));
            }
            setDragStart(point);
        } else if (dragAction && dragAction.startsWith('MOVE_VERTEX_')) {
            const vertexId = dragAction.replace('MOVE_VERTEX_', '');

            // Apply grid snapping to vertex
            let snappedPoint = { ...point };
            if (settings.gridSnap) {
                snappedPoint = {
                    x: snapToGrid(point.x, settings.gridSize),
                    y: snapToGrid(point.y, settings.gridSize)
                };
            }

            // Collect all other vertices for alignment snapping
            const allVertices: { x: number; y: number }[] = [];
            shapes.forEach(s => s.vertices.forEach(v => {
                if (v.id !== vertexId) allVertices.push({ x: v.x, y: v.y });
            }));
            zones.forEach(z => z.vertices.forEach(v => {
                if (v.id !== vertexId) allVertices.push({ x: v.x, y: v.y });
            }));

            // Snap to align with other vertices
            const alignThreshold = 10;
            const guidelines: GuideLine[] = [];

            allVertices.forEach(other => {
                // Horizontal alignment
                if (Math.abs(other.x - snappedPoint.x) < alignThreshold) {
                    snappedPoint.x = other.x;
                    guidelines.push({
                        start: { x: other.x, y: Math.min(other.y, snappedPoint.y) - 50 },
                        end: { x: other.x, y: Math.max(other.y, snappedPoint.y) + 50 },
                        axis: 'y'
                    });
                }
                // Vertical alignment
                if (Math.abs(other.y - snappedPoint.y) < alignThreshold) {
                    snappedPoint.y = other.y;
                    guidelines.push({
                        start: { x: Math.min(other.x, snappedPoint.x) - 50, y: other.y },
                        end: { x: Math.max(other.x, snappedPoint.x) + 50, y: other.y },
                        axis: 'x'
                    });
                }
            });

            setSnapLines(guidelines);

            const shapeIndex = shapes.findIndex(s => s.vertices.some(v => v.id === vertexId));
            if (shapeIndex >= 0) {
                const shape = shapes[shapeIndex];
                const newVertices = shape.vertices.map(v => v.id === vertexId ? { ...v, x: snappedPoint.x, y: snappedPoint.y } : v);
                updateShape(shape.id, { vertices: newVertices });
                return;
            }

            const zoneIndex = zones.findIndex(z => z.vertices.some(v => v.id === vertexId));
            if (zoneIndex >= 0) {
                const zone = zones[zoneIndex];
                const newVertices = zone.vertices.map(v => v.id === vertexId ? { ...v, x: snappedPoint.x, y: snappedPoint.y } : v);
                updateZone(zone.id, { vertices: newVertices });
                return;
            }

            const furnitureIndex = furniture.findIndex(f => f.type === 'CUSTOM' && f.vertices?.some(v => v.id === vertexId));
            if (furnitureIndex >= 0) {
                const f = furniture[furnitureIndex];
                if (f.vertices) {
                    const newVertices = f.vertices.map(v => v.id === vertexId ? { ...v, x: snappedPoint.x, y: snappedPoint.y } : v);
                    updateFurniture(f.id, { vertices: newVertices });
                    return;
                }
            }

        } else if (dragAction && dragAction.startsWith('ADJUST_RADIUS_')) {
            const vertexId = dragAction.replace('ADJUST_RADIUS_', '');

            // Helper to calculate radius with proper directional clamping
            const calculateNewRadius = (v: RoomVertex, vertices: RoomVertex[], vertexIndex: number): number => {
                const prev = vertices[(vertexIndex - 1 + vertices.length) % vertices.length];
                const next = vertices[(vertexIndex + 1) % vertices.length];

                // Calculate bisector direction
                // v1 and v2 point FROM vertex TO neighbors, so their sum points INWARD
                // The fillet curves into the room, so we use the INWARD direction
                const v1 = normalize(subtract(prev, v));
                const v2 = normalize(subtract(next, v));
                const inwardBisector = normalize(add(v1, v2));

                // Handle case where bisector is zero (opposite vectors - straight line)
                const bisectorLen = Math.sqrt(inwardBisector.x * inwardBisector.x + inwardBisector.y * inwardBisector.y);
                const dir = bisectorLen > 0.001 ? inwardBisector : { x: -v1.y, y: v1.x };

                // Project mouse position onto inward bisector direction
                const toMouse = subtract(point, v);
                const projection = dot(toMouse, dir);

                // Positive projection = dragging inward = increase radius
                // Negative projection = dragging outward = clamp to 0
                return Math.max(0, projection);
            };

            // Check in shapes first
            const shape = shapes.find(s => s.vertices.some(vtx => vtx.id === vertexId));
            if (shape) {
                const vertexIndex = shape.vertices.findIndex(vtx => vtx.id === vertexId);
                if (vertexIndex >= 0) {
                    const v = shape.vertices[vertexIndex];
                    const newRadius = calculateNewRadius(v, shape.vertices, vertexIndex);
                    // Set type based on radius - FILLET for rounded, CORNER for sharp
                    const newType = newRadius > 0 ? 'FILLET' : 'CORNER';
                    const newVertices = [...shape.vertices];
                    newVertices[vertexIndex] = { ...v, radius: newRadius, type: newType };
                    updateShape(shape.id, { vertices: newVertices });
                    return;
                }
            }

            // Check in zones
            const zone = zones.find(z => z.vertices.some(vtx => vtx.id === vertexId));
            if (zone) {
                const vertexIndex = zone.vertices.findIndex(vtx => vtx.id === vertexId);
                if (vertexIndex >= 0) {
                    const v = zone.vertices[vertexIndex];
                    const newRadius = calculateNewRadius(v, zone.vertices, vertexIndex);
                    // Set type based on radius - FILLET for rounded, CORNER for sharp
                    const newType = newRadius > 0 ? 'FILLET' : 'CORNER';
                    const newVertices = [...zone.vertices];
                    newVertices[vertexIndex] = { ...v, radius: newRadius, type: newType };
                    updateZone(zone.id, { vertices: newVertices });
                    return;
                }
            }

        } else if (dragAction === 'ROTATE_ROOM' && selectedId && dragStart) {
            const shape = shapes.find(s => s.id === selectedId);
            if (shape) {
                const bounds = getPolygonBounds(shape.vertices);
                const center = bounds.center;

                // Calculate angle from center to current point
                const angleNow = Math.atan2(point.y - center.y, point.x - center.x);
                const angleStart = Math.atan2(dragStart.y - center.y, dragStart.x - center.x);
                const angleDiff = (angleNow - angleStart) * 180 / Math.PI;

                // Rotate vertices around center
                const rad = angleDiff * Math.PI / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);

                const rotatePoint = (x: number, y: number) => ({
                    x: center.x + ((x - center.x) * cos - (y - center.y) * sin),
                    y: center.y + ((x - center.x) * sin + (y - center.y) * cos)
                });

                const rotatedVertices = shape.vertices.map(v => {
                    const rotated = rotatePoint(v.x, v.y);
                    return { ...v, x: rotated.x, y: rotated.y };
                });

                setShapes(shapes.map(s => s.id === selectedId ? { ...s, vertices: rotatedVertices, rotation: (s.rotation || 0) + angleDiff } : s));

                // Rotate child furniture (inside room bounds)
                setFurniture(furniture.map(f => {
                    if (isPointInPolygon({ x: f.x, y: f.y }, shape.vertices)) {
                        const rotated = rotatePoint(f.x, f.y);
                        return { ...f, x: rotated.x, y: rotated.y, rotation: (f.rotation || 0) + angleDiff };
                    }
                    return f;
                }));

                // Rotate child wall items (inside room bounds)
                setWallItems(wallItems.map(w => {
                    if (isPointInPolygon({ x: w.x, y: w.y }, shape.vertices)) {
                        const rotated = rotatePoint(w.x, w.y);
                        return { ...w, x: rotated.x, y: rotated.y, rotation: (w.rotation || 0) + angleDiff };
                    }
                    return w;
                }));

                // Rotate zones that are visually inside the room (check center)
                setZones(zones.map(z => {
                    const zoneBounds = getPolygonBounds(z.vertices);
                    if (isPointInPolygon(zoneBounds.center, shape.vertices)) {
                        // Rotate zone vertices around room center
                        const rotatedZoneVertices = z.vertices.map(v => {
                            const rotated = rotatePoint(v.x, v.y);
                            return { ...v, x: rotated.x, y: rotated.y };
                        });
                        return { ...z, vertices: rotatedZoneVertices, rotation: (z.rotation || 0) + angleDiff };
                    }
                    return z;
                }));

                setDragStart(point);
            }

        } else if (dragAction === 'ROTATE_ZONE' && selectedId && dragStart) {
            const zone = zones.find(z => z.id === selectedId);
            if (zone) {
                const bounds = getPolygonBounds(zone.vertices);
                const center = bounds.center;

                const angleNow = Math.atan2(point.y - center.y, point.x - center.x);
                const angleStart = Math.atan2(dragStart.y - center.y, dragStart.x - center.x);
                const angleDiff = (angleNow - angleStart) * 180 / Math.PI;

                const rad = angleDiff * Math.PI / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);

                const rotatedVertices = zone.vertices.map(v => {
                    const dx = v.x - center.x;
                    const dy = v.y - center.y;
                    return {
                        ...v,
                        x: center.x + (dx * cos - dy * sin),
                        y: center.y + (dx * sin + dy * cos)
                    };
                });

                setZones(zones.map(z => z.id === selectedId ? { ...z, vertices: rotatedVertices, rotation: (z.rotation || 0) + angleDiff } : z));
                setDragStart(point);
            }

        } else if (dragAction === 'SELECTING_MARQUEE' && selectionBox) {
            setSelectionBox({ ...selectionBox, end: point });
        }
    }, [
        dragStart, dragAction, selectedId, selectedIds, getSVGPoint, tool, ghostWallItem, shapes, zones, furniture, wallItems, texts,
        setViewBox, applySnapping, selectionBox, setShapes, setZones, setFurniture, setWallItems, setTexts, updateFurniture, updateWallItem, updateShape, updateZone, svgRef, viewBox.width, viewBox.height
    ]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (!dragStart && !isPanning) return;

        if (dragAction === 'PANNING') {
            setDragStart(null);
            setDragAction(null);
            setIsPanning(false);
            panStartViewBox.current = null;
            return;
        }

        if (dragAction === 'DRAWING_FREEHAND' && pendingDrawing.length > 1) {
            addDrawing({ id: uuidv4(), points: [...pendingDrawing], strokeColor: DEFAULT_STROKE_COLOR, strokeWidth: DEFAULT_STROKE_WIDTH, zIndex: Z_INDEX.ROOM });
            setGhostWallItem(null);
            setTool(Tool.SELECT);
        } else if (dragAction === 'CREATING_SHAPE' || dragAction === 'CREATING_ZONE' || dragAction === 'CREATING_FURNITURE_CUSTOM') {
            const currentPoint = getSVGPoint(e);
            if (selectedId && (!hasDragged || (dragStart && distance(dragStart, currentPoint) < 10))) {
                deleteSelected();
            } else {
                setTool(Tool.SELECT);
            }
            saveToHistory();
        } else if (dragAction === 'SELECTING_MARQUEE' && selectionBox) {
            const box = {
                x: Math.min(selectionBox.start.x, selectionBox.end.x),
                y: Math.min(selectionBox.start.y, selectionBox.end.y),
                width: Math.abs(selectionBox.end.x - selectionBox.start.x),
                height: Math.abs(selectionBox.end.y - selectionBox.start.y)
            };
            if (box.width > 5 && box.height > 5) {
                const newSel: string[] = [];
                const hit = (x: number, y: number) => x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
                shapes.forEach(s => { if (s.vertices.some(v => hit(v.x, v.y))) newSel.push(s.id); });
                zones.forEach(z => { if (z.vertices.some(v => hit(v.x, v.y))) newSel.push(z.id); });
                furniture.forEach(f => { if (hit(f.x, f.y)) newSel.push(f.id); });
                wallItems.forEach(w => { if (hit(w.x, w.y)) newSel.push(w.id); });
                texts.forEach(t => { if (hit(t.x, t.y)) newSel.push(t.id); });
                // Include drawings by checking if any point is within selection box
                drawings.forEach(d => { if (d.points.some(p => hit(p.x, p.y))) newSel.push(d.id); });
                setSelected(newSel);
            } else {
                setSelected([]);
            }
        } else if (hasDragged && dragAction && dragAction.startsWith('MOVE_')) {
            saveToHistory();
        }

        setDragStart(null);
        setDragAction(null);
        setSelectionBox(null);
        setPendingDrawing([]);
        setHasDragged(false);
        setIsPanning(false);
        panStartViewBox.current = null;
    }, [dragStart, dragAction, pendingDrawing, selectionBox, shapes, zones, furniture, wallItems, texts, getSVGPoint, selectedId, hasDragged, saveToHistory, addDrawing, deleteSelected, setTool, setSelected, isPanning]);

    return {
        // State
        snapLines, snapPoint, selectionBox, ghostWallItem, pendingDrawing, placingCustomFurniture,
        dragStart, dragAction, hasDragged, isPanning,
        setDragStart, setDragAction, setHasDragged, setPlacingCustomFurniture,

        // Methods
        getSVGPoint,
        initFurnitureCreation,

        // Handlers
        handleCanvasMouseDown,
        handleMouseMove,
        handleMouseUp,

        // Refs
        movingChildrenIdsRef: movingChildrenIds
    };
};
