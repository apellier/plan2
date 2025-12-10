import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { RoomShape, ZoneShape, FurnitureItem, WallItem, TextItem, FreehandPath, Tool, AppMode, Measurement, Point } from './types';
import { MAX_HISTORY_SIZE, UnitSystem, MetricUnit, ImperialUnit, DEFAULT_UNIT_SYSTEM, DEFAULT_METRIC_UNIT, DEFAULT_IMPERIAL_UNIT, GRID_SIZE } from './constants';
import { getPolygonBounds, isPointInPolygon } from './geometry';

interface HistoryState {
    shapes: RoomShape[];
    furniture: FurnitureItem[];
    zones: ZoneShape[];
    wallItems: WallItem[];
    texts: TextItem[];
    drawings: FreehandPath[];
}

type ClipboardItem = {
    type: 'ROOM';
    data: RoomShape;
} | {
    type: 'ZONE';
    data: ZoneShape;
} | {
    type: 'FURNITURE';
    data: FurnitureItem;
} | {
    type: 'WALL_ITEM';
    data: WallItem;
} | {
    type: 'TEXT';
    data: TextItem;
} | {
    type: 'DRAWING';
    data: FreehandPath;
};

interface SettingsState {
    unitSystem: UnitSystem;
    metricUnit: MetricUnit;
    imperialUnit: ImperialUnit;
    gridSnap: boolean;
    elementSnap: boolean; // Toggle for snapping to other elements
    gridSize: number;
    showGrid: boolean;
}

interface AppState {
    // Data State
    shapes: RoomShape[];
    furniture: FurnitureItem[];
    zones: ZoneShape[];
    wallItems: WallItem[];
    texts: TextItem[];
    drawings: FreehandPath[];
    measurements: Measurement[];

    // Selection State
    selectedIds: string[];

    // UI State
    isPlacingCustomFurniture: boolean;

    // Clipboard
    clipboard: ClipboardItem[];

    // View State
    tool: Tool;
    mode: AppMode;
    showKeyboardHelp: boolean;
    showDeleteConfirm: boolean;

    // Settings State
    settings: SettingsState;

    // History State
    history: HistoryState[];
    historyIndex: number;
    canUndo: boolean;
    canRedo: boolean;

    // Actions
    setTool: (tool: Tool) => void;
    setMode: (mode: AppMode) => void;
    toggleKeyboardHelp: () => void;
    setShowDeleteConfirm: (show: boolean) => void;

    // Settings Actions
    setUnitSystem: (system: UnitSystem) => void;
    setMetricUnit: (unit: MetricUnit) => void;
    setImperialUnit: (unit: ImperialUnit) => void;
    toggleGridSnap: () => void;
    toggleElementSnap: () => void;
    setGridSize: (size: number) => void;
    toggleShowGrid: () => void;

    setSelected: (ids: string[]) => void;
    toggleSelection: (id: string, multi: boolean) => void;
    selectAll: () => void;

    // Creation Actions
    addShape: (shape: RoomShape) => void;
    addZone: (zone: ZoneShape) => void;
    addFurniture: (item: FurnitureItem) => void;
    addWallItem: (item: WallItem) => void;
    addText: (item: TextItem) => void;
    addDrawing: (drawing: FreehandPath) => void;
    setPendingDrawing: (drawing: Point[]) => void;
    setPlacingCustomFurniture: (isPlacing: boolean) => void;

    // Update Actions (now with history)
    updateShape: (id: string, updates: Partial<RoomShape>) => void;
    updateFurniture: (id: string, updates: Partial<FurnitureItem>) => void;
    updateZone: (id: string, updates: Partial<ZoneShape>) => void;
    updateWallItem: (id: string, updates: Partial<WallItem>) => void;
    updateText: (id: string, updates: Partial<TextItem>) => void;
    updateDrawing: (id: string, updates: Partial<FreehandPath>) => void;

    // Bulk Updates (for drag operations - no history during drag)
    setShapes: (shapes: RoomShape[]) => void;
    setFurniture: (items: FurnitureItem[]) => void;
    setZones: (zones: ZoneShape[]) => void;
    setWallItems: (items: WallItem[]) => void;
    setTexts: (items: TextItem[]) => void;

    // History Actions
    saveToHistory: () => void;
    undo: () => void;
    redo: () => void;

    // Delete
    deleteSelected: () => void;
    moveSelectedBy: (dx: number, dy: number) => void;
    reorderItem: (id: string, direction: 'FRONT' | 'BACK' | 'FORWARD' | 'BACKWARD') => void;

    // Clipboard Actions
    copy: () => void;
    paste: (offset?: { x: number; y: number }) => void;
    duplicate: () => void;

    // Measurements
    addMeasurement: (measurement: Measurement) => void;
    clearMeasurements: () => void;

    // Persistence
    exportState: () => string;
    importState: (json: string) => boolean;
    clearAll: () => void;
}

// Helper to get item by id
const getItemById = (state: AppState, id: string): ClipboardItem | null => {
    const shape = state.shapes.find(s => s.id === id);
    if (shape) return { type: 'ROOM', data: shape };

    const zone = state.zones.find(z => z.id === id);
    if (zone) return { type: 'ZONE', data: zone };

    const furniture = state.furniture.find(f => f.id === id);
    if (furniture) return { type: 'FURNITURE', data: furniture };

    const wallItem = state.wallItems.find(w => w.id === id);
    if (wallItem) return { type: 'WALL_ITEM', data: wallItem };

    const text = state.texts.find(t => t.id === id);
    if (text) return { type: 'TEXT', data: text };

    const drawing = state.drawings.find(d => d.id === id);
    if (drawing) return { type: 'DRAWING', data: drawing };

    return null;
};

// Helper to clone item with new ID
const cloneWithNewId = (item: ClipboardItem, offset = { x: 20, y: 20 }): ClipboardItem => {
    const newId = uuidv4();

    switch (item.type) {
        case 'ROOM': {
            const newVertices = item.data.vertices.map(v => ({
                ...v,
                id: uuidv4(),
                x: v.x + offset.x,
                y: v.y + offset.y
            }));
            return {
                type: 'ROOM',
                data: { ...item.data, id: newId, vertices: newVertices }
            };
        }
        case 'ZONE': {
            const newVertices = item.data.vertices.map(v => ({
                ...v,
                id: uuidv4(),
                x: v.x + offset.x,
                y: v.y + offset.y
            }));
            return {
                type: 'ZONE',
                data: { ...item.data, id: newId, vertices: newVertices }
            };
        }
        case 'FURNITURE': {
            const data = { ...item.data, id: newId, x: item.data.x + offset.x, y: item.data.y + offset.y };
            if (data.vertices) {
                data.vertices = data.vertices.map(v => ({
                    ...v,
                    id: uuidv4(),
                    x: v.x + offset.x,
                    y: v.y + offset.y
                }));
            }
            return { type: 'FURNITURE', data };
        }
        case 'WALL_ITEM':
            return {
                type: 'WALL_ITEM',
                data: { ...item.data, id: newId, x: item.data.x + offset.x, y: item.data.y + offset.y }
            };
        case 'TEXT':
            return {
                type: 'TEXT',
                data: { ...item.data, id: newId, x: item.data.x + offset.x, y: item.data.y + offset.y }
            };
        case 'DRAWING': {
            const newPoints = item.data.points.map(p => ({ x: p.x + offset.x, y: p.y + offset.y }));
            return {
                type: 'DRAWING',
                data: { ...item.data, id: newId, points: newPoints }
            };
        }
    }
};

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Initial State
            shapes: [],
            furniture: [],
            zones: [],
            wallItems: [],
            texts: [],
            drawings: [],
            measurements: [],

            selectedIds: [],
            clipboard: [],

            tool: Tool.SELECT,
            mode: AppMode.IDLE,
            showKeyboardHelp: false,
            showDeleteConfirm: false,
            isPlacingCustomFurniture: false,

            settings: {
                unitSystem: DEFAULT_UNIT_SYSTEM,
                metricUnit: DEFAULT_METRIC_UNIT,
                imperialUnit: DEFAULT_IMPERIAL_UNIT,
                gridSnap: true,
                elementSnap: true,
                gridSize: GRID_SIZE,
                showGrid: true,
            },

            // Initialize with empty state in history so first action can be undone
            history: [{
                shapes: [],
                furniture: [],
                zones: [],
                wallItems: [],
                texts: [],
                drawings: []
            }],
            historyIndex: 0,
            canUndo: false,
            canRedo: false,

            // Actions
            setTool: (tool) => set({ tool, mode: AppMode.IDLE }),
            setMode: (mode) => set({ mode }),
            toggleKeyboardHelp: () => set((state) => ({ showKeyboardHelp: !state.showKeyboardHelp })),
            setShowDeleteConfirm: (show) => set({ showDeleteConfirm: show }),

            // Settings Actions
            setUnitSystem: (unitSystem) => set((state) => ({
                settings: { ...state.settings, unitSystem }
            })),
            setMetricUnit: (metricUnit) => set((state) => ({
                settings: { ...state.settings, metricUnit }
            })),
            setImperialUnit: (imperialUnit) => set((state) => ({
                settings: { ...state.settings, imperialUnit }
            })),
            toggleGridSnap: () => set((state) => ({
                settings: { ...state.settings, gridSnap: !state.settings.gridSnap }
            })),
            toggleElementSnap: () => set((state) => ({
                settings: { ...state.settings, elementSnap: !state.settings.elementSnap }
            })),
            setGridSize: (gridSize) => set((state) => ({
                settings: { ...state.settings, gridSize }
            })),
            toggleShowGrid: () => set((state) => ({
                settings: { ...state.settings, showGrid: !state.settings.showGrid }
            })),

            setSelected: (ids) => set({ selectedIds: ids }),

            toggleSelection: (id, multi) => set((state) => {
                if (!multi) return { selectedIds: [id] };
                return {
                    selectedIds: state.selectedIds.includes(id)
                        ? state.selectedIds.filter(i => i !== id)
                        : [...state.selectedIds, id]
                };
            }),

            selectAll: () => set((state) => ({
                selectedIds: [
                    ...state.shapes.map(s => s.id),
                    ...state.zones.map(z => z.id),
                    ...state.furniture.map(f => f.id),
                    ...state.wallItems.map(w => w.id),
                    ...state.texts.map(t => t.id),
                    ...state.drawings.map(d => d.id)
                ]
            })),

            addShape: (shape) => {
                set((state) => ({ shapes: [...state.shapes, shape] }));
                get().saveToHistory();
            },
            addZone: (zone) => {
                set((state) => ({ zones: [...state.zones, zone] }));
                get().saveToHistory();
            },
            addFurniture: (item) => {
                set((state) => ({ furniture: [...state.furniture, item] }));
                get().saveToHistory();
            },
            addWallItem: (item) => {
                set((state) => ({ wallItems: [...state.wallItems, item] }));
                get().saveToHistory();
            },
            addText: (item) => {
                set((state) => ({ texts: [...state.texts, item] }));
                get().saveToHistory();
            },
            addDrawing: (drawing) => {
                set((state) => ({ drawings: [...state.drawings, drawing] }));
                get().saveToHistory();
            },
            setPendingDrawing: (drawing) => {
                // Just keeping interface happy, functionality likely contained in Canvas state or specialized store slice if needed later
            },
            setPlacingCustomFurniture: (isPlacing) => set({ isPlacingCustomFurniture: isPlacing }),

            // Update actions now save to history
            updateShape: (id, updates) => {
                set((state) => ({
                    shapes: state.shapes.map(s => s.id === id ? { ...s, ...updates } : s)
                }));
                get().saveToHistory();
            },
            updateFurniture: (id, updates) => {
                set((state) => ({
                    furniture: state.furniture.map(f => f.id === id ? { ...f, ...updates } : f)
                }));
                get().saveToHistory();
            },
            updateZone: (id, updates) => {
                set((state) => ({
                    zones: state.zones.map(z => z.id === id ? { ...z, ...updates } : z)
                }));
                get().saveToHistory();
            },
            updateWallItem: (id, updates) => {
                set((state) => ({
                    wallItems: state.wallItems.map(w => w.id === id ? { ...w, ...updates } : w)
                }));
                get().saveToHistory();
            },
            updateText: (id, updates) => {
                set((state) => ({
                    texts: state.texts.map(t => t.id === id ? { ...t, ...updates } : t)
                }));
                get().saveToHistory();
            },
            updateDrawing: (id, updates) => {
                set((state) => ({
                    drawings: state.drawings.map(d => d.id === id ? { ...d, ...updates } : d)
                }));
                get().saveToHistory();
            },

            // Setters for drag operations (no history during drag)
            setShapes: (shapes) => set({ shapes }),
            setFurniture: (furniture) => set({ furniture }),
            setZones: (zones) => set({ zones }),
            setWallItems: (wallItems) => set({ wallItems }),
            setTexts: (texts) => set({ texts }),

            saveToHistory: () => {
                const state = get();
                const historyItem: HistoryState = {
                    shapes: JSON.parse(JSON.stringify(state.shapes)),
                    furniture: JSON.parse(JSON.stringify(state.furniture)),
                    zones: JSON.parse(JSON.stringify(state.zones)),
                    wallItems: JSON.parse(JSON.stringify(state.wallItems)),
                    texts: JSON.parse(JSON.stringify(state.texts)),
                    drawings: JSON.parse(JSON.stringify(state.drawings))
                };

                const newHistory = state.history.slice(0, state.historyIndex + 1);
                newHistory.push(historyItem);

                if (newHistory.length > MAX_HISTORY_SIZE) newHistory.shift();

                set({
                    history: newHistory,
                    historyIndex: newHistory.length - 1,
                    canUndo: true,
                    canRedo: false
                });
            },

            undo: () => {
                const { history, historyIndex } = get();
                if (historyIndex > 0) {
                    const prevState = history[historyIndex - 1];
                    set({
                        ...prevState,
                        historyIndex: historyIndex - 1,
                        canUndo: historyIndex - 1 > 0,
                        canRedo: true,
                        selectedIds: []
                    });
                }
            },

            redo: () => {
                const { history, historyIndex } = get();
                if (historyIndex < history.length - 1) {
                    const nextState = history[historyIndex + 1];
                    set({
                        ...nextState,
                        historyIndex: historyIndex + 1,
                        canUndo: true,
                        canRedo: historyIndex + 1 < history.length - 1,
                        selectedIds: []
                    });
                }
            },

            deleteSelected: () => {
                const { selectedIds, saveToHistory } = get();
                if (selectedIds.length === 0) return;

                set((state) => ({
                    shapes: state.shapes.filter(s => !selectedIds.includes(s.id)),
                    zones: state.zones.filter(z => !selectedIds.includes(z.id)),
                    furniture: state.furniture.filter(f => !selectedIds.includes(f.id)),
                    wallItems: state.wallItems.filter(w => !selectedIds.includes(w.id)),
                    texts: state.texts.filter(t => !selectedIds.includes(t.id)),
                    drawings: state.drawings.filter(d => !selectedIds.includes(d.id))
                }));

                set({ selectedIds: [] });
                saveToHistory();
            },

            moveSelectedBy: (dx: number, dy: number) => {
                const state = get();
                const { selectedIds, saveToHistory, shapes, zones, furniture, wallItems } = state;
                if (selectedIds.length === 0) return;

                // Build list of children to also move (for rooms)
                const childrenIds: string[] = [];
                shapes.filter(s => selectedIds.includes(s.id)).forEach(shape => {
                    // Find zones inside this room
                    zones.forEach(z => {
                        const bounds = getPolygonBounds(z.vertices);
                        if (isPointInPolygon(bounds.center, shape.vertices)) childrenIds.push(z.id);
                    });
                    // Find furniture inside this room
                    furniture.forEach(f => {
                        if (isPointInPolygon({ x: f.x, y: f.y }, shape.vertices)) childrenIds.push(f.id);
                    });
                    // Find wall items attached to this room
                    wallItems.forEach(w => {
                        if (w.attachedTo === shape.id) childrenIds.push(w.id);
                    });
                });

                const moving = [...selectedIds, ...childrenIds];

                set((state) => ({
                    shapes: state.shapes.map(s => selectedIds.includes(s.id)
                        ? { ...s, vertices: s.vertices.map(v => ({ ...v, x: v.x + dx, y: v.y + dy })) }
                        : s),
                    zones: state.zones.map(z => moving.includes(z.id)
                        ? { ...z, vertices: z.vertices.map(v => ({ ...v, x: v.x + dx, y: v.y + dy })) }
                        : z),
                    furniture: state.furniture.map(f => {
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
                    }),
                    wallItems: state.wallItems.map(w => moving.includes(w.id)
                        ? { ...w, x: w.x + dx, y: w.y + dy }
                        : w),
                    texts: state.texts.map(t => selectedIds.includes(t.id)
                        ? { ...t, x: t.x + dx, y: t.y + dy }
                        : t),
                    drawings: state.drawings.map(d => selectedIds.includes(d.id)
                        ? { ...d, points: d.points.map(p => ({ x: p.x + dx, y: p.y + dy })) }
                        : d)
                }));
                saveToHistory();
            },

            reorderItem: (id: string, direction: 'FRONT' | 'BACK' | 'FORWARD' | 'BACKWARD') => {
                const state = get();
                const { saveToHistory } = state;

                const reorder = <T extends { id: string }>(list: T[]): T[] | null => {
                    const index = list.findIndex(item => item.id === id);
                    if (index === -1) return null;

                    const newList = [...list];
                    const item = newList[index];
                    newList.splice(index, 1);

                    if (direction === 'FRONT') {
                        newList.push(item);
                    } else if (direction === 'BACK') {
                        newList.unshift(item);
                    } else if (direction === 'FORWARD') {
                        const newIndex = Math.min(index + 1, list.length - 1);
                        newList.splice(newIndex, 0, item);
                    } else if (direction === 'BACKWARD') {
                        const newIndex = Math.max(index - 1, 0);
                        newList.splice(newIndex, 0, item);
                    }
                    return newList;
                };

                const newShapes = reorder(state.shapes);
                if (newShapes) { set({ shapes: newShapes }); saveToHistory(); return; }

                const newZones = reorder(state.zones);
                if (newZones) { set({ zones: newZones }); saveToHistory(); return; }

                const newFurniture = reorder(state.furniture);
                if (newFurniture) { set({ furniture: newFurniture }); saveToHistory(); return; }

                const newWallItems = reorder(state.wallItems);
                if (newWallItems) { set({ wallItems: newWallItems }); saveToHistory(); return; }

                const newTexts = reorder(state.texts);
                if (newTexts) { set({ texts: newTexts }); saveToHistory(); return; }

                const newDrawings = reorder(state.drawings);
                if (newDrawings) { set({ drawings: newDrawings }); saveToHistory(); return; }
            },

            // Clipboard operations
            copy: () => {
                const state = get();
                const items: ClipboardItem[] = [];

                state.selectedIds.forEach(id => {
                    const item = getItemById(state, id);
                    if (item) items.push(item);
                });

                set({ clipboard: items });
            },

            paste: (offset = { x: 20, y: 20 }) => {
                const state = get();
                const newIds: string[] = [];

                state.clipboard.forEach(item => {
                    const cloned = cloneWithNewId(item, offset);
                    newIds.push(cloned.data.id);

                    switch (cloned.type) {
                        case 'ROOM':
                            set(s => ({ shapes: [...s.shapes, cloned.data] }));
                            break;
                        case 'ZONE':
                            set(s => ({ zones: [...s.zones, cloned.data] }));
                            break;
                        case 'FURNITURE':
                            set(s => ({ furniture: [...s.furniture, cloned.data] }));
                            break;
                        case 'WALL_ITEM':
                            set(s => ({ wallItems: [...s.wallItems, cloned.data] }));
                            break;
                        case 'TEXT':
                            set(s => ({ texts: [...s.texts, cloned.data] }));
                            break;
                        case 'DRAWING':
                            set(s => ({ drawings: [...s.drawings, cloned.data] }));
                            break;
                    }
                });

                set({ selectedIds: newIds });
                get().saveToHistory();
            },

            duplicate: () => {
                const state = get();
                const newIds: string[] = [];

                state.selectedIds.forEach(id => {
                    const item = getItemById(state, id);
                    if (!item) return;

                    const cloned = cloneWithNewId(item);
                    newIds.push(cloned.data.id);

                    switch (cloned.type) {
                        case 'ROOM':
                            set(s => ({ shapes: [...s.shapes, cloned.data] }));
                            break;
                        case 'ZONE':
                            set(s => ({ zones: [...s.zones, cloned.data] }));
                            break;
                        case 'FURNITURE':
                            set(s => ({ furniture: [...s.furniture, cloned.data] }));
                            break;
                        case 'WALL_ITEM':
                            set(s => ({ wallItems: [...s.wallItems, cloned.data] }));
                            break;
                        case 'TEXT':
                            set(s => ({ texts: [...s.texts, cloned.data] }));
                            break;
                        case 'DRAWING':
                            set(s => ({ drawings: [...s.drawings, cloned.data] }));
                            break;
                    }
                });

                set({ selectedIds: newIds });
                get().saveToHistory();
            },

            // Measurements
            addMeasurement: (measurement) => set((state) => ({
                measurements: [...state.measurements, measurement]
            })),
            clearMeasurements: () => set({ measurements: [] }),

            // Persistence
            exportState: () => {
                const state = get();
                return JSON.stringify({
                    version: '1.1',
                    shapes: state.shapes,
                    furniture: state.furniture,
                    zones: state.zones,
                    wallItems: state.wallItems,
                    texts: state.texts,
                    drawings: state.drawings,
                    settings: state.settings
                }, null, 2);
            },

            importState: (json: string) => {
                try {
                    const data = JSON.parse(json);
                    if (!data.version) return false;

                    const newState: Partial<AppState> = {
                        shapes: data.shapes || [],
                        furniture: data.furniture || [],
                        zones: data.zones || [],
                        wallItems: data.wallItems || [],
                        texts: data.texts || [],
                        drawings: data.drawings || [],
                        measurements: [],
                        selectedIds: [],
                        history: [],
                        historyIndex: -1,
                        canUndo: false,
                        canRedo: false
                    };

                    // Import settings if available
                    if (data.settings) {
                        newState.settings = {
                            unitSystem: data.settings.unitSystem || DEFAULT_UNIT_SYSTEM,
                            metricUnit: data.settings.metricUnit || DEFAULT_METRIC_UNIT,
                            imperialUnit: data.settings.imperialUnit || DEFAULT_IMPERIAL_UNIT,
                            gridSnap: data.settings.gridSnap ?? true,
                            elementSnap: data.settings.elementSnap ?? true,
                            gridSize: data.settings.gridSize || GRID_SIZE,
                            showGrid: data.settings.showGrid ?? true,
                        };
                    }

                    set(newState);
                    get().saveToHistory();
                    return true;
                } catch {
                    return false;
                }
            },

            clearAll: () => {
                set({
                    shapes: [],
                    furniture: [],
                    zones: [],
                    wallItems: [],
                    texts: [],
                    drawings: [],
                    measurements: [],
                    selectedIds: [],
                    clipboard: []
                });
                get().saveToHistory();
            }
        }),
        {
            name: 'room-planner-storage',
            partialize: (state) => ({
                shapes: state.shapes,
                furniture: state.furniture,
                zones: state.zones,
                wallItems: state.wallItems,
                texts: state.texts,
                drawings: state.drawings,
                measurements: state.measurements,
                settings: state.settings,
            }),
            merge: (persistedState: unknown, currentState) => {
                const merged = { ...currentState, ...(persistedState as Partial<AppState>) };

                // Initialize history with the persisted data so undo/redo works correctly from the start
                merged.history = [{
                    shapes: JSON.parse(JSON.stringify(merged.shapes)),
                    furniture: JSON.parse(JSON.stringify(merged.furniture)),
                    zones: JSON.parse(JSON.stringify(merged.zones)),
                    wallItems: JSON.parse(JSON.stringify(merged.wallItems)),
                    texts: JSON.parse(JSON.stringify(merged.texts)),
                    drawings: JSON.parse(JSON.stringify(merged.drawings))
                }];
                merged.historyIndex = 0;
                merged.canUndo = false;
                merged.canRedo = false;

                return merged;
            },
        }
    )
);
