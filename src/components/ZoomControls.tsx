'use client';

import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ZoomControlsProps {
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFitToView: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
    scale,
    onZoomIn,
    onZoomOut,
    onFitToView
}) => {
    const zoomPercent = Math.round(scale * 100);

    return (
        <div className="fixed bottom-6 right-6 flex items-center gap-1 bg-white border-2 border-black rounded-lg shadow-[var(--shadow-hard)] z-40">
            <button
                onClick={onZoomOut}
                className="p-2 hover:bg-gray-100 rounded-l-md transition-colors"
                title="Zoom Out"
            >
                <ZoomOut size={16} />
            </button>

            <div className="px-2 py-1 min-w-[50px] text-center border-x border-gray-200">
                <span className="text-xs font-mono font-bold">{zoomPercent}%</span>
            </div>

            <button
                onClick={onZoomIn}
                className="p-2 hover:bg-gray-100 transition-colors"
                title="Zoom In"
            >
                <ZoomIn size={16} />
            </button>

            <button
                onClick={onFitToView}
                className="p-2 hover:bg-gray-100 rounded-r-md transition-colors border-l border-gray-200"
                title="Fit to View"
            >
                <Maximize2 size={16} />
            </button>
        </div>
    );
};
