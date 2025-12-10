'use client';

import React, { useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface NudgeControlsProps {
    onNudge: (dx: number, dy: number) => void;
    step?: number;
}

/**
 * D-Pad control for precise 1px movement on touch devices.
 * Solves the "fat finger" problem by providing accurate nudge controls.
 */
export const NudgeControls: React.FC<NudgeControlsProps> = ({
    onNudge,
    step = 1,
}) => {
    const handleNudge = useCallback((dx: number, dy: number) => {
        onNudge(dx * step, dy * step);
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    }, [onNudge, step]);

    const buttonClass = `
        flex items-center justify-center w-10 h-10 
        bg-white border-2 border-gray-300 rounded-lg
        active:bg-gray-100 active:border-black active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
        transition-all touch-manipulation
    `;

    return (
        <div className="inline-flex flex-col items-center gap-1 p-2 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-[10px] font-semibold text-gray-500 mb-1">NUDGE</span>

            {/* Up */}
            <button
                className={buttonClass}
                onClick={() => handleNudge(0, -1)}
                aria-label="Move up"
            >
                <ChevronUp size={20} strokeWidth={2.5} />
            </button>

            {/* Left, Center, Right */}
            <div className="flex items-center gap-1">
                <button
                    className={buttonClass}
                    onClick={() => handleNudge(-1, 0)}
                    aria-label="Move left"
                >
                    <ChevronLeft size={20} strokeWidth={2.5} />
                </button>

                <div className="w-10 h-10 flex items-center justify-center text-[10px] font-mono text-gray-400">
                    {step}px
                </div>

                <button
                    className={buttonClass}
                    onClick={() => handleNudge(1, 0)}
                    aria-label="Move right"
                >
                    <ChevronRight size={20} strokeWidth={2.5} />
                </button>
            </div>

            {/* Down */}
            <button
                className={buttonClass}
                onClick={() => handleNudge(0, 1)}
                aria-label="Move down"
            >
                <ChevronDown size={20} strokeWidth={2.5} />
            </button>
        </div>
    );
};
