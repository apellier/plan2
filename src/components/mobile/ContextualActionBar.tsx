'use client';

import React from 'react';
import { Trash2, Copy, RotateCw, Settings2, Move } from 'lucide-react';

interface ContextualActionBarProps {
    isVisible: boolean;
    onDelete: () => void;
    onDuplicate: () => void;
    onRotate: () => void;
    onOpenProperties: () => void;
    itemLabel?: string;
}

/**
 * Fixed bottom action bar that appears when an item is selected.
 * Provides quick actions like delete, duplicate, rotate.
 */
export const ContextualActionBar: React.FC<ContextualActionBarProps> = ({
    isVisible,
    onDelete,
    onDuplicate,
    onRotate,
    onOpenProperties,
    itemLabel,
}) => {
    if (!isVisible) return null;

    const actions = [
        { icon: Move, label: 'Move', onClick: () => { }, disabled: true },
        { icon: RotateCw, label: 'Rotate', onClick: onRotate },
        { icon: Copy, label: 'Duplicate', onClick: onDuplicate },
        { icon: Settings2, label: 'Properties', onClick: onOpenProperties },
        { icon: Trash2, label: 'Delete', onClick: onDelete, danger: true },
    ];

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-2 py-2 flex items-center gap-1">
            {/* Item Label */}
            {itemLabel && (
                <>
                    <span className="px-3 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg truncate max-w-[100px]">
                        {itemLabel}
                    </span>
                    <div className="w-px h-6 bg-gray-200 mx-1" />
                </>
            )}

            {/* Action Buttons */}
            {actions.map(({ icon: Icon, label, onClick, disabled, danger }) => (
                <button
                    key={label}
                    onClick={onClick}
                    disabled={disabled}
                    className={`
                        flex flex-col items-center justify-center p-2 rounded-xl transition-all
                        ${disabled
                            ? 'opacity-40 cursor-not-allowed'
                            : danger
                                ? 'hover:bg-red-50 active:bg-red-100 text-red-600'
                                : 'hover:bg-gray-100 active:bg-gray-200'
                        }
                    `}
                    title={label}
                >
                    <Icon size={20} strokeWidth={2} />
                    <span className="text-[9px] mt-0.5 font-medium">{label}</span>
                </button>
            ))}
        </div>
    );
};
