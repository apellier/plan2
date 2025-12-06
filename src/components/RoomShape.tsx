import React from 'react';
import { RoomShape, AppMode } from '@/lib/types';
import { generateRoomPath, getRenderSegments, midpoint, subtract, normalize, calculateInteriorAngle, getPolygonBounds, getCornerBisector, distance, offsetPolygon } from '@/lib/geometry';

interface RoomShapeProps {
  shape: RoomShape;
  isSelected: boolean;
  mode: AppMode;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onVertexMouseDown: (vertexId: string, e: React.MouseEvent) => void;
  onVertexClick: (vertexId: string, e: React.MouseEvent) => void;
  onEdgeMouseDown: (vertexIndex: number, e: React.MouseEvent) => void;
  onRadiusHandleMouseDown: (vertexId: string, e: React.MouseEvent) => void;
  onRotate?: () => void;
}

export const RoomShapeRenderer: React.FC<RoomShapeProps> = ({
  shape,
  isSelected,
  mode,
  onMouseDown,
  onDoubleClick,
  onVertexMouseDown,
  onVertexClick,
  onEdgeMouseDown,
  onRadiusHandleMouseDown,
  onRotate
}) => {
  const isVertexMode = isSelected && mode === AppMode.VERTEX_EDIT;
  const wallThickness = shape.wallThickness || 0;

  let pathData = generateRoomPath(shape.vertices);
  let innerPathData = '';

  if (wallThickness > 0) {
    // Calculate offset polygon for inner wall
    // Note: This needs the polygon to be clockwise/ccw consistent
    // offsetPolygon implementation assumes basic offset.
    // We might need to handle hole cutting (winding rules).
    // For now, let's render two paths: Outer (Fills Wall Color), Inner (Fills Floor Color)

    // Actually, standard plan:
    // Path 1 (Base): Stroke Thick Black (or Wall Color), Fill Wall Color (Black/Dark Gray)
    // Path 2 (Inner): Stroke None, Fill Floor Color (White/Texture)

    const innerVertices = offsetPolygon(shape.vertices, -wallThickness);
    const innerRoomVertices = innerVertices.map((p, i) => ({
      ...p,
      id: `inner-${i}`,
      type: 'CORNER' as const
    }));
    innerPathData = generateRoomPath(innerRoomVertices);
  }

  const segments = getRenderSegments(shape.vertices);
  const bounds = getPolygonBounds(shape.vertices);
  const fillColor = shape.color || '#ffffff';
  const opacity = shape.opacity !== undefined ? shape.opacity : 0.9;

  return (
    <g
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      className="cursor-pointer group"
    >
      {/* SHAPE FILL & STROKE */}
      {wallThickness > 0 ? (
        <>
          {/* Wall "Structure" (Outer Path) */}
          <path
            d={pathData}
            className={`stroke-black stroke-2 transition-colors duration-200`}
            fill="#404040"
            fillOpacity={1}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {/* Floor "Inner" (Inner Path) */}
          <path
            d={innerPathData}
            className={`stroke-black stroke-1 transition-colors duration-200`}
            style={{ fill: fillColor }}
            fillOpacity={opacity}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </>
      ) : (
        <path
          d={pathData}
          className={`stroke-black stroke-2 transition-colors duration-200`}
          style={{ fill: fillColor }}
          fillOpacity={opacity}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {/* Label - Top Left of Bounding Box */}
      {shape.label && (
        <g transform={`translate(${bounds.x}, ${bounds.y})`} className="pointer-events-none select-none">
          <rect x="0" y="-22" width="60" height="18" rx="2" className="fill-black opacity-80" />
          <text
            x="30" y="-13"
            textAnchor="middle"
            dy="0.35em"
            className="text-[10px] font-bold fill-white uppercase tracking-wider"
          >
            {shape.label}
          </text>
        </g>
      )}

      {/* Dimensions - Rendered for all segments */}
      {(isSelected || mode === AppMode.IDLE) && segments.map((seg, i) => {
        const mid = midpoint(seg.start, seg.end);
        const v = subtract(seg.end, seg.start);

        // Calculate normal vector
        let normal = normalize({ x: -v.y, y: v.x });

        // Vector from centroid to midpoint
        const centerToMid = subtract(mid, bounds.center);

        // Ensure normal points OUTWARD
        if ((normal.x * centerToMid.x + normal.y * centerToMid.y) < 0) {
          normal = { x: -normal.x, y: -normal.y };
        }

        const offsetDist = 25;
        const textPos = {
          x: mid.x + normal.x * offsetDist,
          y: mid.y + normal.y * offsetDist
        };

        return (
          <g key={`dim-${i}`} className="pointer-events-none select-none">
            <g transform={`translate(${textPos.x}, ${textPos.y})`}>
              <rect
                x="-18" y="-9" width="36" height="18" rx="4"
                className="fill-white stroke-black stroke-1 opacity-90"
              />
              <text
                textAnchor="middle"
                dy="0.35em"
                className="text-[10px] font-mono font-bold fill-black"
              >
                {Math.round(seg.length)}
              </text>
            </g>
          </g>
        );
      })}

      {/* ROTATION HANDLE */}
      {isSelected && !isVertexMode && (
        <g transform={`translate(${bounds.center.x}, ${bounds.y})`}>
          <line x1={0} y1={0} x2={0} y2={-40} className="stroke-black stroke-1" vectorEffect="non-scaling-stroke" />
          <circle
            cx={0} cy={-40} r={6}
            className="fill-white stroke-black stroke-1 cursor-grab hover:bg-neo-yellow"
            onMouseDown={(e) => { e.stopPropagation(); onRotate && onRotate(); }}
          />
        </g>
      )}

      {/* Vertex Mode UI Layer */}
      {isVertexMode && (
        <>
          {/* Angle Indicators & Radius Handles */}
          {shape.vertices.map((v, i) => {
            const prev = shape.vertices[(i - 1 + shape.vertices.length) % shape.vertices.length];
            const next = shape.vertices[(i + 1) % shape.vertices.length];
            const angle = calculateInteriorAngle(prev, v, next);

            // Bisector for positioning elements
            const bisector = getCornerBisector(prev, v, next);

            const anglePos = {
              x: v.x + bisector.x * 40,
              y: v.y + bisector.y * 40
            };

            // Figma-style Radius Handle
            // Positioned along bisector. distance = max(20, radius + 10)
            const r = v.radius || 0;
            const handleDist = Math.max(20, r + 10);
            const radiusHandlePos = {
              x: v.x + bisector.x * handleDist,
              y: v.y + bisector.y * handleDist
            };

            return (
              <React.Fragment key={`v-ui-${v.id}`}>
                <g className="pointer-events-none select-none">
                  <text
                    x={anglePos.x}
                    y={anglePos.y}
                    textAnchor="middle"
                    dy="0.3em"
                    className="text-[9px] font-bold fill-gray-500"
                  >
                    {Math.round(angle)}°
                  </text>
                </g>

                {/* Radius Handle */}
                <circle
                  cx={radiusHandlePos.x}
                  cy={radiusHandlePos.y}
                  r={4}
                  className="fill-white stroke-neo-blue stroke-1 cursor-ew-resize hover:fill-neo-blue"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onRadiusHandleMouseDown(v.id, e);
                  }}
                />
                {/* Visual line to center if radius is large */}
                {r > 10 && (
                  <line
                    x1={v.x} y1={v.y}
                    x2={radiusHandlePos.x} y2={radiusHandlePos.y}
                    className="stroke-neo-blue stroke-1 opacity-50 pointer-events-none"
                    strokeDasharray="2 2"
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Edges (Ghost Points for splitting) */}
          {shape.vertices.map((v, i) => {
            const nextV = shape.vertices[(i + 1) % shape.vertices.length];
            const mid = midpoint(v, nextV);
            return (
              <g
                key={`ghost-${i}`}
                transform={`translate(${mid.x}, ${mid.y})`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onEdgeMouseDown(i, e);
                }}
                className="cursor-copy group/ghost"
              >
                <circle r={10} fill="transparent" />
                <circle
                  r={5}
                  className="fill-white stroke-black stroke-2 group-hover/ghost:fill-neo-green transition-colors"
                />
              </g>
            );
          })}

          {/* Vertices */}
          {shape.vertices.map((v) => (
            <g
              key={v.id}
              transform={`translate(${v.x}, ${v.y})`}
              className="cursor-move"
              onMouseDown={(e) => {
                e.stopPropagation();
                onVertexMouseDown(v.id, e);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onVertexClick(v.id, e);
              }}
            >
              <circle r={12} fill="transparent" />
              <circle
                r={6}
                className={`stroke-black stroke-2 transition-transform ${v.type === 'CORNER' ? 'fill-white' : 'fill-neo-pink'}`}
              />
            </g>
          ))}
        </>
      )}
    </g>
  );
};