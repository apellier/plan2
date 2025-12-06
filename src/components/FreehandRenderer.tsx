import React from 'react';
import { FreehandPath } from '@/lib/types';
import { getSmoothedPath } from '@/lib/geometry';

interface FreehandRendererProps {
  path: FreehandPath;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

export const FreehandRenderer: React.FC<FreehandRendererProps> = ({ path, isSelected, onMouseDown }) => {
  const d = getSmoothedPath(path.points);

  return (
    <g onMouseDown={onMouseDown} className="cursor-pointer">
      {/* Invisible thicker stroke for easier selection */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={15}
        strokeLinecap="round"
      />
      {isSelected && (
        <path
          d={d}
          fill="none"
          stroke="#a2d2ff"
          strokeWidth={path.strokeWidth + 8}
          strokeLinecap="round"
          opacity={0.5}
        />
      )}
      <path
        d={d}
        fill="none"
        stroke={path.strokeColor}
        strokeWidth={path.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
};