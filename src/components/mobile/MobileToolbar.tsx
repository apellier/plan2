'use client';

import React, { useState } from 'react';
import { Menu, Undo2, Redo2, Save, Plus, X, Square, Layers, Armchair, Type, Pencil, Ruler, DoorOpen, AppWindow, Hand, MousePointer2 } from 'lucide-react';
import { Tool } from '@/lib/types';
import { useStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';

interface MobileToolbarProps {
    onOpenMenu: () => void;
    onOpenFurniture: () => void;
}

/**
 * Mobile-optimized toolbar with minimal top bar and floating action button.
 */
export const MobileToolbar: React.FC<MobileToolbarProps> = ({
    onOpenMenu,
    onOpenFurniture,
}) => {
    const { tool, setTool, undo, redo, canUndo, canRedo } = useStore(useShallow(state => ({
        tool: state.tool,
        setTool: state.setTool,
        undo: state.undo,
        redo: state.redo,
        canUndo: state.historyIndex > 0,
        canRedo: state.historyIndex < state.history.length - 1,
    })));

    const [showToolPicker, setShowToolPicker] = useState(false);

    const tools = [
        { tool: Tool.SELECT, icon: MousePointer2, label: 'Select' },
        { tool: Tool.PAN, icon: Hand, label: 'Pan' },
        { tool: Tool.ROOM, icon: Square, label: 'Room' },
        { tool: Tool.ZONE, icon: Layers, label: 'Zone' },
        { tool: Tool.DOOR, icon: DoorOpen, label: 'Door' },
        { tool: Tool.WINDOW, icon: AppWindow, label: 'Window' },
        { tool: Tool.FURNITURE, icon: Armchair, label: 'Furniture' },
        { tool: Tool.TEXT, icon: Type, label: 'Text' },
        { tool: Tool.PENCIL, icon: Pencil, label: 'Draw' },
        { tool: Tool.MEASURE, icon: Ruler, label: 'Measure' },
    ];

    const currentTool = tools.find(t => t.tool === tool);
    const CurrentIcon = currentTool?.icon || MousePointer2;

    const handleToolSelect = (selectedTool: Tool) => {
        setTool(selectedTool);
        setShowToolPicker(false);
        if (selectedTool === Tool.FURNITURE) {
            onOpenFurniture();
        }
    };

    return (
        <>
            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b-2 border-black shadow-md">
                <div className="flex items-center justify-between px-3 py-2">
                    {/* Left: Menu */}
                    <button
                        onClick={onOpenMenu}
                        className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Center: Current Tool */}
                    <button
                        onClick={() => setShowToolPicker(!showToolPicker)}
                        className="flex items-center gap-2 px-4 py-2 bg-neo-yellow border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                    >
                        <CurrentIcon size={20} />
                        <span className="text-sm font-semibold">{currentTool?.label || 'Select'}</span>
                    </button>

                    {/* Right: Undo/Redo */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={undo}
                            disabled={!canUndo}
                            className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-30"
                        >
                            <Undo2 size={20} />
                        </button>
                        <button
                            onClick={redo}
                            disabled={!canRedo}
                            className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-30"
                        >
                            <Redo2 size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tool Picker Dropdown */}
            {showToolPicker && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowToolPicker(false)}
                    />
                    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2 grid grid-cols-5 gap-1 w-[90vw] max-w-[400px]">
                        {tools.map(({ tool: t, icon: Icon, label }) => (
                            <button
                                key={t}
                                onClick={() => handleToolSelect(t)}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${tool === t
                                        ? 'bg-neo-yellow border-2 border-black'
                                        : 'hover:bg-gray-100 border-2 border-transparent'
                                    }`}
                            >
                                <Icon size={24} />
                                <span className="text-[10px] mt-1 font-medium">{label}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Floating Action Button */}
            <button
                onClick={onOpenFurniture}
                className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-neo-blue border-2 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
            >
                <Plus size={28} strokeWidth={2.5} className="text-white" />
            </button>
        </>
    );
};
