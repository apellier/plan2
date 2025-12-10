'use client';

import { useRef, useCallback } from 'react';

interface TouchState {
    initialDistance: number;
    initialScale: number;
    initialCenter: { x: number; y: number };
    initialViewBox: { x: number; y: number };
}

interface ViewBox {
    x: number;
    y: number;
    scale: number;
    width: number;
    height: number;
}

interface UseTouchGesturesProps {
    svgRef: React.RefObject<SVGSVGElement | null>;
    viewBox: ViewBox;
    setViewBox: React.Dispatch<React.SetStateAction<ViewBox>>;
    zoomMin?: number;
    zoomMax?: number;
}

interface TouchGestureHandlers {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    isGesturing: boolean;
}

/**
 * Hook for handling multi-touch gestures (pinch-zoom, two-finger pan).
 */
export function useTouchGestures({
    svgRef,
    viewBox,
    setViewBox,
    zoomMin = 0.1,
    zoomMax = 10,
}: UseTouchGesturesProps): TouchGestureHandlers {
    const touchState = useRef<TouchState | null>(null);
    const isGesturing = useRef(false);

    const getDistance = (t1: React.Touch, t2: React.Touch): number => {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const getCenter = (t1: React.Touch, t2: React.Touch): { x: number; y: number } => ({
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
    });

    const clientToSVG = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        return {
            x: viewBox.x + (clientX - rect.left) * viewBox.width / rect.width,
            y: viewBox.y + (clientY - rect.top) * viewBox.height / rect.height,
        };
    }, [svgRef, viewBox]);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            isGesturing.current = true;

            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const center = getCenter(t1, t2);

            touchState.current = {
                initialDistance: getDistance(t1, t2),
                initialScale: viewBox.scale,
                initialCenter: clientToSVG(center.x, center.y),
                initialViewBox: { x: viewBox.x, y: viewBox.y },
            };
        }
    }, [viewBox.scale, viewBox.x, viewBox.y, clientToSVG]);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2 && touchState.current) {
            e.preventDefault();

            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const currentDistance = getDistance(t1, t2);
            const currentCenter = getCenter(t1, t2);

            // Calculate new scale from pinch
            const scaleRatio = currentDistance / touchState.current.initialDistance;
            const newScale = Math.min(zoomMax, Math.max(zoomMin, touchState.current.initialScale * scaleRatio));

            // Calculate new dimensions
            const newWidth = window.innerWidth / newScale;
            const newHeight = window.innerHeight / newScale;

            // Calculate pan offset (in client coordinates)
            const rect = svgRef.current?.getBoundingClientRect();
            if (!rect) return;

            const initialClientCenter = {
                x: rect.left + (touchState.current.initialCenter.x - touchState.current.initialViewBox.x) * rect.width / viewBox.width,
                y: rect.top + (touchState.current.initialCenter.y - touchState.current.initialViewBox.y) * rect.height / viewBox.height,
            };

            const panDeltaClient = {
                x: currentCenter.x - initialClientCenter.x,
                y: currentCenter.y - initialClientCenter.y,
            };

            // Convert pan delta to SVG coordinates at new scale
            const panDeltaSVG = {
                x: panDeltaClient.x * newWidth / rect.width,
                y: panDeltaClient.y * newHeight / rect.height,
            };

            // Calculate new viewBox position
            // Keep the initial center point under the current center of the gesture
            const newX = touchState.current.initialCenter.x - (currentCenter.x - rect.left) * newWidth / rect.width;
            const newY = touchState.current.initialCenter.y - (currentCenter.y - rect.top) * newHeight / rect.height;

            setViewBox({
                x: newX,
                y: newY,
                scale: newScale,
                width: newWidth,
                height: newHeight,
            });
        }
    }, [svgRef, viewBox.width, viewBox.height, zoomMin, zoomMax, setViewBox]);

    const onTouchEnd = useCallback((e: React.TouchEvent) => {
        if (e.touches.length < 2) {
            touchState.current = null;
            isGesturing.current = false;
        }
    }, []);

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        isGesturing: isGesturing.current,
    };
}
