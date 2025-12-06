import React, { memo } from 'react';
import { GRID_SIZE, GRID_COLOR } from '@/lib/constants';

interface GridLayerProps {
    viewBox: { x: number; y: number; width: number; height: number; scale: number };
}

export const GridLayer: React.FC<GridLayerProps> = memo(({ viewBox }) => {
    // Calculate grid bounds with some padding
    const padding = GRID_SIZE * 2;
    const startX = Math.floor((viewBox.x - padding) / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor((viewBox.y - padding) / GRID_SIZE) * GRID_SIZE;
    const endX = Math.ceil((viewBox.x + viewBox.width + padding) / GRID_SIZE) * GRID_SIZE;
    const endY = Math.ceil((viewBox.y + viewBox.height + padding) / GRID_SIZE) * GRID_SIZE;

    return (
        <>
            <defs>
                <pattern
                    id="grid"
                    width={GRID_SIZE}
                    height={GRID_SIZE}
                    patternUnits="userSpaceOnUse"
                    x={0}
                    y={0}
                >
                    <path
                        d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
                        fill="none"
                        stroke={GRID_COLOR}
                        strokeWidth="1"
                    />
                </pattern>
            </defs>
            <rect
                x={startX}
                y={startY}
                width={endX - startX}
                height={endY - startY}
                fill="url(#grid)"
            />
        </>
    );
});

GridLayer.displayName = 'GridLayer';
