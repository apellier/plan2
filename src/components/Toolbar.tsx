import React from 'react';
import { Square, MousePointer2, Armchair, LayoutDashboard, Hand, Undo2, Redo2, DoorOpen, AppWindow, Type, Pencil } from 'lucide-react';
import { Tool } from '@/lib/types';

import { useStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';

interface ToolbarProps { }

export const Toolbar: React.FC<ToolbarProps> = () => {
  const {
    tool: activeTool,
    setTool,
    canUndo,
    canRedo,
    undo: onUndo,
    redo: onRedo
  } = useStore(useShallow(state => ({
    tool: state.tool,
    setTool: state.setTool,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    undo: state.undo,
    redo: state.redo
  })));

  const btnClass = (isActive: boolean, disabled: boolean = false) => `
    p-3 rounded-lg border-2 border-black transition-all duration-200 flex items-center justify-center
    ${disabled
      ? 'bg-gray-100 opacity-50 cursor-not-allowed border-gray-300'
      : isActive
        ? 'bg-neo-yellow shadow-[var(--shadow-hard)] translate-x-[1px] translate-y-[1px]'
        : 'bg-white hover:bg-gray-100 shadow-[var(--shadow-hard)] hover:translate-y-[-2px] hover:shadow-[var(--shadow-hard-sm)]'}
  `;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 flex gap-4 p-2 bg-white/90 backdrop-blur-sm border-2 border-black shadow-[var(--shadow-hard)] rounded-xl z-50">
      <div className="flex gap-2 mr-2 border-r-2 border-gray-200 pr-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={btnClass(false, !canUndo)}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={20} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={btnClass(false, !canRedo)}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={20} />
        </button>
      </div>

      <button
        onClick={() => setTool(Tool.SELECT)}
        className={btnClass(activeTool === Tool.SELECT)}
        title="Select & Edit (V)"
      >
        <MousePointer2 size={20} />
      </button>

      <button
        onClick={() => setTool(Tool.PAN)}
        className={btnClass(activeTool === Tool.PAN)}
        title="Pan Tool (Space + Drag)"
      >
        <Hand size={20} />
      </button>

      <div className="w-[1px] bg-black h-8 mx-2 self-center opacity-20"></div>

      <button
        onClick={() => setTool(Tool.ROOM)}
        className={btnClass(activeTool === Tool.ROOM)}
        title="Room Tool (R)"
      >
        <Square size={20} />
      </button>

      <button
        onClick={() => setTool(Tool.DOOR)}
        className={btnClass(activeTool === Tool.DOOR)}
        title="Door Tool (D)"
      >
        <DoorOpen size={20} />
      </button>

      <button
        onClick={() => setTool(Tool.WINDOW)}
        className={btnClass(activeTool === Tool.WINDOW)}
        title="Window Tool (W)"
      >
        <AppWindow size={20} />
      </button>

      <div className="w-[1px] bg-black h-8 mx-2 self-center opacity-20"></div>

      <button
        onClick={() => setTool(Tool.PENCIL)}
        className={btnClass(activeTool === Tool.PENCIL)}
        title="Freehand Draw (P)"
      >
        <Pencil size={20} />
      </button>

      <button
        onClick={() => setTool(Tool.TEXT)}
        className={btnClass(activeTool === Tool.TEXT)}
        title="Text Tool (T)"
      >
        <Type size={20} />
      </button>

      <div className="w-[1px] bg-black h-8 mx-2 self-center opacity-20"></div>

      <button
        onClick={() => setTool(Tool.ZONE)}
        className={btnClass(activeTool === Tool.ZONE)}
        title="Create Zone (Z)"
      >
        <LayoutDashboard size={20} />
      </button>

      <button
        onClick={() => setTool(Tool.FURNITURE)}
        className={btnClass(activeTool === Tool.FURNITURE)}
        title="Furniture Library (I)"
      >
        <Armchair size={20} />
      </button>
    </div>
  );
};