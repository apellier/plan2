'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GripHorizontal } from 'lucide-react';

interface BottomSheetProps {
    children: React.ReactNode;
    isOpen: boolean;
    onClose?: () => void;
    title?: string;
    collapsedHeight?: number;
    expandedHeight?: string;
}

type SheetState = 'collapsed' | 'expanded' | 'closed';

/**
 * Draggable bottom sheet component for mobile UI.
 * Supports three states: collapsed (peek), expanded (full), closed.
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
    children,
    isOpen,
    onClose,
    title,
    collapsedHeight = 80,
    expandedHeight = '60vh',
}) => {
    const [state, setState] = useState<SheetState>('collapsed');
    const [dragOffset, setDragOffset] = useState(0);
    const sheetRef = useRef<HTMLDivElement>(null);
    const dragStartY = useRef<number | null>(null);
    const dragStartState = useRef<SheetState>('collapsed');

    // Reset state when sheet opens
    useEffect(() => {
        if (isOpen) {
            setState('collapsed');
            setDragOffset(0);
        }
    }, [isOpen]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        dragStartY.current = e.touches[0].clientY;
        dragStartState.current = state;
    }, [state]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (dragStartY.current === null) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - dragStartY.current;

        // Limit drag range
        const maxDrag = 300;
        const clampedDiff = Math.max(-maxDrag, Math.min(maxDrag, diff));
        setDragOffset(clampedDiff);
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (dragStartY.current === null) return;

        const threshold = 50;

        if (dragStartState.current === 'collapsed') {
            if (dragOffset < -threshold) {
                // Dragged up → expand
                setState('expanded');
            } else if (dragOffset > threshold) {
                // Dragged down → close
                setState('closed');
                onClose?.();
            }
        } else if (dragStartState.current === 'expanded') {
            if (dragOffset > threshold) {
                // Dragged down → collapse
                setState('collapsed');
            }
        }

        setDragOffset(0);
        dragStartY.current = null;
    }, [dragOffset, onClose]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        dragStartY.current = e.clientY;
        dragStartState.current = state;

        const handleMouseMove = (e: MouseEvent) => {
            if (dragStartY.current === null) return;
            const diff = e.clientY - dragStartY.current;
            const maxDrag = 300;
            setDragOffset(Math.max(-maxDrag, Math.min(maxDrag, diff)));
        };

        const handleMouseUp = () => {
            handleTouchEnd();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [state, handleTouchEnd]);

    if (!isOpen || state === 'closed') return null;

    const getTransform = () => {
        const baseTranslate = state === 'expanded' ? 0 : `calc(100% - ${collapsedHeight}px)`;
        if (dragOffset !== 0) {
            if (state === 'expanded') {
                return `translateY(${Math.max(0, dragOffset)}px)`;
            } else {
                return `translateY(calc(100% - ${collapsedHeight}px + ${dragOffset}px))`;
            }
        }
        return `translateY(${baseTranslate})`;
    };

    return (
        <div
            ref={sheetRef}
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out"
            style={{
                transform: getTransform(),
                height: expandedHeight,
                touchAction: 'none',
            }}
        >
            {/* Drag Handle */}
            <div
                className="flex items-center justify-center py-3 cursor-grab active:cursor-grabbing"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
            >
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            {title && (
                <div className="px-4 pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <GripHorizontal size={16} className="text-gray-400" />
                        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3" style={{ maxHeight: `calc(${expandedHeight} - 60px)` }}>
                {children}
            </div>
        </div>
    );
};
