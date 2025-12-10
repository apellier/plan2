'use client';

import React, { useCallback, useRef } from 'react';
import { useStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import { Tool } from '@/lib/types';
import {
    MousePointer2, Square, Layers, DoorOpen, AppWindow,
    Type, Pencil, Hand, Undo2, Redo2, Copy, Clipboard, Files,
    Save, Upload, Trash2, Armchair, Ruler, Settings, LayoutTemplate, Download, Grid
} from 'lucide-react';

interface ToolbarProps {
    onOpenSettings: () => void;
    onOpenTemplates: () => void;
    onOpenExport: () => void;
}

const TOOL_CONFIG = [
    { tool: Tool.SELECT, icon: MousePointer2, label: 'Select', shortcut: 'V' },
    { tool: Tool.PAN, icon: Hand, label: 'Pan', shortcut: 'Space' },
    { tool: Tool.ROOM, icon: Square, label: 'Room', shortcut: 'R' },
    { tool: Tool.ZONE, icon: Layers, label: 'Zone', shortcut: 'Z' },
    { tool: Tool.FURNITURE, icon: Armchair, label: 'Furniture', shortcut: 'F' },
    { tool: Tool.DOOR, icon: DoorOpen, label: 'Door', shortcut: 'D' },
    { tool: Tool.WINDOW, icon: AppWindow, label: 'Window', shortcut: 'W' },
    { tool: Tool.PENCIL, icon: Pencil, label: 'Draw', shortcut: 'P' },
    { tool: Tool.TEXT, icon: Type, label: 'Text', shortcut: 'T' },
    { tool: Tool.MEASURE, icon: Ruler, label: 'Measure', shortcut: 'M' },
] as const;

export const Toolbar: React.FC<ToolbarProps> = ({ onOpenSettings, onOpenTemplates, onOpenExport }) => {
    const {
        tool,
        setTool,
        canUndo,
        canRedo,
        undo,
        redo,
        copy,
        paste,
        duplicate,
        selectedIds,
        clipboard,
        exportState,
        importState,
        clearAll,
        settings,
        toggleGridSnap,
        clearMeasurements,
        measurements,
        isPlacingCustomFurniture,
        setPlacingCustomFurniture,
    } = useStore(useShallow(state => ({
        tool: state.tool,
        setTool: state.setTool,
        canUndo: state.canUndo,
        canRedo: state.canRedo,
        undo: state.undo,
        redo: state.redo,
        copy: state.copy,
        paste: state.paste,
        duplicate: state.duplicate,
        selectedIds: state.selectedIds,
        clipboard: state.clipboard,
        exportState: state.exportState,
        importState: state.importState,
        clearAll: state.clearAll,
        settings: state.settings,
        toggleGridSnap: state.toggleGridSnap,
        clearMeasurements: state.clearMeasurements,
        measurements: state.measurements,
        isPlacingCustomFurniture: state.isPlacingCustomFurniture,
        setPlacingCustomFurniture: state.setPlacingCustomFurniture,
    })));

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveProject = useCallback(() => {
        const json = exportState();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `room-plan-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [exportState]);

    const handleLoadProject = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const json = event.target?.result as string;
            const success = importState(json);
            if (!success) {
                alert('Failed to import file. Please check the file format.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }, [importState]);

    const handleClear = useCallback(() => {
        if (confirm('Are you sure you want to clear all objects?')) {
            clearAll();
        }
    }, [clearAll]);

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1">
            {/* Tools */}
            <div className="bg-white border-2 border-black shadow-[var(--shadow-hard)] rounded-xl p-1.5 flex gap-1">
                {TOOL_CONFIG.map(({ tool: t, icon: Icon, label, shortcut }) => (
                    <button
                        key={t}
                        onClick={() => {
                            setTool(t);
                            // If switching to furniture, ensure custom mode is OFF unless specifically toggled via custom button
                            if (t === Tool.FURNITURE) setPlacingCustomFurniture(false);
                        }}
                        className={`flex flex-col items-center justify-center w-11 h-11 rounded-lg transition-all ${tool === t && (t !== Tool.FURNITURE || !isPlacingCustomFurniture)
                            ? 'bg-neo-yellow border-2 border-black shadow-[var(--shadow-hard-sm)]'
                            : 'hover:bg-gray-100 border-2 border-transparent'
                            }`}
                        title={`${label} (${shortcut})`}
                    >
                        <Icon size={16} strokeWidth={tool === t && (t !== Tool.FURNITURE || !isPlacingCustomFurniture) ? 2.5 : 2} />
                        <span className="text-[8px] font-bold mt-0.5">{shortcut}</span>
                    </button>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white border-2 border-black shadow-[var(--shadow-hard)] rounded-xl p-1.5 flex gap-1">
                <button
                    onClick={onOpenTemplates}
                    className="flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-all hover:bg-gray-100"
                    title="Room Templates"
                >
                    <LayoutTemplate size={16} />
                </button>
                <button
                    onClick={toggleGridSnap}
                    className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-all ${settings.gridSnap ? 'bg-neo-green' : 'hover:bg-gray-100'
                        }`}
                    title={`Grid Snap: ${settings.gridSnap ? 'ON' : 'OFF'}`}
                >
                    <Grid size={16} />
                </button>
            </div>

            {/* Divider */}
            <div className="w-px h-10 bg-gray-300 mx-0.5" />

            {/* Edit Actions */}
            <div className="bg-white border-2 border-black shadow-[var(--shadow-hard)] rounded-xl p-1.5 flex gap-1">
                <button
                    onClick={undo}
                    disabled={!canUndo}
                    className={`flex flex-col items-center justify-center w-9 h-9 rounded-lg transition-all ${canUndo ? 'hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'}`}
                    title="Undo (Ctrl+Z)"
                >
                    <Undo2 size={14} />
                </button>
                <button
                    onClick={redo}
                    disabled={!canRedo}
                    className={`flex flex-col items-center justify-center w-9 h-9 rounded-lg transition-all ${canRedo ? 'hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'}`}
                    title="Redo (Ctrl+Y)"
                >
                    <Redo2 size={14} />
                </button>
            </div>

            {/* Clipboard Actions */}
            <div className="bg-white border-2 border-black shadow-[var(--shadow-hard)] rounded-xl p-1.5 flex gap-1">
                <button
                    onClick={copy}
                    disabled={selectedIds.length === 0}
                    className={`flex flex-col items-center justify-center w-9 h-9 rounded-lg transition-all ${selectedIds.length > 0 ? 'hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'}`}
                    title="Copy (Ctrl+C)"
                >
                    <Copy size={14} />
                </button>
                <button
                    onClick={() => paste()}
                    disabled={clipboard.length === 0}
                    className={`flex flex-col items-center justify-center w-9 h-9 rounded-lg transition-all ${clipboard.length > 0 ? 'hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'}`}
                    title="Paste (Ctrl+V)"
                >
                    <Clipboard size={14} />
                </button>
                <button
                    onClick={duplicate}
                    disabled={selectedIds.length === 0}
                    className={`flex flex-col items-center justify-center w-9 h-9 rounded-lg transition-all ${selectedIds.length > 0 ? 'hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'}`}
                    title="Duplicate (Ctrl+D)"
                >
                    <Files size={14} />
                </button>
            </div>

            {/* Divider */}
            <div className="w-px h-10 bg-gray-300 mx-0.5" />

            {/* File Actions */}
            <div className="bg-white border-2 border-black shadow-[var(--shadow-hard)] rounded-xl p-1.5 flex gap-1">
                <button
                    onClick={handleSaveProject}
                    className="flex flex-col items-center justify-center w-9 h-9 rounded-lg transition-all hover:bg-gray-100"
                    title="Save Project"
                >
                    <Save size={14} />
                </button>
                <button
                    onClick={handleLoadProject}
                    className="flex flex-col items-center justify-center w-9 h-9 rounded-lg transition-all hover:bg-gray-100"
                    title="Load Project"
                >
                    <Upload size={14} />
                </button>
                <button
                    onClick={onOpenExport}
                    className="flex flex-col items-center justify-center w-9 h-9 rounded-lg transition-all hover:bg-gray-100"
                    title="Export as PNG/SVG"
                >
                    <Download size={14} />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            {/* Settings & Clear */}
            <div className="bg-white border-2 border-black shadow-[var(--shadow-hard)] rounded-xl p-1.5 flex gap-1">
                <button
                    onClick={onOpenSettings}
                    className="flex flex-col items-center justify-center w-9 h-9 rounded-lg transition-all hover:bg-gray-100"
                    title="Settings"
                >
                    <Settings size={14} />
                </button>
                <button
                    onClick={handleClear}
                    className="flex flex-col items-center justify-center w-9 h-9 rounded-lg transition-all hover:bg-red-100 text-red-600"
                    title="Clear All"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Measurement indicator */}
            {measurements.length > 0 && (
                <div className="bg-blue-100 border-2 border-blue-300 rounded-lg px-2 py-1 flex items-center gap-1">
                    <span className="text-[10px] text-blue-700 font-medium">{measurements.length} measurements</span>
                    <button
                        onClick={clearMeasurements}
                        className="text-blue-500 hover:text-blue-700"
                        title="Clear measurements"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            )}
        </div>
    );
};
