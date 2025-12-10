import React, { memo } from 'react';
import { FurnitureItem, AppMode } from '@/lib/types';
import { FurnitureRenderer } from '@/components/FurnitureRenderer';

interface FurnitureLayerProps {
    furniture: FurnitureItem[];
    selectedIds: string[];
    onMouseDown: (e: React.MouseEvent, id: string) => void;
    onRotationStart: (e: React.MouseEvent, objectType: 'FURNITURE') => void;
    onResizeStart: (handle: string, e: React.MouseEvent, objectType: 'FURNITURE') => void;
    onDoubleClick: (e: React.MouseEvent, id: string) => void;
    onVertexMouseDown: (vertexId: string, e: React.MouseEvent) => void;
    mode: AppMode;
}

export const FurnitureLayer: React.FC<FurnitureLayerProps> = memo(({
    furniture,
    selectedIds,
    onMouseDown,
    onRotationStart,
    onResizeStart,
    onDoubleClick,
    onVertexMouseDown,
    mode
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
                    onDoubleClick={(e) => onDoubleClick(e, item.id)}
                    onVertexMouseDown={onVertexMouseDown}
                    mode={mode}
                />
            ))}
        </g>
    );
});

FurnitureLayer.displayName = 'FurnitureLayer';
