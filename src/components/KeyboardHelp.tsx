'use client';

import React, { useEffect, useState } from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardHelpProps {
    onClose: () => void;
}

const shortcuts = [
    {
        category: 'Tools', items: [
            { keys: ['V'], description: 'Select Tool' },
            { keys: ['H'], description: 'Pan Tool' },
            { keys: ['R'], description: 'Room Tool' },
            { keys: ['Z'], description: 'Zone Tool' },
            { keys: ['F'], description: 'Furniture Tool' },
            { keys: ['D'], description: 'Door Tool' },
            { keys: ['W'], description: 'Window Tool' },
            { keys: ['P'], description: 'Pencil/Draw Tool' },
            { keys: ['T'], description: 'Text Tool' },
            { keys: ['M'], description: 'Measure Tool' },
        ]
    },
    {
        category: 'Edit', items: [
            { keys: ['⌘/Ctrl', 'Z'], description: 'Undo' },
            { keys: ['⌘/Ctrl', 'Shift', 'Z'], description: 'Redo' },
            { keys: ['⌘/Ctrl', 'C'], description: 'Copy' },
            { keys: ['⌘/Ctrl', 'V'], description: 'Paste' },
            { keys: ['⌘/Ctrl', 'D'], description: 'Duplicate' },
            { keys: ['⌘/Ctrl', 'A'], description: 'Select All' },
            { keys: ['Delete/⌫'], description: 'Delete Selected' },
            { keys: ['Escape'], description: 'Deselect / Cancel' },
        ]
    },
    {
        category: 'View', items: [
            { keys: ['G'], description: 'Toggle Grid Snap' },
            { keys: ['Space + Drag'], description: 'Pan Canvas' },
            { keys: ['Scroll'], description: 'Zoom In/Out' },
            { keys: ['?'], description: 'Show This Help' },
        ]
    },
];

export const KeyboardHelp: React.FC<KeyboardHelpProps> = ({ onClose }) => {
    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === '?') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={onClose}>
            <div
                className="bg-white border-2 border-black shadow-[var(--shadow-hard)] rounded-xl w-[600px] max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-2 border-black bg-neo-yellow">
                    <div className="flex items-center gap-2">
                        <Keyboard size={20} />
                        <h2 className="text-sm font-bold font-mono">KEYBOARD SHORTCUTS</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/10 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                    <div className="grid grid-cols-2 gap-6">
                        {shortcuts.map((section) => (
                            <div key={section.category}>
                                <h3 className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-wider">
                                    {section.category}
                                </h3>
                                <div className="space-y-2">
                                    {section.items.map((shortcut, idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <span className="text-xs text-gray-700">{shortcut.description}</span>
                                            <div className="flex gap-1">
                                                {shortcut.keys.map((key, keyIdx) => (
                                                    <kbd
                                                        key={keyIdx}
                                                        className="px-2 py-1 text-[10px] font-mono bg-gray-100 border border-gray-300 rounded shadow-sm"
                                                    >
                                                        {key}
                                                    </kbd>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                    <span className="text-xs text-gray-500">Press <kbd className="px-1 bg-gray-100 border rounded text-[10px]">?</kbd> or <kbd className="px-1 bg-gray-100 border rounded text-[10px]">Esc</kbd> to close</span>
                </div>
            </div>
        </div>
    );
};
