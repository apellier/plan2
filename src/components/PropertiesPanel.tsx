import React from 'react';
import { RoomShape, ZoneShape, FurnitureItem, WallItem, TextItem, FreehandPath } from '@/lib/types';
import { calculatePolygonArea, getPolygonBounds, calculatePolygonPerimeter } from '@/lib/geometry';
import { FlipHorizontal, FlipVertical, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown } from 'lucide-react';

type ItemType = 'ROOM' | 'ZONE' | 'FURNITURE' | 'WALL_ITEM' | 'TEXT' | 'DRAWING';
type PropertyValue = string | number | boolean;

interface PropertiesPanelProps {
    selectedItem: RoomShape | ZoneShape | FurnitureItem | WallItem | TextItem | FreehandPath | null;
    type: ItemType | null;
    onUpdate: (field: string, value: PropertyValue) => void;
    onDelete: () => void;
    onReorder: (id: string, direction: 'FRONT' | 'BACK' | 'FORWARD' | 'BACKWARD') => void;
}

const InputGroup = ({ label, children }: { label: string, children?: React.ReactNode }) => (
    <div className="flex flex-col gap-1 mb-3">
        <label className="text-[10px] font-bold text-gray-500 uppercase">{label}</label>
        {children}
    </div>
);

const NumberInput = ({ label, value, field, onUpdate, step = 1 }: { label: string, value: number, field: string, onUpdate: (f: string, v: PropertyValue) => void, step?: number }) => (
    <div className="flex items-center gap-2">
        <span className="text-xs font-mono w-4">{label}</span>
        <input
            type="number"
            step={step}
            value={Math.round(value * 10) / 10}
            onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) onUpdate(field, val);
            }}
            className="w-full bg-gray-50 border border-black rounded px-2 py-1 text-xs font-mono focus:bg-neo-yellow outline-none"
        />
    </div>
);

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedItem, type, onUpdate, onDelete, onReorder }) => {
    if (!selectedItem || !type) return null;

    // Calculate generic properties based on type
    let x = 0, y = 0, width = 0, height = 0, rotation = 0;
    let area = 0;
    let perimeter = 0;

    if (type === 'FURNITURE') {
        const f = selectedItem as FurnitureItem;
        x = f.x;
        y = f.y;
        width = f.width;
        height = f.height;
        rotation = f.rotation;
        if (f.type === 'CUSTOM' && f.vertices) {
            area = calculatePolygonArea(f.vertices);
            const bounds = getPolygonBounds(f.vertices);
            x = bounds.center.x;
            y = bounds.center.y;
            width = bounds.width;
            height = bounds.height;
            perimeter = calculatePolygonPerimeter(f.vertices);
        } else {
            area = width * height;
            perimeter = 2 * (width + height);
        }
    } else if (type === 'WALL_ITEM') {
        const w = selectedItem as WallItem;
        x = w.x;
        y = w.y;
        width = w.width;
        height = w.height;
        rotation = w.rotation;
    } else if (type === 'TEXT') {
        const t = selectedItem as TextItem;
        x = t.x;
        y = t.y;
        rotation = t.rotation;
    } else if (type === 'DRAWING') {
        // Drawing props handled differently
    } else {
        const s = selectedItem as (RoomShape | ZoneShape);
        const bounds = getPolygonBounds(s.vertices);
        x = bounds.center.x;
        y = bounds.center.y;
        width = bounds.width;
        height = bounds.height;
        area = calculatePolygonArea(s.vertices);
        perimeter = calculatePolygonPerimeter(s.vertices);
        if (type === 'ROOM') {
            rotation = (s as RoomShape).rotation || 0;
        }
        if (type === 'ZONE') {
            rotation = (s as ZoneShape).rotation || 0;
        }
    }

    const areaSqm = (area / 10000).toFixed(2);
    const perimeterM = (perimeter / 100).toFixed(2);

    return (
        <div className="fixed right-6 top-6 bottom-6 w-64 bg-white border-2 border-black shadow-[var(--shadow-hard)] rounded-xl p-4 flex flex-col gap-4 overflow-y-auto pointer-events-auto z-50">
            <div className="pb-3 border-b-2 border-black">
                <h2 className="font-bold text-sm bg-neo-yellow inline-block px-1 border border-black rounded">PROPERTIES</h2>
                <div className="text-[10px] text-gray-500 font-mono mt-1">{type} // {selectedItem.id.slice(0, 4)}</div>
            </div>

            {type === 'TEXT' && (
                <InputGroup label="Content">
                    <textarea
                        value={(selectedItem as TextItem).text}
                        onChange={(e) => onUpdate('text', e.target.value)}
                        className="w-full bg-gray-50 border border-black rounded px-2 py-1 text-xs font-bold focus:bg-neo-yellow outline-none mb-2 min-h-[60px]"
                    />
                    <NumberInput label="Size" value={(selectedItem as TextItem).fontSize} field="fontSize" onUpdate={onUpdate} />
                </InputGroup>
            )}

            {type === 'DRAWING' && (
                <InputGroup label="Stroke">
                    <NumberInput label="Px" value={(selectedItem as FreehandPath).strokeWidth} field="strokeWidth" onUpdate={onUpdate} />
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs">Color</span>
                        <input
                            type="color"
                            value={(selectedItem as FreehandPath).strokeColor}
                            onChange={(e) => onUpdate('strokeColor', e.target.value)}
                            className="w-6 h-6 p-0 border border-black rounded cursor-pointer"
                        />
                    </div>
                </InputGroup>
            )}

            {/* BASIC INFO */}
            {(type === 'ROOM' || type === 'ZONE' || type === 'FURNITURE') && (
                <InputGroup label="Identity">
                    <input
                        type="text"
                        value={(selectedItem as any).label || (selectedItem as any).type}
                        onChange={(e) => onUpdate('label', e.target.value)}
                        className="w-full bg-gray-50 border border-black rounded px-2 py-1 text-xs font-bold focus:bg-neo-yellow outline-none mb-2"
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-gray-400">ID</span>
                        <span className="text-[10px] font-mono">{selectedItem.id.slice(0, 8)}...</span>
                    </div>
                </InputGroup>
            )}

            {/* DIMENSIONS */}
            {type !== 'DRAWING' && (
                <InputGroup label="Dimensions">
                    <div className="grid grid-cols-2 gap-2">
                        {type !== 'TEXT' && type !== 'WALL_ITEM' && <NumberInput label="W" value={width} field="width" onUpdate={onUpdate} />}
                        {type !== 'TEXT' && type !== 'WALL_ITEM' && <NumberInput label="H" value={height} field="height" onUpdate={onUpdate} />}
                        <NumberInput label="X" value={x} field="x" onUpdate={onUpdate} />
                        <NumberInput label="Y" value={y} field="y" onUpdate={onUpdate} />
                    </div>
                </InputGroup>
            )}

            {/* TRANSFORMS */}
            {type !== 'DRAWING' && (
                <InputGroup label="Transform">
                    <NumberInput label="R" value={rotation} field="rotation" onUpdate={onUpdate} />
                    <div className="text-[9px] text-gray-400 mt-1">Rotation (deg)</div>
                </InputGroup>
            )}

            {/* WALL ITEMS */}
            {type === 'WALL_ITEM' && (selectedItem as WallItem).type === 'DOOR' && (
                <InputGroup label="Door Settings">
                    <div className="flex justify-between">
                        <button
                            onClick={() => onUpdate('flipX', !(selectedItem as WallItem).flipX)}
                            className={`flex flex-col items-center p-2 border rounded ${!(selectedItem as WallItem).flipX ? 'bg-white border-gray-300' : 'bg-neo-blue border-black'}`}
                            title="Hinge Side"
                        >
                            <FlipHorizontal size={16} />
                            <span className="text-[9px] mt-1">Hinge</span>
                        </button>
                        <button
                            onClick={() => onUpdate('flipY', !(selectedItem as WallItem).flipY)}
                            className={`flex flex-col items-center p-2 border rounded ${!(selectedItem as WallItem).flipY ? 'bg-white border-gray-300' : 'bg-neo-blue border-black'}`}
                            title="Swing Direction"
                        >
                            <FlipVertical size={16} />
                            <span className="text-[9px] mt-1">Swing</span>
                        </button>
                    </div>
                </InputGroup>
            )}

            {/* APPEARANCE */}
            <InputGroup label="Appearance">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs">Z-Index</span>
                    <input
                        type="number"
                        value={(selectedItem.zIndex || 1)}
                        onChange={(e) => onUpdate('zIndex', parseInt(e.target.value))}
                        className="w-16 bg-gray-50 border border-black rounded px-2 py-1 text-xs font-mono focus:bg-neo-yellow outline-none"
                    />
                </div>
                {(type === 'ZONE' || type === 'FURNITURE' || type === 'ROOM' || type === 'TEXT' || type === 'WALL_ITEM') && (
                    <>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs">Color</span>
                            <div className="flex gap-1">
                                <input
                                    type="color"
                                    value={(selectedItem as any).color || '#ffffff'}
                                    onChange={(e) => onUpdate('color', e.target.value)}
                                    className="w-6 h-6 p-0 border border-black rounded cursor-pointer"
                                />
                            </div>
                        </div>
                        {(type === 'ROOM' || type === 'ZONE') && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs">Opacity</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={(selectedItem as any).opacity !== undefined ? (selectedItem as any).opacity : (type === 'ZONE' ? 0.4 : 0.9)}
                                    onChange={(e) => onUpdate('opacity', parseFloat(e.target.value))}
                                    className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                                />
                            </div>
                        )}
                    </>
                )}
            </InputGroup>

            {/* METRICS */}
            {(type === 'ROOM' || type === 'FURNITURE') && (
                <div className="mt-auto bg-gray-100 p-2 rounded border border-gray-300 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">AREA</span>
                        <span className="text-sm font-mono font-bold">{areaSqm} m²</span>
                    </div>
                    {type === 'ROOM' && (
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">PERIMETER</span>
                            <span className="text-sm font-mono font-bold">{perimeterM} m</span>
                        </div>
                    )}
                </div>
            )}
            {/* ACTIONS */}
            <InputGroup label="Arrange">
                <div className="flex gap-1 justify-between">
                    <button onClick={() => onReorder(selectedItem.id, 'BACK')} className="flex-1 flex flex-col items-center p-1 border border-gray-200 rounded hover:bg-gray-100" title="Send to Back">
                        <ChevronsDown size={14} />
                        <span className="text-[8px] mt-0.5">Back</span>
                    </button>
                    <button onClick={() => onReorder(selectedItem.id, 'BACKWARD')} className="flex-1 flex flex-col items-center p-1 border border-gray-200 rounded hover:bg-gray-100" title="Send Backward">
                        <ArrowDown size={14} />
                        <span className="text-[8px] mt-0.5">Down</span>
                    </button>
                    <button onClick={() => onReorder(selectedItem.id, 'FORWARD')} className="flex-1 flex flex-col items-center p-1 border border-gray-200 rounded hover:bg-gray-100" title="Bring Forward">
                        <ArrowUp size={14} />
                        <span className="text-[8px] mt-0.5">Up</span>
                    </button>
                    <button onClick={() => onReorder(selectedItem.id, 'FRONT')} className="flex-1 flex flex-col items-center p-1 border border-gray-200 rounded hover:bg-gray-100" title="Bring to Front">
                        <ChevronsUp size={14} />
                        <span className="text-[8px] mt-0.5">Front</span>
                    </button>
                </div>
            </InputGroup>

            <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                    onClick={onDelete}
                    className="w-full bg-red-50 text-red-600 border border-red-200 rounded px-2 py-1 text-xs font-bold hover:bg-red-100 transition-colors"
                >
                    DELETE OBJECT
                </button>
            </div>
        </div>
    );
};