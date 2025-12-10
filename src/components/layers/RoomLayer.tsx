import React, { memo } from 'react';
import { RoomShape, AppMode } from '@/lib/types';
import { RoomShapeRenderer } from '@/components/RoomShape';

interface RoomLayerProps {
    shapes: RoomShape[];
    selectedIds: string[];
    mode: AppMode;
    onMouseDown: (e: React.MouseEvent, id: string) => void;
    onDoubleClick: () => void;
    onVertexMouseDown: (vertexId: string, e: React.MouseEvent) => void;
    onVertexClick: (vertexId: string, e: React.MouseEvent) => void;
    onEdgeMouseDown: (vertexIndex: number, e: React.MouseEvent) => void;
    onRadiusHandleMouseDown: (vertexId: string, e: React.MouseEvent) => void;
    onRotationStart: (e: React.MouseEvent, id: string) => void;
}

export const RoomLayer: React.FC<RoomLayerProps> = memo(({
    shapes,
    selectedIds,
    mode,
    onMouseDown,
    onDoubleClick,
    onVertexMouseDown,
    onVertexClick,
    onEdgeMouseDown,
    onRadiusHandleMouseDown,
    onRotationStart
}) => {
    return (
        <g>
            {shapes.map((shape) => (
                <RoomShapeRenderer
                    key={shape.id}
                    shape={shape}
                    isSelected={selectedIds.includes(shape.id)}
                    mode={mode}
                    onMouseDown={(e) => onMouseDown(e, shape.id)}
                    onDoubleClick={onDoubleClick}
                    onVertexMouseDown={onVertexMouseDown}
                    onVertexClick={onVertexClick}
                    onEdgeMouseDown={onEdgeMouseDown}
                    onRadiusHandleMouseDown={onRadiusHandleMouseDown}
                    onRotate={(e) => onRotationStart(e, shape.id)}
                />
            ))}
        </g>
    );
});

RoomLayer.displayName = 'RoomLayer';
