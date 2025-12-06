import { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import {
    Point, Tool, RoomVertex, ShapeType, FurnitureItem, ZoneShape,
    WallItem, TextItem, FreehandPath, GuideLine, RoomShape
} from '@/lib/types';
import {
    distance, getNearestWall, isPointInPolygon, getPolygonBounds
} from '@/lib/geometry';

export const useCanvasInteraction = (
    svgRef: React.RefObject<SVGSVGElement | null>,
    viewBox: { x: number, y: number, scale: number, width: number, height: number },
    setViewBox: React.Dispatch<React.SetStateAction<{ x: number, y: number, scale: number, width: number, height: number }>>
) => {
    const {
        shapes, furniture, zones, wallItems, texts,
        tool, setTool,
        selectedIds, setSelected, toggleSelection,
        addShape, addZone, addFurniture, addWallItem, addText, addDrawing,
        updateShape, updateFurniture, updateZone, updateWallItem, updateText, updateDrawing,
        setShapes, setZones, setFurniture, setWallItems, setTexts,
        deleteSelected, saveToHistory
    } = useStore(useShallow(state => ({
        shapes: state.shapes,
        furniture: state.furniture,
        zones: state.zones,
        wallItems: state.wallItems,
        texts: state.texts,
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
        saveToHistory: state.saveToHistory
    })));

    const selectedId = selectedIds.length === 1 ? selectedIds[0] : (selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null);

    const getItemType = useCallback((id: string) => {
        if (shapes.some(s => s.id === id)) return 'ROOM';
        if (zones.some(z => z.id === id)) return 'ZONE';
        if (furniture.some(f => f.id === id)) return 'FURNITURE';
        if (wallItems.some(w => w.id === id)) return 'WALL_ITEM';
        if (texts.some(t => t.id === id)) return 'TEXT';
        return null; // Drawing not strictly needed for move logic yet
    }, [shapes, zones, furniture, wallItems, texts]);

    const selectedType = selectedId ? getItemType(selectedId) : null;

    // Interaction State
    const [dragStart, setDragStart] = useState<Point | null>(null);
    const [dragAction, setDragAction] = useState<string | null>(null);
    const [hasDragged, setHasDragged] = useState(false);
    const [selectionBox, setSelectionBox] = useState<{ start: Point; end: Point } | null>(null);
    const [pendingDrawing, setPendingDrawing] = useState<Point[]>([]);
    const [ghostWallItem, setGhostWallItem] = useState<WallItem | null>(null);
    const [placingCustomFurniture, setPlacingCustomFurniture] = useState(false);
    const [snapLines, setSnapLines] = useState<GuideLine[]>([]);
    const [snapPoint, setSnapPoint] = useState<Point | null>(null);

    const movingChildrenIds = useRef<string[]>([]);

    // SVG Point Helper
    const getSVGPoint = useCallback((e: React.MouseEvent): Point => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        return {
            x: viewBox.x + (e.clientX - rect.left) * viewBox.width / rect.width,
            y: viewBox.y + (e.clientY - rect.top) * viewBox.height / rect.height
        };
    }, [viewBox]);

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

    const applySnapping = useCallback((point: Point, threshold = 15) => {
        const { targets } = getSnapTargets();
        const guidelines: GuideLine[] = [];
        let snapP: Point | null = null;
        let snapped = { ...point };
        let minDiffX = threshold, minDiffY = threshold;
        let closestX: number | null = null, closestY: number | null = null;

        targets.forEach(t => {
            const dx = Math.abs(point.x - t.x);
            if (dx < minDiffX) { minDiffX = dx; closestX = t.x; }
            const dy = Math.abs(point.y - t.y);
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

        return { point: snapped, guidelines, snapPoint: snapP };
    }, [getSnapTargets, viewBox]);

    // Initialization Helpers
    const initRoomCreation = useCallback((start: Point) => {
        const id = uuidv4();
        const vertices: RoomVertex[] = Array(4).fill(null).map(() => ({ id: uuidv4(), x: start.x, y: start.y, type: 'CORNER' }));
        addShape({
            id, type: ShapeType.POLYGON, vertices, label: `Room ${shapes.length + 1}`, zIndex: 1, color: '#ffffff', opacity: 0.9, wallThickness: 0
        });
        setSelected([id]);
        return id;
    }, [shapes.length, addShape, setSelected]);

    const initZoneCreation = useCallback((start: Point) => {
        const id = uuidv4();
        const vertices: RoomVertex[] = Array(4).fill(null).map(() => ({ id: uuidv4(), x: start.x, y: start.y, type: 'CORNER' }));
        addZone({ id, vertices, label: `Zone ${zones.length + 1}`, color: '#b9fbc0', opacity: 0.4, zIndex: 10 });
        setSelected([id]);
        return id;
    }, [zones.length, addZone, setSelected]);

    const initFurnitureCreation = useCallback((start: Point) => {
        const id = uuidv4();
        const vertices: RoomVertex[] = Array(4).fill(null).map(() => ({ id: uuidv4(), x: start.x, y: start.y, type: 'CORNER' }));
        addFurniture({ id, type: 'CUSTOM', x: start.x, y: start.y, width: 0, height: 0, rotation: 0, vertices, zIndex: 2 });
        setSelected([id]);
    }, [addFurniture, setSelected]);

    const createText = useCallback((center: Point) => {
        addText({ id: uuidv4(), x: center.x, y: center.y, text: 'New Text', fontSize: 16, color: '#1a1a1a', rotation: 0, zIndex: 3 });
    }, [addText]);

    const createWallItem = useCallback((center: Point, type: 'DOOR' | 'WINDOW') => {
        if (ghostWallItem && ghostWallItem.type === type) {
            addWallItem({ ...ghostWallItem, id: uuidv4() });
            return;
        }
        const match = getNearestWall(center, shapes, 30);
        if (!match) return;
        addWallItem({
            id: uuidv4(), type, x: match.point.x, y: match.point.y,
            width: type === 'DOOR' ? 80 : 120, height: 20, rotation: match.angle, attachedTo: match.shapeId, zIndex: 2
        });
    }, [shapes, ghostWallItem, addWallItem]);


    // Handlers
    const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
        const point = getSVGPoint(e);
        setHasDragged(false);

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
        if (tool === Tool.PAN) { setDragStart(point); return; }
        if (tool === Tool.SELECT) {
            if (!e.shiftKey) { setSelected([]); movingChildrenIds.current = []; }
            setDragStart(point);
            setSelectionBox({ start: point, end: point });
            setDragAction('SELECTING_MARQUEE');
        }
    }, [tool, getSVGPoint, initFurnitureCreation, placingCustomFurniture, initRoomCreation, initZoneCreation, createText, createWallItem, setSelected]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const rawPoint = getSVGPoint(e);

        if (!dragStart) {
            setSnapLines([]); setSnapPoint(null);
            if (tool === Tool.DOOR || tool === Tool.WINDOW) {
                const match = getNearestWall(rawPoint, shapes, 30);
                if (match) {
                    setGhostWallItem({
                        id: 'ghost', type: tool === Tool.DOOR ? 'DOOR' : 'WINDOW',
                        x: match.point.x, y: match.point.y, width: tool === Tool.DOOR ? 80 : 120, height: 20,
                        rotation: match.angle, attachedTo: match.shapeId, zIndex: 10
                    });
                } else setGhostWallItem(null);
            } else if (ghostWallItem) setGhostWallItem(null);
            return;
        }

        if (ghostWallItem) setGhostWallItem(null);

        const shouldSnap = dragAction && (dragAction.startsWith('MOVE_') && !dragAction.includes('VERTEX'));
        const { point, guidelines, snapPoint: currentSnapPoint } = shouldSnap ? applySnapping(rawPoint) : { point: rawPoint, guidelines: [], snapPoint: null };

        setSnapLines(guidelines);
        setSnapPoint(currentSnapPoint);

        if (distance(dragStart, point) > 5) setHasDragged(true);

        if (dragAction === 'DRAWING_FREEHAND') {
            setPendingDrawing(prev => [...prev, point]);
        } else if (dragAction === 'PANNING') {
            const dx = point.x - dragStart.x;
            const dy = point.y - dragStart.y;
            setViewBox(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
        } else if (dragAction === 'CREATING_SHAPE' && selectedId) {
            // Find existing logic for creating shape (drag corner)
            // Re-implementing simplified logic here for brevity, matching Canvas.tsx
            const minX = Math.min(dragStart.x, point.x);
            const maxX = Math.max(dragStart.x, point.x);
            const minY = Math.min(dragStart.y, point.y);
            const maxY = Math.max(dragStart.y, point.y);
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
            const minX = Math.min(dragStart.x, point.x);
            const maxX = Math.max(dragStart.x, point.x);
            const minY = Math.min(dragStart.y, point.y);
            const maxY = Math.max(dragStart.y, point.y);
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
            const minX = Math.min(dragStart.x, point.x);
            const maxX = Math.max(dragStart.x, point.x);
            const minY = Math.min(dragStart.y, point.y);
            const maxY = Math.max(dragStart.y, point.y);
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
                if (w) updateWallItem(selectedId, { x: w.x + dx, y: w.y + dy });
            }
            setDragStart(point);
        } else if (dragAction && dragAction.startsWith('MOVE_') && !dragAction.includes('VERTEX') && dragAction !== 'MOVE_WALL_ITEM') {
            const dx = point.x - dragStart.x;
            const dy = point.y - dragStart.y;

            // Batch updates for performance? Or just simple map.
            if (shapes.some(s => selectedIds.includes(s.id))) {
                setShapes(shapes.map(s => selectedIds.includes(s.id) ? { ...s, vertices: s.vertices.map(v => ({ ...v, x: v.x + dx, y: v.y + dy })) } : s));
            }
            if (zones.some(z => selectedIds.includes(z.id))) {
                setZones(zones.map(z => selectedIds.includes(z.id) ? { ...z, vertices: z.vertices.map(v => ({ ...v, x: v.x + dx, y: v.y + dy })) } : z));
            }
            // Furniture + Siblings
            const moving = [...selectedIds, ...movingChildrenIds.current];
            if (furniture.some(f => moving.includes(f.id))) {
                setFurniture(furniture.map(f => moving.includes(f.id) ? { ...f, x: f.x + dx, y: f.y + dy } : f));
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

            // Check Shapes
            const shapeIndex = shapes.findIndex(s => s.vertices.some(v => v.id === vertexId));
            if (shapeIndex >= 0) {
                const shape = shapes[shapeIndex];
                const newVertices = shape.vertices.map(v => v.id === vertexId ? { ...v, x: point.x, y: point.y } : v);
                updateShape(shape.id, { vertices: newVertices });
                return;
            }

            // Check Zones
            const zoneIndex = zones.findIndex(z => z.vertices.some(v => v.id === vertexId));
            if (zoneIndex >= 0) {
                const zone = zones[zoneIndex];
                const newVertices = zone.vertices.map(v => v.id === vertexId ? { ...v, x: point.x, y: point.y } : v);
                updateZone(zone.id, { vertices: newVertices });
                return;
            }

        } else if (dragAction && dragAction.startsWith('ADJUST_RADIUS_')) {
            const vertexId = dragAction.replace('ADJUST_RADIUS_', '');
            const shape = shapes.find(s => s.id === selectedId);
            if (shape) {
                const vertexIndex = shape.vertices.findIndex(v => v.id === vertexId);
                if (vertexIndex >= 0) {
                    const v = shape.vertices[vertexIndex];
                    const dist = distance({ x: v.x, y: v.y }, point);
                    const newVertices = [...shape.vertices];
                    newVertices[vertexIndex] = { ...v, radius: Math.max(0, dist) };
                    updateShape(shape.id, { vertices: newVertices });
                }
            }

        } else if (dragAction === 'SELECTING_MARQUEE' && selectionBox) {
            setSelectionBox({ ...selectionBox, end: point });
        }
        // Note: VERTEX move, ROTATE, RESIZE logic omitted for brevity in this initial port, can be added or kept in Canvas.
        // Ideally should be here.
    }, [
        dragStart, dragAction, selectedId, selectedIds, getSVGPoint, tool, ghostWallItem, shapes, zones, furniture, wallItems, texts,
        setViewBox, applySnapping, selectionBox, setShapes, setZones, setFurniture, setWallItems, setTexts, updateFurniture, updateWallItem
    ]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (!dragStart) return;
        if (dragAction === 'PANNING') { setDragStart(null); setDragAction(null); return; }

        if (dragAction === 'DRAWING_FREEHAND' && pendingDrawing.length > 1) {
            addDrawing({ id: uuidv4(), points: [...pendingDrawing], strokeColor: '#1a1a1a', strokeWidth: 2, zIndex: 1 });
            setGhostWallItem(null);
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
                setSelected(newSel);
            } else {
                setSelected([]);
            }
        }

        setDragStart(null);
        setDragAction(null);
        setSelectionBox(null);
        setPendingDrawing([]);
        setHasDragged(false);
        saveToHistory();
    }, [dragStart, dragAction, pendingDrawing, selectionBox, shapes, zones, furniture, wallItems, texts, getSVGPoint, selectedId, hasDragged, saveToHistory, addDrawing, deleteSelected, setTool, setSelected]);

    return {
        // State
        snapLines, snapPoint, selectionBox, ghostWallItem, pendingDrawing, placingCustomFurniture,
        dragStart, dragAction, hasDragged,
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
