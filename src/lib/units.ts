import { UNIT_CONVERSIONS, UnitSystem, MetricUnit, ImperialUnit } from './constants';

type ConversionEntry = { fromPx: number; toPx: number; label: string };

function getConversion(system: UnitSystem, unit: MetricUnit | ImperialUnit): ConversionEntry {
    if (system === 'metric') {
        return UNIT_CONVERSIONS.metric[unit as MetricUnit];
    }
    return UNIT_CONVERSIONS.imperial[unit as ImperialUnit];
}

/**
 * Convert pixels to display units
 */
export function pxToUnit(
    px: number,
    system: UnitSystem,
    unit: MetricUnit | ImperialUnit
): number {
    const conversion = getConversion(system, unit);
    return px * conversion.fromPx;
}

/**
 * Convert display units to pixels
 */
export function unitToPx(
    value: number,
    system: UnitSystem,
    unit: MetricUnit | ImperialUnit
): number {
    const conversion = getConversion(system, unit);
    return value * conversion.toPx;
}

/**
 * Format a pixel value for display with unit label
 */
export function formatDimension(
    px: number,
    system: UnitSystem,
    unit: MetricUnit | ImperialUnit,
    decimals: number = 1
): string {
    const value = pxToUnit(px, system, unit);
    const conversion = getConversion(system, unit);
    const label = conversion.label;

    // Format based on unit
    if (system === 'metric') {
        if (unit === 'm' && value < 1) {
            // Show as cm if less than 1m
            return `${(value * 100).toFixed(0)} cm`;
        }
        return `${value.toFixed(decimals)} ${label}`;
    } else {
        // Imperial
        if (unit === 'ft') {
            const feet = Math.floor(value);
            const inches = (value - feet) * 12;
            if (feet === 0) {
                return `${inches.toFixed(0)}"`;
            }
            if (inches < 0.5) {
                return `${feet}'`;
            }
            return `${feet}'${inches.toFixed(0)}"`;
        }
        return `${value.toFixed(decimals)}${label}`;
    }
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get angle between two points in degrees
 */
export function getAngle(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Snap a value to the nearest grid point
 */
export function snapToGrid(value: number, gridSize: number): number {
    return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap a point to the nearest grid intersection
 */
export function snapPointToGrid(
    point: { x: number; y: number },
    gridSize: number
): { x: number; y: number } {
    return {
        x: snapToGrid(point.x, gridSize),
        y: snapToGrid(point.y, gridSize)
    };
}
