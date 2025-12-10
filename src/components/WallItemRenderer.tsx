import React, { memo } from 'react';
import { WallItem, Point } from '@/lib/types';
import { distance } from '@/lib/geometry';

interface WallItemRendererProps {
    item: WallItem;
    isSelected: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
    onRotate?: (e: React.MouseEvent) => void;
    onResize?: (handle: string, e: React.MouseEvent) => void;
    wallEnds?: { start: Point, end: Point } | null; // Passed from parent if available
}

export const WallItemRenderer: React.FC<WallItemRendererProps> = memo(({ item, isSelected, onMouseDown, onRotate, onResize, wallEnds }) => {
    const { type, x, y, width, height, rotation, flipX, flipY } = item;

    // Transform
    const transform = `translate(${x}, ${y}) rotate(${rotation})`;
    const halfW = width / 2;
    const halfH = height / 2;

    const renderContent = () => {
        const itemColor = item.color || '#FFFFFF'; // Default white
        const strokeColor = item.color ? item.color : '#000000'; // Default black stroke

        if (type === 'DOOR') {
            const swingY = flipY ? -1 : 1;
            const hingeX = flipX ? 1 : -1;
            const hingePos = halfW * hingeX;
            const panelThk = 5;

            return (
                <g>
                    {/* Masking rect to hide wall behind */}
                    <rect
                        x={-halfW - 2}
                        y={-halfH - 2}
                        width={width + 4}
                        height={height + 4}
                        fill="white"
                        stroke="none"
                    />

                    {/* Jambs */}
                    <rect x={-halfW} y={-halfH} width={4} height={height} className="stroke-1"
                        style={{ fill: itemColor, stroke: strokeColor }} />
                    <rect x={halfW - 4} y={-halfH} width={4} height={height} className="stroke-1"
                        style={{ fill: itemColor, stroke: strokeColor }} />

                    {/* Swing Arc */}
                    <path
                        d={`M ${-hingePos} 0 A ${width} ${width} 0 0 ${(flipX === flipY) ? 1 : 0} ${hingePos} ${-width * swingY}`}
                        fill="none"
                        className="stroke-1 stroke-dashed opacity-50"
                        style={{ stroke: strokeColor }}
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* Door Panel group */}
                    <g transform={`translate(${hingePos}, 0)`}>
                        <g transform={`rotate(${flipY ? (flipX ? -90 : 90) : (flipX ? 90 : -90)})`}>
                            {/* Panel */}
                            <rect
                                x={flipX ? -panelThk : 0}
                                y={flipY ? 0 : -width}
                                width={panelThk}
                                height={width} // Length
                                className="stroke-1"
                                style={{ fill: itemColor, stroke: strokeColor }}
                            />
                            {/* Handle */}
                            <circle
                                cx={flipX ? -panelThk / 2 : panelThk / 2}
                                cy={flipY ? width - 10 : -width + 10}
                                r={3}
                                className="fill-white stroke-1"
                                style={{ stroke: strokeColor }}
                            />
                        </g>
                    </g>
                </g>
            );
        } else {
            // WINDOW with Sill
            const sillDepth = 4;
            return (
                <g>
                    {/* Masking rect */}
                    <rect
                        x={-halfW - 2}
                        y={-halfH - 2}
                        width={width + 4}
                        height={height + 4}
                        fill="white"
                        stroke="none"
                    />

                    {/* Sill (Outer) */}
                    <rect
                        x={-halfW - 2} y={-halfH - sillDepth}
                        width={width + 4} height={height + sillDepth * 2}
                        className="stroke-1"
                        style={{ fill: '#f0f0f0', stroke: strokeColor }}
                    />

                    {/* Frame */}
                    <rect
                        x={-halfW} y={-halfH}
                        width={width} height={height}
                        className="stroke-1"
                        style={{ fill: itemColor, stroke: strokeColor }}
                    />

                    {/* Glass fill */}
                    <rect x={-halfW + 4} y={-halfH + 4} width={width - 8} height={height - 8} className="fill-neo-blue/20 stroke-none" />

                    {/* Glazing bars / Mullion */}
                    <line x1={0} y1={-halfH + 2} x2={0} y2={halfH - 2} className="stroke-1" style={{ stroke: strokeColor }} />
                </g>
            );
        }
    };

    const handleProps = (cursor: string, hType: string) => ({
        className: "fill-white stroke-black stroke-1 hover:fill-neo-blue cursor-" + cursor,
        onMouseDown: (e: React.MouseEvent) => {
            e.stopPropagation();
            onResize && onResize(hType, e);
        }
    });

    // Render distance dimensions to wall corners
    const renderDistances = () => {
        if (!isSelected || !wallEnds) return null;

        // Calculate distances from item center (x,y) to wall ends
        // item is at x,y. wallEnds are absolute points.
        // We need local distance relative to wall direction.
        // Easier: Calculate dist(item, start) and dist(item, end).
        // Subtract half width of item to get clear distance.

        const distStart = distance({ x, y }, wallEnds.start) - width / 2;
        const distEnd = distance({ x, y }, wallEnds.end) - width / 2;

        // Render text relative to item, but un-rotated?
        // Since item is rotated with wall, we can just display them left/right in local space?
        // Yes, if we assume wall starts at -X or +X relative to item.
        // But we don't know which way is start/end in local space without checking angles.
        // Simple approximation: Display at -width and +width.

        return (
            <g className="pointer-events-none">
                {/* Left Side (Local -X) */}
                <g transform={`translate(${-width / 2 - 20}, 0)`}>
                    <text textAnchor="end" className="text-[10px] font-mono fill-gray-500 font-bold" transform={`rotate(${-rotation})`}>
                        {Math.round(distStart)}
                    </text>
                    <line x1={0} y1={0} x2={15} y2={0} className="stroke-gray-400 stroke-1" />
                </g>
                {/* Right Side (Local +X) */}
                <g transform={`translate(${width / 2 + 20}, 0)`}>
                    <text textAnchor="start" className="text-[10px] font-mono fill-gray-500 font-bold" transform={`rotate(${-rotation})`}>
                        {Math.round(distEnd)}
                    </text>
                    <line x1={-15} y1={0} x2={0} y2={0} className="stroke-gray-400 stroke-1" />
                </g>
            </g>
        );
    }

    return (
        <g
            transform={transform}
            onMouseDown={onMouseDown}
            className={`cursor-pointer group ${isSelected ? 'opacity-100' : 'opacity-100'}`}
        >
            {renderContent()}
            {renderDistances()}

            {/* Selection Highlight & Resize Handles */}
            {isSelected && (
                <>
                    <rect
                        x={-halfW - 6}
                        y={-halfH - 6}
                        width={width + 12}
                        height={height + 12}
                        className="fill-none stroke-neo-blue stroke-2"
                        strokeDasharray="4"
                        pointerEvents="none"
                    />

                    {/* Resize Handles for Width */}
                    <rect x={-halfW - 8} y={-4} width={8} height={8} {...handleProps('ew-resize', 'L')} />
                    <rect x={halfW} y={-4} width={8} height={8} {...handleProps('ew-resize', 'R')} />
                </>
            )}
        </g>
    );
});

WallItemRenderer.displayName = 'WallItemRenderer';