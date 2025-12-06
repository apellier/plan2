import React, { memo } from 'react';
import { ZoneShape, AppMode, RoomVertex } from '@/lib/types';
import { ZoneRenderer } from '@/components/ZoneRenderer';

interface ZoneLayerProps {
    zones: ZoneShape[];
    selectedIds: string[];
    mode: AppMode;
    onMouseDown: (e: React.MouseEvent, id: string) => void;
    onDoubleClick: () => void;
    onVertexMouseDown: (vertexId: string, e: React.MouseEvent) => void;
    onEdgeMouseDown: (vertexIndex: number, e: React.MouseEvent) => void;
}

export const ZoneLayer: React.FC<ZoneLayerProps> = memo(({
    zones,
    selectedIds,
    mode,
    onMouseDown,
    onDoubleClick,
    onVertexMouseDown,
    onEdgeMouseDown
}) => {
    return (
        <g>
            {zones.map((zone) => (
                <ZoneRenderer
                    key={zone.id}
                    zone={zone}
                    isSelected={selectedIds.includes(zone.id)}
                    mode={mode}
                    onMouseDown={(e) => onMouseDown(e, zone.id)}
                    onDoubleClick={onDoubleClick}
                    onVertexMouseDown={onVertexMouseDown}
                    onEdgeMouseDown={onEdgeMouseDown}
                />
            ))}
        </g>
    );
});

ZoneLayer.displayName = 'ZoneLayer';
