import { useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import { Tool, AppMode } from '@/lib/types';

export const useKeyboardShortcuts = () => {
    const {
        tool,
        setTool,
        mode,
        setMode,
        selectedIds,
        setSelected,
        deleteSelected,
        undo,
        redo,
        copy,
        paste,
        duplicate,
        selectAll,
        canUndo,
        canRedo
    } = useStore(useShallow(state => ({
        tool: state.tool,
        setTool: state.setTool,
        mode: state.mode,
        setMode: state.setMode,
        selectedIds: state.selectedIds,
        setSelected: state.setSelected,
        deleteSelected: state.deleteSelected,
        undo: state.undo,
        redo: state.redo,
        copy: state.copy,
        paste: state.paste,
        duplicate: state.duplicate,
        selectAll: state.selectAll,
        canUndo: state.canUndo,
        canRedo: state.canRedo
    })));

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Ignore if typing in input or textarea
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        const isMeta = e.metaKey || e.ctrlKey;

        // Handle meta/ctrl shortcuts
        if (isMeta) {
            switch (e.key.toLowerCase()) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        if (canRedo) redo();
                    } else {
                        if (canUndo) undo();
                    }
                    return;
                case 'y':
                    e.preventDefault();
                    if (canRedo) redo();
                    return;
                case 'c':
                    e.preventDefault();
                    if (selectedIds.length > 0) copy();
                    return;
                case 'v':
                    e.preventDefault();
                    paste();
                    return;
                case 'd':
                    e.preventDefault();
                    if (selectedIds.length > 0) duplicate();
                    return;
                case 'a':
                    e.preventDefault();
                    selectAll();
                    return;
            }
        }

        // Handle single key shortcuts (non-meta)
        if (!isMeta) {
            switch (e.key) {
                case 'Escape':
                    if (mode !== AppMode.IDLE) {
                        setMode(AppMode.IDLE);
                    } else if (selectedIds.length > 0) {
                        setSelected([]);
                    } else {
                        setTool(Tool.SELECT);
                    }
                    return;
                case 'Delete':
                case 'Backspace':
                    if (selectedIds.length > 0) {
                        deleteSelected();
                    }
                    return;
                case 'v':
                case 'V':
                    setTool(Tool.SELECT);
                    return;
                case 'r':
                case 'R':
                    setTool(Tool.ROOM);
                    return;
                case 'z':
                case 'Z':
                    setTool(Tool.ZONE);
                    return;
                case 'd':
                case 'D':
                    setTool(Tool.DOOR);
                    return;
                case 'w':
                case 'W':
                    setTool(Tool.WINDOW);
                    return;
                case 'p':
                case 'P':
                    setTool(Tool.PENCIL);
                    return;
                case 't':
                case 'T':
                    setTool(Tool.TEXT);
                    return;
                case 'f':
                case 'F':
                    setTool(Tool.FURNITURE);
                    return;
                case 'm':
                case 'M':
                    setTool(Tool.MEASURE);
                    return;
                case ' ':
                    e.preventDefault();
                    setTool(Tool.PAN);
                    return;
            }
        }
    }, [tool, mode, selectedIds, setTool, setMode, setSelected, deleteSelected, undo, redo, copy, paste, duplicate, selectAll, canUndo, canRedo]);

    const handleKeyUp = useCallback((e: KeyboardEvent) => {
        // Return to SELECT when space is released (pan mode)
        if (e.key === ' ' && tool === Tool.PAN) {
            setTool(Tool.SELECT);
        }
    }, [tool, setTool]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);
};
