import React, { memo } from 'react';
import { Point, GuideLine, WallItem } from '@/lib/types';
import { WallItemRenderer } from '@/components/WallItemRenderer';

interface InteractionLayerProps {
    snapLines: GuideLine[];
    snapPoint: Point | null;
    selectionBox: { start: Point; end: Point } | null;
    ghostWallItem: WallItem | null;
}

export const InteractionLayer: React.FC<InteractionLayerProps> = memo(({
    snapLines,
    snapPoint,
    selectionBox,
    ghostWallItem
}) => {
    return (
        <g className="pointer-events-none">
            {/* Ghost Wall Item with validity indicator */}
            {ghostWallItem && (
                <g
                    opacity={ghostWallItem.attachedTo ? 0.6 : 0.4}
                    className={ghostWallItem.attachedTo ? '' : 'hue-rotate-180'}
                >
                    <WallItemRenderer
                        item={ghostWallItem}
                        isSelected={false}
                        onMouseDown={() => { }}
                    />
                    {/* Invalid placement indicator */}
                    {!ghostWallItem.attachedTo && (
                        <g transform={`translate(${ghostWallItem.x}, ${ghostWallItem.y - 30})`}>
                            <rect
                                x="-50" y="-10"
                                width="100" height="20"
                                rx="4"
                                className="fill-red-500/90 stroke-red-700"
                            />
                            <text
                                textAnchor="middle"
                                dy="0.35em"
                                className="text-[10px] font-bold fill-white"
                            >
                                Move to wall
                            </text>
                        </g>
                    )}
                </g>
            )}

            {/* Snap guidelines */}
            {snapLines.map((line, i) => (
                <line
                    key={`snap - ${i}`}
                    x1={line.start.x}
                    y1={line.start.y}
                    x2={line.end.x}
                    y2={line.end.y}
                    stroke="#ff00ff"
                    strokeWidth={1}
                    strokeDasharray="4 2"
                />
            ))}

            {/* Snap point indicator */}
            {snapPoint && (
                <circle
                    cx={snapPoint.x}
                    cy={snapPoint.y}
                    r={4}
                    fill="#ff00ff"
                    stroke="white"
                    strokeWidth="2"
                />
            )}

            {/* Selection Box */}
            {selectionBox && (
                <rect
                    x={Math.min(selectionBox.start.x, selectionBox.end.x)}
                    y={Math.min(selectionBox.start.y, selectionBox.end.y)}
                    width={Math.abs(selectionBox.end.x - selectionBox.start.x)}
                    height={Math.abs(selectionBox.end.y - selectionBox.start.y)}
                    fill="rgba(0, 100, 255, 0.1)"
                    stroke="#0064ff"
                    strokeWidth={1}
                    strokeDasharray="4 2"
                />
            )}
        </g>
    );
});

InteractionLayer.displayName = 'InteractionLayer';
