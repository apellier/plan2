import React, { memo } from 'react';
import { TextItem, FreehandPath } from '@/lib/types';
import { TextRenderer } from '@/components/TextRenderer';
import { FreehandRenderer } from '@/components/FreehandRenderer';

interface AnnotationLayerProps {
    texts: TextItem[];
    drawings: FreehandPath[];
    selectedIds: string[];
    onTextMouseDown: (e: React.MouseEvent, id: string) => void;
    onTextRotationStart: (e: React.MouseEvent, objectType: 'TEXT') => void;
    onDrawingMouseDown: (e: React.MouseEvent, id: string) => void;
    pendingDrawing: { x: number; y: number }[];
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = memo(({
    texts,
    drawings,
    selectedIds,
    onTextMouseDown,
    onTextRotationStart,
    onDrawingMouseDown,
    pendingDrawing
}) => {
    return (
        <g>
            {/* Drawings */}
            {drawings.map((drawing) => (
                <FreehandRenderer
                    key={drawing.id}
                    path={drawing}
                    isSelected={selectedIds.includes(drawing.id)}
                    onMouseDown={(e) => onDrawingMouseDown(e, drawing.id)}
                />
            ))}

            {/* Pending Drawing */}
            {pendingDrawing.length > 0 && (
                <path
                    d={`M ${pendingDrawing.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                    fill="none"
                    stroke="#000"
                    strokeWidth={2}
                    strokeLinecap="round"
                />
            )}

            {/* Texts */}
            {texts.map((item) => (
                <TextRenderer
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.includes(item.id)}
                    onMouseDown={(e) => onTextMouseDown(e, item.id)}
                    onRotate={(e) => onTextRotationStart(e, 'TEXT')}
                />
            ))}
        </g>
    );
});

AnnotationLayer.displayName = 'AnnotationLayer';
