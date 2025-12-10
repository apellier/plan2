'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import { UnitSystem, MetricUnit, ImperialUnit } from '@/lib/constants';
import { Settings, Grid3X3, Ruler } from 'lucide-react';

interface SettingsPanelProps {
    onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
    const {
        settings,
        setUnitSystem,
        setMetricUnit,
        setImperialUnit,
        toggleGridSnap,
        setGridSize,
        toggleShowGrid,
    } = useStore(useShallow(state => ({
        settings: state.settings,
        setUnitSystem: state.setUnitSystem,
        setMetricUnit: state.setMetricUnit,
        setImperialUnit: state.setImperialUnit,
        toggleGridSnap: state.toggleGridSnap,
        toggleElementSnap: state.toggleElementSnap,
        setGridSize: state.setGridSize,
        toggleShowGrid: state.toggleShowGrid,
    })));

    return (
        <div className="fixed top-20 right-4 z-50 bg-white border-2 border-black shadow-[var(--shadow-hard)] rounded-lg w-64">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b-2 border-gray-200">
                <div className="flex items-center gap-2">
                    <Settings size={16} />
                    <h3 className="text-xs font-bold font-mono">SETTINGS</h3>
                </div>
                <button
                    onClick={onClose}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100"
                >
                    ×
                </button>
            </div>

            <div className="p-3 space-y-4">
                {/* Unit System */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Ruler size={14} />
                        <span className="text-xs font-semibold">Units</span>
                    </div>
                    <div className="flex gap-2 mb-2">
                        <button
                            onClick={() => setUnitSystem('metric')}
                            className={`flex-1 px-3 py-1.5 text-xs rounded border-2 transition-all ${settings.unitSystem === 'metric'
                                ? 'bg-neo-yellow border-black'
                                : 'border-gray-200 hover:border-gray-400'
                                }`}
                        >
                            Metric
                        </button>
                        <button
                            onClick={() => setUnitSystem('imperial')}
                            className={`flex-1 px-3 py-1.5 text-xs rounded border-2 transition-all ${settings.unitSystem === 'imperial'
                                ? 'bg-neo-yellow border-black'
                                : 'border-gray-200 hover:border-gray-400'
                                }`}
                        >
                            Imperial
                        </button>
                    </div>

                    {/* Unit Selection */}
                    <div className="flex gap-1">
                        {settings.unitSystem === 'metric' ? (
                            <>
                                {(['mm', 'cm', 'm'] as MetricUnit[]).map((unit) => (
                                    <button
                                        key={unit}
                                        onClick={() => setMetricUnit(unit)}
                                        className={`flex-1 px-2 py-1 text-[10px] rounded border transition-all ${settings.metricUnit === unit
                                            ? 'bg-gray-800 text-white border-gray-800'
                                            : 'border-gray-200 hover:border-gray-400'
                                            }`}
                                    >
                                        {unit}
                                    </button>
                                ))}
                            </>
                        ) : (
                            <>
                                {(['in', 'ft'] as ImperialUnit[]).map((unit) => (
                                    <button
                                        key={unit}
                                        onClick={() => setImperialUnit(unit)}
                                        className={`flex-1 px-2 py-1 text-[10px] rounded border transition-all ${settings.imperialUnit === unit
                                            ? 'bg-gray-800 text-white border-gray-800'
                                            : 'border-gray-200 hover:border-gray-400'
                                            }`}
                                    >
                                        {unit === 'in' ? 'inches' : 'feet'}
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* Grid Settings */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Grid3X3 size={14} />
                        <span className="text-xs font-semibold">Grid</span>
                    </div>

                    {/* Show Grid Toggle */}
                    <label className="flex items-center justify-between mb-2 cursor-pointer">
                        <span className="text-xs">Show Grid</span>
                        <button
                            onClick={toggleShowGrid}
                            className={`w-10 h-5 rounded-full transition-colors ${settings.showGrid ? 'bg-neo-green' : 'bg-gray-300'
                                }`}
                        >
                            <div
                                className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${settings.showGrid ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </label>

                    {/* Snap to Grid Toggle */}
                    <label className="flex items-center justify-between mb-2 cursor-pointer">
                        <span className="text-xs">Snap to Grid</span>
                        <button
                            onClick={toggleGridSnap}
                            className={`w-10 h-5 rounded-full transition-colors ${settings.gridSnap ? 'bg-neo-green' : 'bg-gray-300'
                                }`}
                        >
                            <div
                                className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${settings.gridSnap ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </label>

                    {/* Snap to Elements Toggle */}
                    <label className="flex items-center justify-between mb-2 cursor-pointer">
                        <span className="text-xs">Snap to Elements</span>
                        <button
                            onClick={state => {
                                // @ts-ignore - Action exists in store but maybe type def lag
                                useStore.getState().toggleElementSnap();
                            }}
                            className={`w-10 h-5 rounded-full transition-colors ${settings.elementSnap ? 'bg-neo-green' : 'bg-gray-300'
                                }`}
                        >
                            <div
                                className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${settings.elementSnap ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </label>

                    {/* Grid Size Input */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Size (cm):</span>
                        <input
                            type="number"
                            min="1"
                            max="1000"
                            value={settings.gridSize}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val > 0) setGridSize(val);
                            }}
                            className="w-16 bg-gray-50 border border-black rounded px-2 py-1 text-xs font-mono focus:bg-neo-yellow outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

