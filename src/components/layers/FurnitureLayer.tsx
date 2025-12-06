import React, { memo } from 'react';
import { FurnitureItem } from '@/lib/types';
import { FurnitureRenderer } from '@/components/FurnitureRenderer';

interface FurnitureLayerProps {
    furniture: FurnitureItem[];
    selectedIds: string[];
    onMouseDown: (e: React.MouseEvent, id: string) => void;
    onRotationStart: (e: React.MouseEvent, objectType: 'FURNITURE') => void;
    onResizeStart: (handle: string, e: React.MouseEvent, objectType: 'FURNITURE') => void;
}

export const FurnitureLayer: React.FC<FurnitureLayerProps> = memo(({
    furniture,
    selectedIds,
    onMouseDown,
    onRotationStart,
    onResizeStart
}) => {
    return (
        <g>
            {furniture.map((item) => (
                <FurnitureRenderer
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.includes(item.id)}
                    onMouseDown={(e) => onMouseDown(e, item.id)}
                    onRotate={(e) => onRotationStart(e, 'FURNITURE')}
                    onResize={(handle, e) => onResizeStart(handle, e, 'FURNITURE')}
                />
            ))}
        </g>
    );
});

FurnitureLayer.displayName = 'FurnitureLayer';
