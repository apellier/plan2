import React, { memo } from 'react';
import { Measurement, Point } from '@/lib/types';
import { formatDimension } from '@/lib/units';
import { UnitSystem, MetricUnit, ImperialUnit } from '@/lib/constants';

interface MeasurementLayerProps {
    measurements: Measurement[];
    pendingMeasurement: { start: Point; end: Point } | null;
    unitSystem: UnitSystem;
    metricUnit: MetricUnit;
    imperialUnit: ImperialUnit;
}

const MeasurementLine: React.FC<{
    start: Point;
    end: Point;
    distance: number;
    unitSystem: UnitSystem;
    metricUnit: MetricUnit;
    imperialUnit: ImperialUnit;
    isPending?: boolean;
}> = ({ start, end, distance, unitSystem, metricUnit, imperialUnit, isPending }) => {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const angleDeg = angle * (180 / Math.PI);

    // Offset the label perpendicular to the line
    const offsetDistance = 15;
    const offsetX = Math.sin(angle) * offsetDistance;
    const offsetY = -Math.cos(angle) * offsetDistance;

    const unit = unitSystem === 'metric' ? metricUnit : imperialUnit;
    const label = formatDimension(distance, unitSystem, unit, 1);

    return (
        <g>
            {/* Main line */}
            <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={isPending ? '#f97316' : '#3b82f6'}
                strokeWidth={2}
                strokeDasharray={isPending ? '5,5' : 'none'}
            />

            {/* End caps */}
            <circle cx={start.x} cy={start.y} r={4} fill={isPending ? '#f97316' : '#3b82f6'} />
            <circle cx={end.x} cy={end.y} r={4} fill={isPending ? '#f97316' : '#3b82f6'} />

            {/* Distance label */}
            <g transform={`translate(${midX + offsetX}, ${midY + offsetY})`}>
                <rect
                    x={-30}
                    y={-10}
                    width={60}
                    height={20}
                    fill="white"
                    stroke={isPending ? '#f97316' : '#3b82f6'}
                    strokeWidth={1}
                    rx={3}
                />
                <text
                    x={0}
                    y={5}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight="bold"
                    fontFamily="monospace"
                    fill={isPending ? '#f97316' : '#3b82f6'}
                >
                    {label}
                </text>
            </g>
        </g>
    );
};

export const MeasurementLayer: React.FC<MeasurementLayerProps> = memo(({
    measurements,
    pendingMeasurement,
    unitSystem,
    metricUnit,
    imperialUnit
}) => {
    return (
        <g>
            {/* Existing measurements */}
            {measurements.map((m) => (
                <MeasurementLine
                    key={m.id}
                    start={m.start}
                    end={m.end}
                    distance={m.distance}
                    unitSystem={unitSystem}
                    metricUnit={metricUnit}
                    imperialUnit={imperialUnit}
                />
            ))}

            {/* Pending measurement being drawn */}
            {pendingMeasurement && (
                <MeasurementLine
                    start={pendingMeasurement.start}
                    end={pendingMeasurement.end}
                    distance={Math.sqrt(
                        Math.pow(pendingMeasurement.end.x - pendingMeasurement.start.x, 2) +
                        Math.pow(pendingMeasurement.end.y - pendingMeasurement.start.y, 2)
                    )}
                    unitSystem={unitSystem}
                    metricUnit={metricUnit}
                    imperialUnit={imperialUnit}
                    isPending
                />
            )}
        </g>
    );
});

MeasurementLayer.displayName = 'MeasurementLayer';
