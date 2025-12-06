import React, { memo } from 'react';

interface GridLayerProps {
    viewBox: { x: number; y: number; width: number; height: number };
}

export const GridLayer: React.FC<GridLayerProps> = memo(({ viewBox }) => {
    return (
        <>
            <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
        </>
    );
});

GridLayer.displayName = 'GridLayer';
