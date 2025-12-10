import React from 'react';
import { ZoneShape, AppMode } from '@/lib/types';
import { generateRoomPath, getRenderSegments, midpoint, subtract, normalize, getPolygonBounds, getCornerBisector, calculateInteriorAngle } from '@/lib/geometry';

interface ZoneRendererProps {
  zone: ZoneShape;
  isSelected: boolean;
  mode: AppMode;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onVertexMouseDown: (vertexId: string, e: React.MouseEvent) => void;
  onEdgeMouseDown: (vertexIndex: number, e: React.MouseEvent) => void;
  onRotate?: (e: React.MouseEvent) => void;
  onRadiusHandleMouseDown?: (vertexId: string, e: React.MouseEvent) => void;
}

export const ZoneRenderer: React.FC<ZoneRendererProps> = ({
  zone,
  isSelected,
  mode,
  onMouseDown,
  onDoubleClick,
  onVertexMouseDown,
  onEdgeMouseDown,
  onRotate,
  onRadiusHandleMouseDown
}) => {
  const pathData = generateRoomPath(zone.vertices);
  const segments = getRenderSegments(zone.vertices);
  const bounds = getPolygonBounds(zone.vertices);
  const isVertexMode = isSelected && mode === AppMode.VERTEX_EDIT;
  const opacity = zone.opacity !== undefined ? zone.opacity : 0.4;

  return (
    <g
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      className="cursor-pointer group"
    >
      <path
        d={pathData}
        className={`stroke-2 stroke-dashed transition-colors duration-200 ${isSelected ? 'stroke-neo-blue' : 'stroke-black/30'}`}
        strokeDasharray="8 4"
        fill={zone.color}
        fillOpacity={opacity}
      />

      {/* Label - Move to Top Left to avoid center clutter */}
      {zone.label && (
        <g transform={`translate(${bounds.x}, ${bounds.y})`} className="pointer-events-none select-none">
          <text
            x="0" y="-10"
            className="text-xs font-bold tracking-widest uppercase opacity-70 fill-black"
          >
            {zone.label}
          </text>
        </g>
      )}

      {/* Dimensions */}
      {isSelected && segments.map((seg, i) => {
        const mid = midpoint(seg.start, seg.end);
        const v = subtract(seg.end, seg.start);
        let normal = normalize({ x: -v.y, y: v.x });

        // Push dims outward
        const offsetDist = 15;
        const textPos = {
          x: mid.x + normal.x * offsetDist,
          y: mid.y + normal.y * offsetDist
        };

        return (
          <g key={`dim-${i}`} className="pointer-events-none select-none">
            <g transform={`translate(${textPos.x}, ${textPos.y})`}>
              <rect
                x="-15" y="-8" width="30" height="16" rx="4"
                className="fill-white/80 stroke-black/50 stroke-1"
              />
              <text
                textAnchor="middle"
                dy="0.35em"
                className="text-[9px] font-mono font-bold fill-black"
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
          <line x1={0} y1={0} x2={0} y2={-40} className="stroke-black stroke-1 stroke-dashed" vectorEffect="non-scaling-stroke" />
          <circle
            cx={0} cy={-40} r={6}
            className="fill-white stroke-black stroke-1 cursor-grab hover:bg-neo-yellow"
            onMouseDown={(e) => { e.stopPropagation(); onRotate && onRotate(e); }}
          />
        </g>
      )}

      {/* Vertex Editing UI */}
      {isVertexMode && (
        <>
          {/* Angle Indicators & Radius Handles */}
          {zone.vertices.map((v, i) => {
            const prev = zone.vertices[(i - 1 + zone.vertices.length) % zone.vertices.length];
            const next = zone.vertices[(i + 1) % zone.vertices.length];
            const angle = calculateInteriorAngle(prev, v, next);
            const bisector = getCornerBisector(prev, v, next);

            const anglePos = {
              x: v.x + bisector.x * 40,
              y: v.y + bisector.y * 40
            };

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
                    onRadiusHandleMouseDown && onRadiusHandleMouseDown(v.id, e);
                  }}
                />
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

          {/* Ghost Points (Edges) */}
          {zone.vertices.map((v, i) => {
            const nextV = zone.vertices[(i + 1) % zone.vertices.length];
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
                <circle r={8} fill="transparent" />
                <circle
                  r={4}
                  className="fill-white stroke-black stroke-1 group-hover/ghost:fill-neo-green transition-colors"
                />
              </g>
            );
          })}

          {/* Vertices */}
          {zone.vertices.map((v) => (
            <g
              key={v.id}
              transform={`translate(${v.x}, ${v.y})`}
              className="cursor-move"
              onMouseDown={(e) => {
                e.stopPropagation();
                onVertexMouseDown(v.id, e);
              }}
            >
              <circle r={10} fill="transparent" />
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