export type Point = {
  x: number;
  y: number;
};

export enum Tool {
  SELECT = 'SELECT',
  ROOM = 'ROOM',
  PAN = 'PAN',
  FURNITURE = 'FURNITURE',
  ZONE = 'ZONE',
  DOOR = 'DOOR',
  WINDOW = 'WINDOW',
  PENCIL = 'PENCIL',
  TEXT = 'TEXT',
  MEASURE = 'MEASURE',
}

export interface GuideLine {
  start: Point;
  end: Point;
  axis: 'x' | 'y';
}

export enum ShapeType {
  RECT = 'RECT',
  POLYGON = 'POLYGON',
}

export type VertexType = 'CORNER' | 'FILLET';

export interface RoomVertex extends Point {
  id: string;
  type: VertexType;
  radius?: number;
}

export interface RoomShape {
  id: string;
  type: ShapeType;
  vertices: RoomVertex[];
  label: string;
  zIndex?: number;
  color?: string;
  opacity?: number;
  rotation?: number;
  wallThickness?: number;
}

export interface ZoneShape {
  id: string;
  vertices: RoomVertex[];
  label: string;
  color: string;
  opacity?: number;
  zIndex?: number;
  rotation?: number;
}

// Expanded furniture types
export type FurnitureType =
  // Bedroom
  | 'BED_SINGLE'
  | 'BED_QUEEN'
  | 'BED_KING'
  | 'WARDROBE'
  | 'NIGHTSTAND'
  | 'DRESSER'
  // Living Room
  | 'SOFA_2SEATER'
  | 'SOFA_3SEATER'
  | 'SOFA_CORNER'
  | 'ARMCHAIR'
  | 'COFFEE_TABLE'
  | 'TV_STAND'
  | 'BOOKSHELF'
  // Dining
  | 'TABLE_DINING'
  | 'TABLE_ROUND'
  | 'CHAIR_DINING'
  // Office
  | 'DESK'
  | 'CHAIR_OFFICE'
  | 'FILING_CABINET'
  // Bathroom
  | 'BATHTUB'
  | 'SHOWER'
  | 'TOILET'
  | 'SINK_BATHROOM'
  // Kitchen
  | 'SINK_KITCHEN'
  | 'STOVE'
  | 'FRIDGE'
  | 'DISHWASHER'
  | 'COUNTER'
  // Outdoor
  | 'PLANT'
  | 'PLANT_LARGE'
  // Custom
  | 'CUSTOM';

export interface FurnitureItem {
  id: string;
  type: FurnitureType;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
  vertices?: RoomVertex[];
  color?: string;
  zIndex?: number;
  label?: string;
}

export type WallItemType = 'DOOR' | 'WINDOW';

export interface WallItem {
  id: string;
  type: WallItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  flipX?: boolean;
  flipY?: boolean;
  zIndex?: number;
  attachedTo?: string;
  color?: string;
}

export interface TextItem {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  rotation: number;
  zIndex?: number;
}

export interface FreehandPath {
  id: string;
  points: Point[];
  strokeColor: string;
  strokeWidth: number;
  zIndex?: number;
}

// Measurement for the measure tool
export interface Measurement {
  id: string;
  start: Point;
  end: Point;
  distance: number;
}

export enum AppMode {
  IDLE = 'IDLE',
  DRAWING = 'DRAWING',
  DRAWING_ZONE = 'DRAWING_ZONE',
  DRAWING_CUSTOM = 'DRAWING_CUSTOM',
  DRAWING_FREEHAND = 'DRAWING_FREEHAND',
  PARAMETRIC_EDIT = 'PARAMETRIC_EDIT',
  VERTEX_EDIT = 'VERTEX_EDIT',
  PLACING_FURNITURE = 'PLACING_FURNITURE',
  PLACING_WALL_ITEM = 'PLACING_WALL_ITEM',
  PANNING = 'PANNING',
  MEASURING = 'MEASURING',
}
