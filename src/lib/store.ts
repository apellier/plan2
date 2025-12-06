import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { RoomShape, ZoneShape, FurnitureItem, WallItem, TextItem, FreehandPath, Tool, AppMode } from './types';

interface HistoryState {
    shapes: RoomShape[];
    furniture: FurnitureItem[];
    zones: ZoneShape[];
    wallItems: WallItem[];
    texts: TextItem[];
    drawings: FreehandPath[];
}

interface AppState {
    // Data State
    shapes: RoomShape[];
    furniture: FurnitureItem[];
    zones: ZoneShape[];
    wallItems: WallItem[];
    texts: TextItem[];
    drawings: FreehandPath[];

    // Selection State
    selectedIds: string[];

    // View State
    tool: Tool;
    mode: AppMode;

    // History State
    history: HistoryState[];
    historyIndex: number;
    canUndo: boolean;
    canRedo: boolean;

    // Actions
    setTool: (tool: Tool) => void;
    setMode: (mode: AppMode) => void;

    setSelected: (ids: string[]) => void;
    toggleSelection: (id: string, multi: boolean) => void;

    // Creation Actions
    addShape: (shape: RoomShape) => void;
    addZone: (zone: ZoneShape) => void;
    addFurniture: (item: FurnitureItem) => void;
    addWallItem: (item: WallItem) => void;
    addText: (item: TextItem) => void;
    addDrawing: (drawing: FreehandPath) => void;

    // Update Actions
    updateShape: (id: string, updates: Partial<RoomShape>) => void;
    updateFurniture: (id: string, updates: Partial<FurnitureItem>) => void;
    updateZone: (id: string, updates: Partial<ZoneShape>) => void;
    updateWallItem: (id: string, updates: Partial<WallItem>) => void;
    updateText: (id: string, updates: Partial<TextItem>) => void;
    updateDrawing: (id: string, updates: Partial<FreehandPath>) => void;

    // Bulk Updates
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
    reorderItem: (id: string, direction: 'FRONT' | 'BACK' | 'FORWARD' | 'BACKWARD') => void;
}

export const useStore = create<AppState>((set, get) => ({
    // Initial State
    shapes: [],
    furniture: [],
    zones: [],
    wallItems: [],
    texts: [],
    drawings: [],

    selectedIds: [],

    tool: Tool.SELECT,
    mode: AppMode.IDLE,

    history: [],
    historyIndex: -1,
    canUndo: false,
    canRedo: false,

    // Actions
    setTool: (tool) => set({ tool }),
    setMode: (mode) => set({ mode }),

    setSelected: (ids) => set({ selectedIds: ids }),

    toggleSelection: (id, multi) => set((state) => {
        if (!multi) return { selectedIds: [id] };
        return {
            selectedIds: state.selectedIds.includes(id)
                ? state.selectedIds.filter(i => i !== id)
                : [...state.selectedIds, id]
        };
    }),

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

    updateShape: (id, updates) => set((state) => ({
        shapes: state.shapes.map(s => s.id === id ? { ...s, ...updates } : s)
    })),
    updateFurniture: (id, updates) => set((state) => ({
        furniture: state.furniture.map(f => f.id === id ? { ...f, ...updates } : f)
    })),
    updateZone: (id, updates) => set((state) => ({
        zones: state.zones.map(z => z.id === id ? { ...z, ...updates } : z)
    })),
    updateWallItem: (id, updates) => set((state) => ({
        wallItems: state.wallItems.map(w => w.id === id ? { ...w, ...updates } : w)
    })),
    updateText: (id, updates) => set((state) => ({
        texts: state.texts.map(t => t.id === id ? { ...t, ...updates } : t)
    })),
    updateDrawing: (id, updates) => set((state) => ({
        drawings: state.drawings.map(d => d.id === id ? { ...d, ...updates } : d)
    })),

    // Setters for drag operations
    setShapes: (shapes) => set({ shapes }),
    setFurniture: (furniture) => set({ furniture }),
    setZones: (zones) => set({ zones }),
    setWallItems: (wallItems) => set({ wallItems }),
    setTexts: (texts) => set({ texts }),

    saveToHistory: () => {
        const state = get();
        const historyItem: HistoryState = {
            shapes: state.shapes,
            furniture: state.furniture,
            zones: state.zones,
            wallItems: state.wallItems,
            texts: state.texts,
            drawings: state.drawings
        };

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(historyItem);

        if (newHistory.length > 50) newHistory.shift();

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
                selectedIds: [] // Clear selection on undo/redo to avoid ghost selections
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

    reorderItem: (id: string, direction: 'FRONT' | 'BACK' | 'FORWARD' | 'BACKWARD') => {
        const state = get();
        const { saveToHistory } = state;

        // Helper to reorder array
        const reorder = <T extends { id: string }>(list: T[]): T[] | null => {
            const index = list.findIndex(item => item.id === id);
            if (index === -1) return null; // Not in this list

            const newList = [...list];
            const item = newList[index];
            newList.splice(index, 1); // Remove

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

        // Try strictly one list at a time
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
    }
}));
