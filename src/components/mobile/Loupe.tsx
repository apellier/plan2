'use client';

import React, { useEffect, useRef } from 'react';

interface LoupeProps {
    isActive: boolean;
    targetPoint: { x: number; y: number } | null;
    svgRef: React.RefObject<SVGSVGElement | null>;
    viewBox: { x: number; y: number; width: number; height: number };
    size?: number;
    zoom?: number;
}

/**
 * Magnifying glass component for precision editing on touch devices.
 * Shows a zoomed-in view of the area under the touch point.
 */
export const Loupe: React.FC<LoupeProps> = ({
    isActive,
    targetPoint,
    svgRef,
    viewBox,
    size = 100,
    zoom = 3,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!isActive || !targetPoint || !svgRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Get SVG as image
        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const rect = svgRef.current?.getBoundingClientRect();
            if (!rect) return;

            // Calculate source region (centered on target point)
            const regionSize = size / zoom;
            const sourceX = (targetPoint.x - viewBox.x) / viewBox.width * rect.width - regionSize / 2;
            const sourceY = (targetPoint.y - viewBox.y) / viewBox.height * rect.height - regionSize / 2;

            // Draw zoomed region
            ctx.save();
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
            ctx.clip();

            ctx.drawImage(
                img,
                sourceX, sourceY, regionSize, regionSize,
                0, 0, size, size
            );

            // Draw crosshair
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 2]);
            ctx.beginPath();
            ctx.moveTo(size / 2, 0);
            ctx.lineTo(size / 2, size);
            ctx.moveTo(0, size / 2);
            ctx.lineTo(size, size / 2);
            ctx.stroke();

            ctx.restore();

            // Draw border
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
            ctx.stroke();

            URL.revokeObjectURL(url);
        };
        img.src = url;
    }, [isActive, targetPoint, svgRef, viewBox, size, zoom]);

    if (!isActive || !targetPoint || !svgRef.current) return null;

    // Position loupe above the touch point
    const rect = svgRef.current.getBoundingClientRect();
    const screenX = (targetPoint.x - viewBox.x) / viewBox.width * rect.width + rect.left;
    const screenY = (targetPoint.y - viewBox.y) / viewBox.height * rect.height + rect.top;

    // Offset above finger (approximately 60px)
    const offsetY = -80;

    return (
        <div
            className="fixed pointer-events-none z-50"
            style={{
                left: screenX - size / 2,
                top: screenY + offsetY - size / 2,
                width: size,
                height: size,
            }}
        >
            <canvas
                ref={canvasRef}
                width={size}
                height={size}
                className="rounded-full shadow-lg"
            />
            {/* Coordinate label */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-mono px-2 py-0.5 rounded whitespace-nowrap">
                {Math.round(targetPoint.x)}, {Math.round(targetPoint.y)}
            </div>
        </div>
    );
};
