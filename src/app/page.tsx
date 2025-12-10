'use client';

import React, { useState, useRef } from 'react';
import { Canvas } from '@/components/Canvas';
import { Toolbar } from '@/components/Toolbar';
import { MobileToolbar } from '@/components/mobile/MobileToolbar';
import { useDeviceType } from '@/hooks/useDeviceType';
import { SettingsPanel } from '@/components/SettingsPanel';
import { RoomTemplates } from '@/components/RoomTemplates';
import { ExportDialog } from '@/components/ExportDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showFurnitureLibrary, setShowFurnitureLibrary] = useState(false);
  const [viewBoxCenter, setViewBoxCenter] = useState({ x: 600, y: 400 });
  const svgRef = useRef<SVGSVGElement>(null);
  const { isMobile } = useDeviceType();

  // Helper to open furniture library (for mobile button)
  const handleOpenFurniture = () => {
    // We can simulate this by setting tool to FURNITURE if not already
    // Or we might need a specific state if the library is a modal
    // For now, let's assume setting the tool triggers the library view as in Canvas.tsx
    // But wait, Canvas.tsx handles the library display internally based on tool.
    // So distinct state might be needed if we want to force it open from the FAB.
    // Looking at Canvas.tsx: `const [showFurnitureLibrary, setShowFurnitureLibrary] = useState(false);`
    // It watches `tool` state. So setting tool to FURNITURE should work.
    // However, MobileToolbar might want to toggle it differently. 
    // Let's rely on tool state for now.
    import('@/lib/store').then(mod => mod.useStore.getState().setTool('FURNITURE' as any));
  };

  return (
    <ErrorBoundary>
      <div className="w-screen h-screen overflow-hidden bg-neo-bg text-neo-text">
        {/* Responsive Toolbar */}
        {isMobile ? (
          <MobileToolbar
            onOpenMenu={() => setShowSettings(true)}
            onOpenFurniture={() => {
              // This is a global store action, but we need to access it.
              // Since we are inside a component, we can import useStore or just rely on the fact 
              // that MobileToolbar calls setTool(FURNITURE) internally for the picker.
              // But for the FAB, it calls onOpenFurniture.
              // Let's make sure it sets the tool.
              const { useStore } = require('@/lib/store');
              useStore.getState().setTool('FURNITURE');
            }}
          />
        ) : (
          <Toolbar
            onOpenSettings={() => setShowSettings(true)}
            onOpenTemplates={() => setShowTemplates(true)}
            onOpenExport={() => setShowExport(true)}
          />
        )}

        <Canvas
          svgRef={svgRef}
          onViewBoxChange={(center) => setViewBoxCenter(center)}
        />

        {/* Settings Panel */}
        {showSettings && (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        )}

        {/* Room Templates */}
        {showTemplates && (
          <RoomTemplates
            onClose={() => setShowTemplates(false)}
            viewBoxCenter={viewBoxCenter}
          />
        )}

        {/* Export Dialog */}
        {showExport && (
          <ExportDialog
            onClose={() => setShowExport(false)}
            svgRef={svgRef}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

