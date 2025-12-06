'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import { RoomShape, Tool, AppMode, Point, RoomVertex, ShapeType, VertexType, FurnitureItem, ZoneShape, FurnitureType, WallItem, TextItem, FreehandPath, GuideLine } from '@/lib/types';
import { RoomShapeRenderer } from './RoomShape';
import { PropertiesPanel } from './PropertiesPanel';
import { FurnitureLibrary } from './FurnitureLibrary';
import { FurnitureRenderer } from './FurnitureRenderer';
import { ZoneRenderer } from './ZoneRenderer';
import { WallItemRenderer } from './WallItemRenderer';
import { TextRenderer } from './TextRenderer';
import { FreehandRenderer } from './FreehandRenderer';
import { GridLayer } from './layers/GridLayer';
import { ZoneLayer } from './layers/ZoneLayer';
import { RoomLayer } from './layers/RoomLayer';
import { FurnitureLayer } from './layers/FurnitureLayer';
import { WallItemLayer } from './layers/WallItemLayer';
import { AnnotationLayer } from './layers/AnnotationLayer';
import { InteractionLayer } from './layers/InteractionLayer';
import { distance, midpoint, snapPoint, getNearestSegmentPoint, isPointInPolygon, getPolygonBounds, scalePolygon, rotatePolygon, getNearestWall, getWallSegmentPoints } from '@/lib/geometry';


import { useStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';

interface CanvasProps { }

export const Canvas: React.FC<CanvasProps> = () => {
  // Select state from store
  const {
    // Data
    shapes,
    furniture,
    zones,
    wallItems,
    texts,
    drawings,

    // Selection
    selectedIds,

    // Helper State
    tool,
    mode,

    // Actions
    setTool,
    setMode,
    setSelected,
    toggleSelection,
    addShape,
    addZone,
    addFurniture,
    addWallItem,
    addText,
    addDrawing,
    updateShape,
    updateFurniture,
    updateZone,
    updateWallItem,
    updateText,
    updateDrawing,

    // History
    saveToHistory,
    deleteSelected,
    reorderItem
  } = useStore(useShallow(state => ({
    shapes: state.shapes,
    furniture: state.furniture,
    zones: state.zones,
    wallItems: state.wallItems,
    texts: state.texts,
    drawings: state.drawings,
    selectedIds: state.selectedIds,
    tool: state.tool,
    mode: state.mode,
    setTool: state.setTool,
    setMode: state.setMode,
    setSelected: state.setSelected,
    toggleSelection: state.toggleSelection,
    reorderItem: state.reorderItem,
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
    saveToHistory: state.saveToHistory,
    deleteSelected: state.deleteSelected
  })));

  // Derived state for backward compatibility / single selection UI
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : (selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null);

  const getItemType = useCallback((id: string) => {
    if (shapes.some(s => s.id === id)) return 'ROOM';
    if (zones.some(z => z.id === id)) return 'ZONE';
    if (furniture.some(f => f.id === id)) return 'FURNITURE';
    if (wallItems.some(w => w.id === id)) return 'WALL_ITEM';
    if (texts.some(t => t.id === id)) return 'TEXT';
    if (drawings.some(d => d.id === id)) return 'DRAWING';
    return null;
  }, [shapes, zones, furniture, wallItems, texts, drawings]);

  const selectedType = selectedId ? getItemType(selectedId) : null;

  // --- VIEW STATE ---
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, scale: 1, width: 1200, height: 800 });

  // --- UI STATE ---
  const [selectionMenuPos, setSelectionMenuPos] = useState<{ x: number, y: number } | null>(null);
  const [showFurnitureLibrary, setShowFurnitureLibrary] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);

  // Use Interaction Hook
  const {
    snapLines, snapPoint: activeSnapPoint, selectionBox, ghostWallItem, pendingDrawing, placingCustomFurniture,
    setDragStart, setDragAction, setHasDragged, setPlacingCustomFurniture,
    getSVGPoint,
    handleCanvasMouseDown, handleMouseMove, handleMouseUp,
    movingChildrenIdsRef
  } = useCanvasInteraction(svgRef, viewBox, setViewBox);

  // Keyboard Delete & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent deletion if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only delete if we are not editing text (simple check for now)
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected]);

  // Update viewBox dimensions on mount and resize
  useEffect(() => {
    const updateViewBox = () => {
      if (typeof window !== 'undefined') {
        setViewBox(prev => ({
          ...prev,
          width: window.innerWidth / prev.scale,
          height: window.innerHeight / prev.scale
        }));
      }
    };

    updateViewBox();
    window.addEventListener('resize', updateViewBox);
    return () => window.removeEventListener('resize', updateViewBox);
  }, []);

  // Show/hide furniture library based on tool
  useEffect(() => {
    setShowFurnitureLibrary(tool === Tool.FURNITURE);
  }, [tool]);

  // Handle Rotation Start (kept in Canvas or moved? Kept for now to interact with local handlers if needed,
  // but could move to hook. For now, let's keep specific handlers that rely on setDragStart/Action from hook)
  const handleRotationStart = useCallback((objectType: 'FURNITURE' | 'WALL_ITEM' | 'TEXT', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedId) return;

    const pos = getSVGPoint(e);
    setDragStart(pos);
    setDragAction(`ROTATE_${objectType}`);
  }, [selectedId, getSVGPoint, setDragStart, setDragAction]);

  const handleResizeStart = useCallback((objectType: 'FURNITURE' | 'WALL_ITEM', handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedId) return;

    const pos = getSVGPoint(e);
    setDragStart(pos);
    setDragAction(`RESIZE_${objectType}_${handle}`);
  }, [selectedId, getSVGPoint, setDragStart, setDragAction]);

  // Property Updates
  const handlePropertyUpdate = useCallback((field: string, value: string | number | boolean) => {
    if (!selectedId) return;
    const isSharedProperty = ['color', 'opacity', 'zIndex', 'fontSize', 'strokeWidth', 'strokeColor'].includes(field);
    const targetIds = isSharedProperty ? selectedIds : [selectedId];

    targetIds.forEach(id => {
      const type = getItemType(id);
      if (type === 'ROOM') {
        const shape = shapes.find(s => s.id === id);
        if (shape) {
          if (['x', 'y', 'width', 'height', 'rotation'].includes(field)) {
            // Geometry updates...
            if (field === 'x' || field === 'y') {
              const bounds = getPolygonBounds(shape.vertices);
              const dx = field === 'x' ? (value as number) - bounds.center.x : 0;
              const dy = field === 'y' ? (value as number) - bounds.center.y : 0;
              updateShape(id, { vertices: shape.vertices.map(v => ({ ...v, x: v.x + dx, y: v.y + dy })) });
            } else if (field === 'rotation') {
              const bounds = getPolygonBounds(shape.vertices);
              const rotatedVertices = rotatePolygon(shape.vertices, (value as number) - (shape.rotation || 0), bounds.center);
              updateShape(id, { vertices: rotatedVertices, rotation: value as number });
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } else updateShape(id, { [field]: value } as any);
        }
      } else if (type === 'ZONE') {
        const zone = zones.find(z => z.id === id);
        if (zone) {
          if (field === 'x' || field === 'y') {
            const bounds = getPolygonBounds(zone.vertices);
            const dx = field === 'x' ? (value as number) - bounds.center.x : 0;
            const dy = field === 'y' ? (value as number) - bounds.center.y : 0;
            updateZone(id, { vertices: zone.vertices.map(v => ({ ...v, x: v.x + dx, y: v.y + dy })) });
          } else if (field === 'rotation') {
            const bounds = getPolygonBounds(zone.vertices);
            const rotatedVertices = rotatePolygon(zone.vertices, (value as number) - (zone.rotation || 0), bounds.center);
            updateZone(id, { vertices: rotatedVertices, rotation: value as number });
          }
          else updateZone(id, { [field]: value });
        }
      } else if (type === 'FURNITURE') updateFurniture(id, { [field]: value });
      else if (type === 'WALL_ITEM') updateWallItem(id, { [field]: value });
      else if (type === 'TEXT') updateText(id, { [field]: value });
      else if (type === 'DRAWING') updateDrawing(id, { [field]: value });
    });
  }, [selectedId, selectedIds, shapes, zones, furniture, wallItems, texts, drawings, getItemType, updateShape, updateZone, updateFurniture, updateWallItem, updateText, updateDrawing]);

  // Handle furniture selection from library
  const handleFurnitureSelect = useCallback((type: FurnitureType, width: number, height: number) => {
    if (type === 'CUSTOM') {
      setPlacingCustomFurniture(true);
      return;
    }
    const center = { x: viewBox.x + viewBox.width / 2, y: viewBox.y + viewBox.height / 2 };
    addFurniture({
      id: uuidv4(), type, x: center.x, y: center.y, width, height, rotation: 0, zIndex: 2
    });
  }, [viewBox, addFurniture, setPlacingCustomFurniture]);

  // Handlers for specific items (passing e and id)
  // Note: These use setDragStart/Action from hook
  const handleShapeMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const point = getSVGPoint(e);
    if (!e.shiftKey) setSelected([id]);
    else toggleSelection(id, true);

    // Parent-Child Logic: Find children inside this room
    const shape = shapes.find(s => s.id === id);
    const children: string[] = [];
    if (shape) {
      furniture.forEach(f => { if (isPointInPolygon({ x: f.x, y: f.y }, shape.vertices)) children.push(f.id); });
      texts.forEach(t => { if (isPointInPolygon({ x: t.x, y: t.y }, shape.vertices)) children.push(t.id); });
      wallItems.forEach(w => { if (w.attachedTo === id) children.push(w.id); });
    }
    movingChildrenIdsRef.current = children;

    setDragStart(point);
    setDragAction('MOVE_SHAPE');
  }, [getSVGPoint, setSelected, toggleSelection, setDragStart, setDragAction, shapes, furniture, texts, movingChildrenIdsRef]);

  const handleZoneMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const point = getSVGPoint(e);
    if (!e.shiftKey) setSelected([id]); else toggleSelection(id, true);
    setDragStart(point);
    setDragAction('MOVE_ZONE');
  }, [getSVGPoint, setSelected, toggleSelection, setDragStart, setDragAction]);

  const handleFurnitureMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const point = getSVGPoint(e);
    if (!e.shiftKey) setSelected([id]); else toggleSelection(id, true);
    setDragStart(point);
    setDragAction('MOVE_FURNITURE');
  }, [getSVGPoint, setSelected, toggleSelection, setDragStart, setDragAction]);

  const handleWallItemMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const point = getSVGPoint(e);
    if (!e.shiftKey) setSelected([id]); else toggleSelection(id, true);
    setDragStart(point);
    setDragAction('MOVE_WALL_ITEM');
  }, [getSVGPoint, setSelected, toggleSelection, setDragStart, setDragAction]);

  const handleTextMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const point = getSVGPoint(e);
    if (!e.shiftKey) setSelected([id]); else toggleSelection(id, true);
    setDragStart(point);
    setDragAction('MOVE_TEXT');
  }, [getSVGPoint, setSelected, toggleSelection, setDragStart, setDragAction]);

  const handleDrawingMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Do nothing for now or select
    if (!e.shiftKey) setSelected([id]); else toggleSelection(id, true);
  }, [setSelected, toggleSelection]);

  const handleVertexMouseDown = useCallback((vertexId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const point = getSVGPoint(e);
    setDragStart(point);
    setDragAction(`MOVE_VERTEX_${vertexId}`);
  }, [getSVGPoint, setDragStart, setDragAction]);

  const handleVertexClick = useCallback((vertexId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Toggle vertex type
    if (selectedId && selectedType === 'ROOM') {
      const shape = shapes.find(s => s.id === selectedId);
      if (shape) {
        const newVertices = shape.vertices.map(v => v.id === vertexId ? {
          ...v,
          type: v.type === 'CORNER' ? 'FILLET' as const : 'CORNER' as const,
          radius: v.type === 'CORNER' ? 10 : undefined
        } : v);
        updateShape(selectedId, { vertices: newVertices });
        saveToHistory();
      }
    } else if (selectedId && selectedType === 'ZONE') {
      const zone = zones.find(z => z.id === selectedId);
      if (zone) {
        const newVertices = zone.vertices.map(v => v.id === vertexId ? {
          ...v,
          type: v.type === 'CORNER' ? 'FILLET' as const : 'CORNER' as const,
          radius: v.type === 'CORNER' ? 10 : undefined
        } : v);
        updateZone(selectedId, { vertices: newVertices });
        saveToHistory();
      }
    }
  }, [selectedId, selectedType, shapes, zones, updateShape, updateZone, saveToHistory]);

  const handleEdgeMouseDown = useCallback((vertexIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedId) return;

    // Split edge
    if (selectedType === 'ROOM') {
      const s = shapes.find(s => s.id === selectedId);
      if (s) {
        const v1 = s.vertices[vertexIndex];
        const v2 = s.vertices[(vertexIndex + 1) % s.vertices.length];
        const mid = midpoint(v1, v2);
        const newVertex: RoomVertex = { id: uuidv4(), x: mid.x, y: mid.y, type: 'CORNER' };
        const newVertices = [...s.vertices];
        newVertices.splice(vertexIndex + 1, 0, newVertex);
        updateShape(selectedId, { vertices: newVertices });
        saveToHistory();
      }
    } else if (selectedType === 'ZONE') {
      const z = zones.find(z => z.id === selectedId);
      if (z) {
        const v1 = z.vertices[vertexIndex];
        const v2 = z.vertices[(vertexIndex + 1) % z.vertices.length];
        const mid = midpoint(v1, v2);
        const newVertex: RoomVertex = { id: uuidv4(), x: mid.x, y: mid.y, type: 'CORNER' };
        const newVertices = [...z.vertices];
        newVertices.splice(vertexIndex + 1, 0, newVertex);
        updateZone(selectedId, { vertices: newVertices });
        saveToHistory();
      }
    }
  }, [selectedId, selectedType, shapes, zones, updateShape, updateZone, saveToHistory]);

  const handleRadiusHandleMouseDown = useCallback((vertexId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const point = getSVGPoint(e);
    setDragStart(point);
    setDragAction(`ADJUST_RADIUS_${vertexId}`);
  }, [getSVGPoint, setDragStart, setDragAction]);

  // useMemo removed as render loop is now decomposed into layers


  // Keyboard Delete & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent deletion if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only delete if we are not editing text (simple check for now)
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected]);

  // Update viewBox dimensions on mount and resize
  useEffect(() => {
    const updateViewBox = () => {
      if (typeof window !== 'undefined') {
        setViewBox(prev => ({
          ...prev,
          width: window.innerWidth / prev.scale,
          height: window.innerHeight / prev.scale
        }));
      }
    };

    updateViewBox();
    window.addEventListener('resize', updateViewBox);
    return () => window.removeEventListener('resize', updateViewBox);
  }, []);

  // Show/hide furniture library based on tool
  useEffect(() => {
    setShowFurnitureLibrary(tool === Tool.FURNITURE);
  }, [tool]);







  // Derived item for panel
  const getSelectedItemForPanel = () => {
    if (!selectedId) return null;
    const type = selectedType;
    if (type === 'ROOM') return shapes.find(s => s.id === selectedId) || null;
    if (type === 'ZONE') return zones.find(z => z.id === selectedId) || null;
    if (type === 'FURNITURE') return furniture.find(f => f.id === selectedId) || null;
    if (type === 'WALL_ITEM') return wallItems.find(w => w.id === selectedId) || null;
    if (type === 'TEXT') return texts.find(t => t.id === selectedId) || null;
    if (type === 'DRAWING') return drawings.find(d => d.id === selectedId) || null;
    return null;
  };

  const selectedItemForPanel = getSelectedItemForPanel();

  return (
    <div className="w-full h-full bg-grid relative">
      {/* ... svg ... */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-crosshair"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        xmlns="http://www.w3.org/2000/svg"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const type = e.dataTransfer.getData('furniture-type');
          const w = parseFloat(e.dataTransfer.getData('furniture-width'));
          const h = parseFloat(e.dataTransfer.getData('furniture-height'));

          if (type && !isNaN(w) && !isNaN(h)) {
            const point = getSVGPoint(e);
            const newFurniture: FurnitureItem = {
              id: uuidv4(),
              type: type as FurnitureType,
              x: point.x,
              y: point.y,
              width: w,
              height: h,
              rotation: 0,
              zIndex: 2
            };
            addFurniture(newFurniture);
          }
        }}
      >
        <GridLayer viewBox={viewBox} />

        <ZoneLayer
          zones={zones}
          selectedIds={selectedIds}
          mode={mode}
          onMouseDown={(e, id) => handleZoneMouseDown(e, id)}
          onDoubleClick={() => setMode(AppMode.VERTEX_EDIT)}
          onVertexMouseDown={handleVertexMouseDown}
          onEdgeMouseDown={handleEdgeMouseDown}
        />

        <RoomLayer
          shapes={shapes}
          selectedIds={selectedIds}
          mode={mode}
          onMouseDown={handleShapeMouseDown}
          onDoubleClick={() => setMode(AppMode.VERTEX_EDIT)}
          onVertexMouseDown={handleVertexMouseDown}
          onVertexClick={handleVertexClick}
          onEdgeMouseDown={handleEdgeMouseDown}
          onRadiusHandleMouseDown={handleRadiusHandleMouseDown}
        />

        <FurnitureLayer
          furniture={furniture}
          selectedIds={selectedIds}
          onMouseDown={handleFurnitureMouseDown}
          onRotationStart={(e) => handleRotationStart('FURNITURE', e)}
          onResizeStart={(handle, e) => handleResizeStart('FURNITURE', handle, e)}
        />

        <WallItemLayer
          wallItems={wallItems}
          selectedIds={selectedIds}
          onMouseDown={handleWallItemMouseDown}
          onRotationStart={(e) => handleRotationStart('WALL_ITEM', e)}
          onResizeStart={(handle, e) => handleResizeStart('WALL_ITEM', handle, e)}
        />

        <AnnotationLayer
          texts={texts}
          drawings={drawings}
          selectedIds={selectedIds}
          onTextMouseDown={handleTextMouseDown}
          onTextRotationStart={(e) => handleRotationStart('TEXT', e)}
          onDrawingMouseDown={handleDrawingMouseDown}
          pendingDrawing={pendingDrawing}
        />

        <InteractionLayer
          snapLines={snapLines}
          snapPoint={activeSnapPoint}
          selectionBox={selectionBox}
          ghostWallItem={ghostWallItem}
        />
      </svg>

      {/* UI Overlays */}
      {showFurnitureLibrary && (
        <FurnitureLibrary onSelectItem={handleFurnitureSelect} />
      )}

      {/* Properties Panel replaces SelectionMenu */}
      {selectedItemForPanel && selectedType && (
        <PropertiesPanel
          selectedItem={selectedItemForPanel}
          type={selectedType}
          onUpdate={handlePropertyUpdate}
          onDelete={deleteSelected}
          onReorder={reorderItem}
        />
      )}
    </div>
  );
};