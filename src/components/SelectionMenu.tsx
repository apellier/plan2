import React, { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { RoomShape, ZoneShape } from '@/lib/types';

interface SelectionMenuProps {
  shape: RoomShape | ZoneShape;
  onDelete: () => void;
  onLabelChange: (newLabel: string) => void;
  onColorChange?: (color: string) => void;
  position: { x: number, y: number };
  isZone?: boolean;
}

const ZONE_COLORS = [
    '#b9fbc0', // Green
    '#ffc2d1', // Pink
    '#a2d2ff', // Blue
    '#ffef9f', // Yellow
    '#e2e8f0', // Gray
];

export const SelectionMenu: React.FC<SelectionMenuProps> = ({ shape, onDelete, onLabelChange, onColorChange, position, isZone }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(shape.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLabel(shape.label);
  }, [shape.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      onLabelChange(label);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    onLabelChange(label);
  };

  return (
    <div 
        className="absolute z-40 bg-white border-2 border-black shadow-[var(--shadow-hard)] rounded-lg p-1.5 flex flex-col gap-2 min-w-[120px]"
        style={{ 
            left: position.x, 
            top: position.y,
            transform: 'translate(-50%, -100%)' 
        }}
        onMouseDown={(e) => e.stopPropagation()}
    >
        <div className="flex gap-2 items-center">
            <div className="px-1 border-r border-gray-200">
                {isEditing ? (
                    <input 
                        ref={inputRef}
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        className="w-24 text-xs font-bold bg-neo-yellow outline-none px-1 py-0.5 rounded"
                    />
                ) : (
                    <span 
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-bold px-1 py-0.5 cursor-text hover:bg-gray-100 rounded block min-w-[3rem] text-center"
                        title="Click to rename"
                    >
                        {label}
                    </span>
                )}
            </div>
            
            <button 
                onClick={onDelete}
                className="p-1.5 bg-white hover:bg-red-100 text-gray-500 hover:text-red-600 rounded transition-colors"
                title="Delete"
            >
                <Trash2 size={14} />
            </button>
        </div>

        {isZone && onColorChange && (
            <div className="flex gap-1 pt-1 border-t border-gray-100 justify-center">
                {ZONE_COLORS.map(c => (
                    <button
                        key={c}
                        onClick={() => onColorChange(c)}
                        className={`w-4 h-4 rounded-full border border-black hover:scale-125 transition-transform ${(shape as ZoneShape).color === c ? 'ring-1 ring-offset-1 ring-black' : ''}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>
        )}
    </div>
  );
};