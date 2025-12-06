'use client';

import React, { useState, useRef } from 'react';
import { Canvas } from '@/components/Canvas';
import { Toolbar } from '@/components/Toolbar';
import { SettingsPanel } from '@/components/SettingsPanel';
import { RoomTemplates } from '@/components/RoomTemplates';
import { ExportDialog } from '@/components/ExportDialog';

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [viewBoxCenter, setViewBoxCenter] = useState({ x: 600, y: 400 });
  const svgRef = useRef<SVGSVGElement>(null);

  return (
    <div className="w-screen h-screen overflow-hidden bg-neo-bg text-neo-text">
      <Toolbar
        onOpenSettings={() => setShowSettings(true)}
        onOpenTemplates={() => setShowTemplates(true)}
        onOpenExport={() => setShowExport(true)}
      />
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
  );
}
