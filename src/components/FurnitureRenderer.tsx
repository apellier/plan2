import React, { memo } from 'react';
import { FurnitureItem, AppMode } from '@/lib/types';
import { generateRoomPath, getRenderSegments, midpoint, subtract, normalize } from '@/lib/geometry';

interface FurnitureRendererProps {
    item: FurnitureItem;
    isSelected: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
    onRotate?: (e: React.MouseEvent) => void;
    onResize?: (handle: string, e: React.MouseEvent) => void;
    onDoubleClick?: (e: React.MouseEvent) => void;
    onVertexMouseDown?: (vertexId: string, e: React.MouseEvent) => void;
    mode?: AppMode;
}

export const FurnitureRenderer: React.FC<FurnitureRendererProps> = memo(({
    item,
    isSelected,
    onMouseDown,
    onRotate,
    onResize,
    onDoubleClick,
    onVertexMouseDown,
    mode
}) => {
    const { type, width, height, vertices, color } = item;

    // Center origin logic
    const halfW = width / 2;
    const halfH = height / 2;

    // Color override helper
    const getContentClass = (defaultClass: string) => {
        if (!color) return defaultClass;
        return defaultClass.replace(/fill-\S+/g, '');
    };
    const style = color ? { fill: color } : {};

    const renderContent = () => {
        if (type === 'CUSTOM' && vertices) {
            const path = generateRoomPath(vertices);
            return (
                <path
                    d={path}
                    className={`fill-white stroke-black stroke-2 ${isSelected ? 'fill-neo-yellow/20' : ''}`}
                    style={style}
                    vectorEffect="non-scaling-stroke"
                />
            );
        }

        // Standard Furniture
        switch (type) {
            case 'BED_QUEEN':
                return (
                    <>
                        <rect x={-halfW} y={-halfH} width={width} height={height} rx={4} className="fill-white stroke-black stroke-2" style={style} />
                        <rect x={-halfW + 10} y={-halfH + 10} width={width / 2 - 15} height={30} rx={4} className="fill-gray-100 stroke-black stroke-1" />
                        <rect x={5} y={-halfH + 10} width={width / 2 - 15} height={30} rx={4} className="fill-gray-100 stroke-black stroke-1" />
                        <rect x={-halfW} y={0} width={width} height={halfH} rx={2} className="fill-neo-blue/20 stroke-black stroke-1 opacity-50" />
                    </>
                );
            case 'SOFA_3SEATER':
                return (
                    <>
                        <rect x={-halfW} y={-halfH} width={width} height={height} rx={8} className="fill-white stroke-black stroke-2" style={style} />
                        <rect x={-halfW} y={-halfH} width={width} height={20} rx={4} className="fill-gray-200 stroke-black stroke-1" />
                        <rect x={-halfW} y={-halfH} width={20} height={height} rx={4} className="fill-gray-200 stroke-black stroke-1" />
                        <rect x={halfW - 20} y={-halfH} width={20} height={height} rx={4} className="fill-gray-200 stroke-black stroke-1" />
                    </>
                );
            case 'TABLE_DINING':
                return <rect x={-halfW} y={-halfH} width={width} height={height} rx={4} className="fill-neo-yellow/30 stroke-black stroke-2" style={style} />;
            case 'CHAIR_OFFICE':
                return <circle r={width / 2} className="fill-white stroke-black stroke-2" style={style} />;
            case 'PLANT':
                return (
                    <>
                        <circle r={width / 2} className="fill-neo-green stroke-black stroke-2" style={style} />
                        <circle r={width / 3} className="fill-neo-green/50 stroke-black stroke-1" />
                    </>
                );
            default:
                return <rect x={-halfW} y={-halfH} width={width} height={height} className="fill-white stroke-black stroke-2" style={style} />;
        }
    };

    // Dimensions for standard items
    const renderDimensions = () => {
        if (type === 'CUSTOM') return null; // Custom uses vertex dimensioning
        if (!isSelected) return null;

        return (
            <g className="pointer-events-none">
                {/* Width Dim */}
                <g transform={`translate(0, ${-halfH - 15})`}>
                    <rect x="-20" y="-8" width="40" height="16" rx="2" className="fill-white stroke-black stroke-1" />
                    <text textAnchor="middle" dy="0.3em" className="text-[9px] font-mono">{Math.round(width)}</text>
                </g>
                {/* Height Dim */}
                <g transform={`translate(${halfW + 20}, 0) rotate(90)`}>
                    <rect x="-20" y="-8" width="40" height="16" rx="2" className="fill-white stroke-black stroke-1" />
                    <text textAnchor="middle" dy="0.3em" className="text-[9px] font-mono">{Math.round(height)}</text>
                </g>
            </g>
        );
    }

    // Handle Logic
    const handleProps = (cursor: string, hType: string) => ({
        className: "fill-white stroke-black stroke-1 hover:fill-neo-blue cursor-" + cursor,
        onMouseDown: (e: React.MouseEvent) => {
            e.stopPropagation();
            onResize && onResize(hType, e);
        }
    });

    const isCustom = type === 'CUSTOM';
    const transform = isCustom ? '' : `translate(${item.x}, ${item.y}) rotate(${item.rotation})`;

    // Check if we are in vertex editing mode for this custom item
    const isVertexMode = isSelected && isCustom && mode === AppMode.VERTEX_EDIT;

    // For Custom items, we render dimensions using the geometry helper
    const renderCustomDimensions = () => {
        if (!isCustom || !vertices || !isSelected) return null;
        const segments = getRenderSegments(vertices);
        return segments.map((seg, i) => {
            const mid = midpoint(seg.start, seg.end);
            return (
                <g key={`dim-${i}`} className="pointer-events-none select-none">
                    <rect
                        x={mid.x - 15} y={mid.y - 8} width="30" height="16" rx="4"
                        className="fill-white stroke-black stroke-1 opacity-90"
                    />
                    <text
                        x={mid.x} y={mid.y}
                        textAnchor="middle"
                        dy="0.35em"
                        className="text-[9px] font-mono font-bold fill-black"
                    >
                        {Math.round(seg.length)}
                    </text>
                </g>
            );
        });
    }

    return (
        <>
            <g
                transform={transform}
                onMouseDown={onMouseDown}
                onDoubleClick={onDoubleClick}
                className="cursor-move group"
            >
                {renderContent()}
                {renderDimensions()}

                {isSelected && !isCustom && (
                    <>
                        <rect
                            x={-halfW - 5} y={-halfH - 5}
                            width={width + 10} height={height + 10}
                            className="fill-none stroke-neo-blue stroke-1"
                            strokeDasharray="4"
                        />

                        <rect x={-halfW - 8} y={-halfH - 8} width={8} height={8} {...handleProps('nw-resize', 'TL')} />
                        <rect x={halfW} y={-halfH - 8} width={8} height={8} {...handleProps('ne-resize', 'TR')} />
                        <rect x={-halfW - 8} y={halfH} width={8} height={8} {...handleProps('sw-resize', 'BL')} />
                        <rect x={halfW} y={halfH} width={8} height={8} {...handleProps('se-resize', 'BR')} />

                        <rect x={-4} y={-halfH - 8} width={8} height={8} {...handleProps('ns-resize', 'T')} />
                        <rect x={-4} y={halfH} width={8} height={8} {...handleProps('ns-resize', 'B')} />
                        <rect x={-halfW - 8} y={-4} width={8} height={8} {...handleProps('ew-resize', 'L')} />
                        <rect x={halfW} y={-4} width={8} height={8} {...handleProps('ew-resize', 'R')} />

                        <line x1={0} y1={-halfH - 5} x2={0} y2={-halfH - 30} className="stroke-black stroke-1" />
                        <circle
                            cx={0} cy={-halfH - 30} r={6}
                            className="fill-white stroke-black stroke-1 cursor-grab hover:bg-neo-yellow"
                            onMouseDown={(e) => { onRotate && onRotate(e); }}
                        />
                    </>
                )}
            </g>
            {renderCustomDimensions()}

            {/* Vertex Mode UI - Rendered in global coordinates since isCustom transform is empty */}
            {isVertexMode && vertices && (
                <>
                    {vertices.map((v) => (
                        <g
                            key={v.id}
                            transform={`translate(${v.x}, ${v.y})`}
                            className="cursor-move"
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                onVertexMouseDown && onVertexMouseDown(v.id, e);
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
        </>
    );
});

FurnitureRenderer.displayName = 'FurnitureRenderer';