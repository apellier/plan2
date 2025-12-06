import React from 'react';
import { FurnitureType } from '@/lib/types';
import { Armchair, BedDouble, Sofa, LampFloor, PencilRuler } from 'lucide-react';

interface FurnitureLibraryProps {
    onSelectItem: (type: FurnitureType, width: number, height: number) => void;
}

const ITEMS: { type: FurnitureType; label: string; w: number; h: number; icon: React.ReactNode }[] = [
    { type: 'BED_QUEEN', label: 'Queen Bed', w: 160, h: 200, icon: <BedDouble size={24} /> },
    { type: 'SOFA_3SEATER', label: 'Sofa', w: 220, h: 90, icon: <Sofa size={24} /> },
    { type: 'TABLE_DINING', label: 'Dining Table', w: 180, h: 90, icon: <div className="w-6 h-3 border-2 border-black rounded-sm bg-neo-yellow"></div> },
    { type: 'CHAIR_OFFICE', label: 'Office Chair', w: 60, h: 60, icon: <div className="w-4 h-4 rounded-full border-2 border-black bg-neo-blue"></div> },
    { type: 'PLANT', label: 'Plant', w: 40, h: 40, icon: <LampFloor size={24} /> },
];

export const FurnitureLibrary: React.FC<FurnitureLibraryProps> = ({ onSelectItem }) => {
    return (
        <div className="fixed top-28 left-4 z-40 bg-white border-2 border-black shadow-[var(--shadow-hard)] rounded-lg p-3 flex flex-col gap-3 w-40">
            <h3 className="text-xs font-bold font-mono border-b border-gray-200 pb-2">FURNITURE</h3>
            <div className="flex flex-col gap-2">
                {ITEMS.map((item) => (
                    <button
                        key={item.type}
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer.setData('furniture-type', item.type);
                            e.dataTransfer.setData('furniture-width', item.w.toString());
                            e.dataTransfer.setData('furniture-height', item.h.toString());
                            e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={() => onSelectItem(item.type, item.w, item.h)}
                        className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 border border-transparent hover:border-black transition-all group cursor-grab active:cursor-grabbing"
                    >
                        <div className="text-gray-700 group-hover:text-black group-hover:scale-110 transition-transform">
                            {item.icon}
                        </div>
                        <span className="text-xs font-medium">{item.label}</span>
                    </button>
                ))}

                {/* Custom Shape Button */}
                <button
                    onMouseDown={() => onSelectItem('CUSTOM', 0, 0)}
                    className="flex items-center gap-3 p-2 rounded hover:bg-neo-yellow border border-transparent hover:border-black transition-all group"
                >
                    <div className="text-gray-700 group-hover:text-black group-hover:scale-110 transition-transform">
                        <PencilRuler size={24} />
                    </div>
                    <span className="text-xs font-medium">Free Shape</span>
                </button>
            </div>
            <div className="text-[10px] text-gray-400 mt-2 leading-tight">
                Drag items or click to place. Use Free Shape to draw.
            </div>
        </div>
    );
};