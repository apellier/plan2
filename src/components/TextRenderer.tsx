import React from 'react';
import { TextItem } from '@/lib/types';

interface TextRendererProps {
  item: TextItem;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onRotate?: (e: React.MouseEvent) => void;
}

export const TextRenderer: React.FC<TextRendererProps> = ({ item, isSelected, onMouseDown, onRotate }) => {
  return (
    <g
      transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation})`}
      onMouseDown={onMouseDown}
      className="cursor-pointer"
    >
      {isSelected && (
        <rect
          x="-4" y="-20"
          width={(item.text.length * item.fontSize * 0.6) + 8}
          height={item.fontSize + 8}
          className="fill-neo-blue/20 stroke-neo-blue stroke-1 dashed"
        />
      )}
      <text
        className="font-bold font-mono"
        style={{
          fontSize: item.fontSize,
          fill: item.color,
          userSelect: 'none'
        }}
      >
        {item.text}
      </text>
    </g>
  );
};