'use client';

import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import { ROOM_TEMPLATES, DEFAULT_ROOM_COLOR, DEFAULT_ROOM_OPACITY, Z_INDEX } from '@/lib/constants';
import { ShapeType, RoomVertex } from '@/lib/types';
import { LayoutTemplate, X } from 'lucide-react';

interface RoomTemplatesProps {
    onClose: () => void;
    viewBoxCenter: { x: number; y: number };
}

type TemplateKey = keyof typeof ROOM_TEMPLATES;

export const RoomTemplates: React.FC<RoomTemplatesProps> = ({ onClose, viewBoxCenter }) => {
    const { addShape, shapes, setSelected } = useStore(useShallow(state => ({
        addShape: state.addShape,
        shapes: state.shapes,
        setSelected: state.setSelected,
    })));

    const createFromTemplate = (templateKey: TemplateKey) => {
        const template = ROOM_TEMPLATES[templateKey];
        const id = uuidv4();

        // Calculate template bounds to center it
        const minX = Math.min(...template.vertices.map(v => v.x));
        const maxX = Math.max(...template.vertices.map(v => v.x));
        const minY = Math.min(...template.vertices.map(v => v.y));
        const maxY = Math.max(...template.vertices.map(v => v.y));
        const templateWidth = maxX - minX;
        const templateHeight = maxY - minY;

        // Offset to center the template at viewbox center
        const offsetX = viewBoxCenter.x - templateWidth / 2;
        const offsetY = viewBoxCenter.y - templateHeight / 2;

        const vertices: RoomVertex[] = template.vertices.map(v => ({
            id: uuidv4(),
            x: v.x + offsetX,
            y: v.y + offsetY,
            type: 'CORNER' as const,
        }));

        addShape({
            id,
            type: ShapeType.POLYGON,
            vertices,
            label: `Room ${shapes.length + 1}`,
            zIndex: Z_INDEX.ROOM,
            color: DEFAULT_ROOM_COLOR,
            opacity: DEFAULT_ROOM_OPACITY,
            wallThickness: 0,
        });

        setSelected([id]);
        onClose();
    };

    // Simple SVG preview for each template
    const renderPreview = (templateKey: TemplateKey) => {
        const template = ROOM_TEMPLATES[templateKey];
        const minX = Math.min(...template.vertices.map(v => v.x));
        const maxX = Math.max(...template.vertices.map(v => v.x));
        const minY = Math.min(...template.vertices.map(v => v.y));
        const maxY = Math.max(...template.vertices.map(v => v.y));

        const padding = 10;
        const viewBoxWidth = maxX - minX + padding * 2;
        const viewBoxHeight = maxY - minY + padding * 2;

        const pathData = template.vertices
            .map((v, i) => `${i === 0 ? 'M' : 'L'} ${v.x - minX + padding} ${v.y - minY + padding}`)
            .join(' ') + ' Z';

        return (
            <svg
                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                className="w-full h-12"
                preserveAspectRatio="xMidYMid meet"
            >
                <path
                    d={pathData}
                    fill="#fff"
                    stroke="#000"
                    strokeWidth="2"
                />
            </svg>
        );
    };

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white border-2 border-black shadow-[var(--shadow-hard)] rounded-lg w-80">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b-2 border-gray-200">
                <div className="flex items-center gap-2">
                    <LayoutTemplate size={16} />
                    <h3 className="text-xs font-bold font-mono">ROOM TEMPLATES</h3>
                </div>
                <button
                    onClick={onClose}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Templates Grid */}
            <div className="p-3 grid grid-cols-3 gap-2">
                {(Object.keys(ROOM_TEMPLATES) as TemplateKey[]).map((key) => (
                    <button
                        key={key}
                        onClick={() => createFromTemplate(key)}
                        className="flex flex-col items-center p-2 rounded border-2 border-gray-200 hover:border-black hover:bg-gray-50 transition-all"
                    >
                        {renderPreview(key)}
                        <span className="text-[10px] font-medium mt-1">
                            {ROOM_TEMPLATES[key].label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-gray-200">
                <p className="text-[9px] text-gray-400 text-center">
                    Click a template to add it to the center of the canvas
                </p>
            </div>
        </div>
    );
};
