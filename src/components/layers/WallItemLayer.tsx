import React, { memo } from 'react';
import { WallItem } from '@/lib/types';
import { WallItemRenderer } from '@/components/WallItemRenderer';

interface WallItemLayerProps {
    wallItems: WallItem[];
    selectedIds: string[];
    onMouseDown: (e: React.MouseEvent, id: string) => void;
    onRotationStart: (e: React.MouseEvent, objectType: 'WALL_ITEM') => void;
    onResizeStart: (handle: string, e: React.MouseEvent, objectType: 'WALL_ITEM') => void;
}

export const WallItemLayer: React.FC<WallItemLayerProps> = memo(({
    wallItems,
    selectedIds,
    onMouseDown,
    onRotationStart,
    onResizeStart
}) => {
    return (
        <g>
            {wallItems.map((item) => (
                <WallItemRenderer
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.includes(item.id)}
                    onMouseDown={(e) => onMouseDown(e, item.id)}
                    onRotate={(e) => onRotationStart(e, 'WALL_ITEM')}
                    onResize={(handle, e) => onResizeStart(handle, e, 'WALL_ITEM')}
                />
            ))}
        </g>
    );
});

WallItemLayer.displayName = 'WallItemLayer';
