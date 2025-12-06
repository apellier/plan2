'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Download, X, FileImage, FileCode } from 'lucide-react';

interface ExportDialogProps {
    onClose: () => void;
    svgRef: React.RefObject<SVGSVGElement | null>;
}

type ExportFormat = 'png' | 'svg';

export const ExportDialog: React.FC<ExportDialogProps> = ({ onClose, svgRef }) => {
    const [format, setFormat] = useState<ExportFormat>('png');
    const [scale, setScale] = useState(2);
    const [backgroundColor, setBackgroundColor] = useState('#fdf6e3');
    const [includeBackground, setIncludeBackground] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const downloadLinkRef = useRef<HTMLAnchorElement>(null);

    const exportAsSVG = useCallback(() => {
        if (!svgRef.current) return;

        // Clone the SVG
        const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;

        // Add background if needed
        if (includeBackground) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('width', '100%');
            rect.setAttribute('height', '100%');
            rect.setAttribute('fill', backgroundColor);
            svgClone.insertBefore(rect, svgClone.firstChild);
        }

        // Add xmlns attribute
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        // Serialize to string
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgClone);

        // Create blob and download
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `room-plan-${new Date().toISOString().slice(0, 10)}.svg`;
        a.click();

        URL.revokeObjectURL(url);
    }, [svgRef, includeBackground, backgroundColor]);

    const exportAsPNG = useCallback(async () => {
        if (!svgRef.current) return;

        setIsExporting(true);

        try {
            // Get the SVG dimensions from viewBox
            const viewBox = svgRef.current.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, 1200, 800];
            const width = viewBox[2] * scale;
            const height = viewBox[3] * scale;

            // Clone the SVG
            const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
            svgClone.setAttribute('width', width.toString());
            svgClone.setAttribute('height', height.toString());

            // Add background if needed
            if (includeBackground) {
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', viewBox[0].toString());
                rect.setAttribute('y', viewBox[1].toString());
                rect.setAttribute('width', viewBox[2].toString());
                rect.setAttribute('height', viewBox[3].toString());
                rect.setAttribute('fill', backgroundColor);
                svgClone.insertBefore(rect, svgClone.firstChild);
            }

            svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            // Serialize to string
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svgClone);

            // Convert to data URL
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            // Create image
            const img = new Image();
            img.onload = () => {
                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                if (ctx) {
                    // Draw background
                    if (includeBackground) {
                        ctx.fillStyle = backgroundColor;
                        ctx.fillRect(0, 0, width, height);
                    }

                    // Draw SVG
                    ctx.drawImage(img, 0, 0, width, height);

                    // Export to PNG
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const pngUrl = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = pngUrl;
                            a.download = `room-plan-${new Date().toISOString().slice(0, 10)}.png`;
                            a.click();
                            URL.revokeObjectURL(pngUrl);
                        }
                        setIsExporting(false);
                    }, 'image/png');
                }

                URL.revokeObjectURL(url);
            };

            img.onerror = () => {
                console.error('Failed to load SVG for export');
                setIsExporting(false);
                URL.revokeObjectURL(url);
            };

            img.src = url;
        } catch (error) {
            console.error('Export failed:', error);
            setIsExporting(false);
        }
    }, [svgRef, scale, includeBackground, backgroundColor]);

    const handleExport = () => {
        if (format === 'svg') {
            exportAsSVG();
        } else {
            exportAsPNG();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white border-2 border-black shadow-[var(--shadow-hard)] rounded-lg w-80">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b-2 border-gray-200">
                    <div className="flex items-center gap-2">
                        <Download size={16} />
                        <h3 className="text-xs font-bold font-mono">EXPORT</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Format Selection */}
                    <div>
                        <label className="text-xs font-semibold block mb-2">Format</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFormat('png')}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded border-2 transition-all ${
                                    format === 'png'
                                        ? 'bg-neo-yellow border-black'
                                        : 'border-gray-200 hover:border-gray-400'
                                }`}
                            >
                                <FileImage size={16} />
                                <span className="text-xs font-medium">PNG</span>
                            </button>
                            <button
                                onClick={() => setFormat('svg')}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded border-2 transition-all ${
                                    format === 'svg'
                                        ? 'bg-neo-yellow border-black'
                                        : 'border-gray-200 hover:border-gray-400'
                                }`}
                            >
                                <FileCode size={16} />
                                <span className="text-xs font-medium">SVG</span>
                            </button>
                        </div>
                    </div>

                    {/* Scale (PNG only) */}
                    {format === 'png' && (
                        <div>
                            <label className="text-xs font-semibold block mb-2">Scale</label>
                            <select
                                value={scale}
                                onChange={(e) => setScale(Number(e.target.value))}
                                className="w-full px-3 py-2 text-xs border-2 border-gray-200 rounded focus:border-black focus:outline-none"
                            >
                                <option value={1}>1x (Standard)</option>
                                <option value={2}>2x (High Quality)</option>
                                <option value={3}>3x (Print Quality)</option>
                                <option value={4}>4x (Ultra HD)</option>
                            </select>
                        </div>
                    )}

                    {/* Background */}
                    <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeBackground}
                                onChange={(e) => setIncludeBackground(e.target.checked)}
                                className="w-4 h-4 rounded border-2 border-gray-300"
                            />
                            <span className="text-xs">Include Background</span>
                        </label>
                        {includeBackground && (
                            <div className="flex items-center gap-2 mt-2 ml-6">
                                <input
                                    type="color"
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className="w-8 h-8 rounded border-2 border-gray-200 cursor-pointer"
                                />
                                <span className="text-xs text-gray-500 font-mono">{backgroundColor}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-200 flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-xs font-medium border-2 border-gray-200 rounded hover:border-gray-400 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex-1 px-4 py-2 text-xs font-medium bg-neo-yellow border-2 border-black rounded hover:bg-yellow-300 transition-all disabled:opacity-50"
                    >
                        {isExporting ? 'Exporting...' : 'Export'}
                    </button>
                </div>

                <a ref={downloadLinkRef} className="hidden" />
            </div>
        </div>
    );
};
