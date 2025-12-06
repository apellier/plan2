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

export type VertexType = 'CORNER' | 'FILLET'; // Chamfer removed

export interface RoomVertex extends Point {
  id: string;
  type: VertexType;
  radius?: number; // For fillet size
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

export type FurnitureType = 'BED_QUEEN' | 'SOFA_3SEATER' | 'TABLE_DINING' | 'CHAIR_OFFICE' | 'PLANT' | 'CUSTOM';

export interface FurnitureItem {
  id: string;
  type: FurnitureType;
  x: number;
  y: number;
  rotation: number; // Degrees
  width: number;
  height: number;
  vertices?: RoomVertex[];
  color?: string; // Optional override
  zIndex?: number;
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
}