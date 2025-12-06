// Grid settings
export const GRID_SIZE = 40;
export const GRID_COLOR = 'rgba(0,0,0,0.05)';

// Snapping
export const SNAP_THRESHOLD = 15;
export const WALL_SNAP_THRESHOLD = 30;

// Zoom
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 5;
export const ZOOM_STEP = 0.1;
export const ZOOM_WHEEL_SENSITIVITY = 0.001;

// History
export const MAX_HISTORY_SIZE = 50;

// Default dimensions (in pixels, representing centimeters in plan view)
export const DEFAULT_DOOR_WIDTH = 80;
export const DEFAULT_DOOR_HEIGHT = 20;
export const DEFAULT_WINDOW_WIDTH = 120;
export const DEFAULT_WINDOW_HEIGHT = 20;

// Default styling
export const DEFAULT_ROOM_COLOR = '#ffffff';
export const DEFAULT_ROOM_OPACITY = 0.9;
export const DEFAULT_ZONE_COLOR = '#b9fbc0';
export const DEFAULT_ZONE_OPACITY = 0.4;
export const DEFAULT_TEXT_COLOR = '#1a1a1a';
export const DEFAULT_TEXT_SIZE = 16;
export const DEFAULT_STROKE_COLOR = '#1a1a1a';
export const DEFAULT_STROKE_WIDTH = 2;

// Z-index defaults
export const Z_INDEX = {
    ROOM: 1,
    FURNITURE: 2,
    WALL_ITEM: 2,
    TEXT: 3,
    ZONE: 10,
} as const;

// Unit system
export type UnitSystem = 'metric' | 'imperial';
export type MetricUnit = 'mm' | 'cm' | 'm';
export type ImperialUnit = 'in' | 'ft';

export const UNIT_CONVERSIONS = {
    // Internal unit is always pixels (1px = 1cm by default scale)
    metric: {
        mm: { fromPx: 10, toPx: 0.1, label: 'mm' },
        cm: { fromPx: 1, toPx: 1, label: 'cm' },
        m: { fromPx: 0.01, toPx: 100, label: 'm' },
    },
    imperial: {
        in: { fromPx: 0.3937, toPx: 2.54, label: '"' },
        ft: { fromPx: 0.0328, toPx: 30.48, label: "'" },
    },
} as const;

export const DEFAULT_UNIT_SYSTEM: UnitSystem = 'metric';
export const DEFAULT_METRIC_UNIT: MetricUnit = 'cm';
export const DEFAULT_IMPERIAL_UNIT: ImperialUnit = 'ft';

// Furniture presets - Expanded catalog
export const FURNITURE_CATEGORIES = {
    BEDROOM: 'Bedroom',
    LIVING: 'Living Room',
    DINING: 'Dining',
    OFFICE: 'Office',
    BATHROOM: 'Bathroom',
    KITCHEN: 'Kitchen',
    OUTDOOR: 'Outdoor',
} as const;

export const FURNITURE_PRESETS = {
    // Bedroom
    BED_SINGLE: { width: 100, height: 200, category: 'BEDROOM', label: 'Single Bed' },
    BED_QUEEN: { width: 160, height: 200, category: 'BEDROOM', label: 'Queen Bed' },
    BED_KING: { width: 180, height: 200, category: 'BEDROOM', label: 'King Bed' },
    WARDROBE: { width: 120, height: 60, category: 'BEDROOM', label: 'Wardrobe' },
    NIGHTSTAND: { width: 50, height: 40, category: 'BEDROOM', label: 'Nightstand' },
    DRESSER: { width: 100, height: 50, category: 'BEDROOM', label: 'Dresser' },

    // Living Room
    SOFA_2SEATER: { width: 160, height: 90, category: 'LIVING', label: '2-Seater Sofa' },
    SOFA_3SEATER: { width: 220, height: 90, category: 'LIVING', label: '3-Seater Sofa' },
    SOFA_CORNER: { width: 250, height: 200, category: 'LIVING', label: 'Corner Sofa' },
    ARMCHAIR: { width: 80, height: 80, category: 'LIVING', label: 'Armchair' },
    COFFEE_TABLE: { width: 120, height: 60, category: 'LIVING', label: 'Coffee Table' },
    TV_STAND: { width: 150, height: 45, category: 'LIVING', label: 'TV Stand' },
    BOOKSHELF: { width: 80, height: 30, category: 'LIVING', label: 'Bookshelf' },

    // Dining
    TABLE_DINING: { width: 180, height: 90, category: 'DINING', label: 'Dining Table' },
    TABLE_ROUND: { width: 120, height: 120, category: 'DINING', label: 'Round Table' },
    CHAIR_DINING: { width: 45, height: 45, category: 'DINING', label: 'Dining Chair' },

    // Office
    DESK: { width: 140, height: 70, category: 'OFFICE', label: 'Desk' },
    CHAIR_OFFICE: { width: 60, height: 60, category: 'OFFICE', label: 'Office Chair' },
    FILING_CABINET: { width: 45, height: 60, category: 'OFFICE', label: 'Filing Cabinet' },

    // Bathroom
    BATHTUB: { width: 170, height: 80, category: 'BATHROOM', label: 'Bathtub' },
    SHOWER: { width: 90, height: 90, category: 'BATHROOM', label: 'Shower' },
    TOILET: { width: 40, height: 65, category: 'BATHROOM', label: 'Toilet' },
    SINK_BATHROOM: { width: 60, height: 45, category: 'BATHROOM', label: 'Bathroom Sink' },

    // Kitchen
    SINK_KITCHEN: { width: 80, height: 60, category: 'KITCHEN', label: 'Kitchen Sink' },
    STOVE: { width: 60, height: 60, category: 'KITCHEN', label: 'Stove' },
    FRIDGE: { width: 70, height: 70, category: 'KITCHEN', label: 'Refrigerator' },
    DISHWASHER: { width: 60, height: 60, category: 'KITCHEN', label: 'Dishwasher' },
    COUNTER: { width: 100, height: 60, category: 'KITCHEN', label: 'Counter' },

    // Outdoor/Plants
    PLANT: { width: 40, height: 40, category: 'OUTDOOR', label: 'Plant' },
    PLANT_LARGE: { width: 60, height: 60, category: 'OUTDOOR', label: 'Large Plant' },
} as const;

// Room templates
export const ROOM_TEMPLATES = {
    RECTANGLE: {
        label: 'Rectangle',
        vertices: [
            { x: 0, y: 0 },
            { x: 400, y: 0 },
            { x: 400, y: 300 },
            { x: 0, y: 300 },
        ],
    },
    SQUARE: {
        label: 'Square',
        vertices: [
            { x: 0, y: 0 },
            { x: 300, y: 0 },
            { x: 300, y: 300 },
            { x: 0, y: 300 },
        ],
    },
    L_SHAPE: {
        label: 'L-Shape',
        vertices: [
            { x: 0, y: 0 },
            { x: 400, y: 0 },
            { x: 400, y: 150 },
            { x: 200, y: 150 },
            { x: 200, y: 300 },
            { x: 0, y: 300 },
        ],
    },
    U_SHAPE: {
        label: 'U-Shape',
        vertices: [
            { x: 0, y: 0 },
            { x: 400, y: 0 },
            { x: 400, y: 300 },
            { x: 300, y: 300 },
            { x: 300, y: 100 },
            { x: 100, y: 100 },
            { x: 100, y: 300 },
            { x: 0, y: 300 },
        ],
    },
    T_SHAPE: {
        label: 'T-Shape',
        vertices: [
            { x: 100, y: 0 },
            { x: 300, y: 0 },
            { x: 300, y: 100 },
            { x: 400, y: 100 },
            { x: 400, y: 200 },
            { x: 300, y: 200 },
            { x: 300, y: 300 },
            { x: 100, y: 300 },
            { x: 100, y: 200 },
            { x: 0, y: 200 },
            { x: 0, y: 100 },
            { x: 100, y: 100 },
        ],
    },
} as const;

// Keyboard shortcut mappings
export const KEYBOARD_SHORTCUTS = {
    SELECT: ['v', 'V', 'Escape'],
    ROOM: ['r', 'R'],
    ZONE: ['z', 'Z'],
    DOOR: ['d', 'D'],
    WINDOW: ['w', 'W'],
    PENCIL: ['p', 'P'],
    TEXT: ['t', 'T'],
    FURNITURE: ['f', 'F'],
    PAN: [' '], // Space
    MEASURE: ['m', 'M'],
    DELETE: ['Delete', 'Backspace'],
    UNDO: ['z'], // with Ctrl/Cmd
    REDO: ['y', 'Z'], // y or Shift+Z with Ctrl/Cmd
    COPY: ['c'], // with Ctrl/Cmd
    PASTE: ['v'], // with Ctrl/Cmd
    DUPLICATE: ['d'], // with Ctrl/Cmd
    SELECT_ALL: ['a'], // with Ctrl/Cmd
} as const;
