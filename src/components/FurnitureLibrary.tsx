'use client';

import React, { useState } from 'react';
import { FurnitureType } from '@/lib/types';
import { useStore } from '@/lib/store';
import { FURNITURE_PRESETS, FURNITURE_CATEGORIES } from '@/lib/constants';
import {
    BedDouble, Sofa, ChefHat, Bath, Briefcase, TreeDeciduous, UtensilsCrossed,
    PencilRuler, ChevronDown, ChevronRight
} from 'lucide-react';

interface FurnitureLibraryProps {
    onSelectItem: (type: FurnitureType, width: number, height: number) => void;
}

type CategoryKey = keyof typeof FURNITURE_CATEGORIES;

const CATEGORY_ICONS: Record<CategoryKey, React.ReactNode> = {
    BEDROOM: <BedDouble size={14} />,
    LIVING: <Sofa size={14} />,
    DINING: <UtensilsCrossed size={14} />,
    OFFICE: <Briefcase size={14} />,
    BATHROOM: <Bath size={14} />,
    KITCHEN: <ChefHat size={14} />,
    OUTDOOR: <TreeDeciduous size={14} />,
};

// Group furniture by category
const FURNITURE_BY_CATEGORY = Object.entries(FURNITURE_PRESETS).reduce((acc, [key, value]) => {
    const category = value.category as CategoryKey;
    if (!acc[category]) acc[category] = [];
    acc[category].push({
        type: key as FurnitureType,
        label: value.label,
        width: value.width,
        height: value.height,
    });
    return acc;
}, {} as Record<CategoryKey, { type: FurnitureType; label: string; width: number; height: number }[]>);

export const FurnitureLibrary: React.FC<FurnitureLibraryProps> = ({ onSelectItem }) => {
    const isPlacingCustomFurniture = useStore(state => state.isPlacingCustomFurniture);
    const [expandedCategories, setExpandedCategories] = useState<Set<CategoryKey>>(
        new Set(['BEDROOM', 'LIVING'])
    );
    const [searchTerm, setSearchTerm] = useState('');

    const toggleCategory = (category: CategoryKey) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };

    // Filter furniture by search term
    const filteredCategories = Object.entries(FURNITURE_BY_CATEGORY).map(([category, items]) => ({
        category: category as CategoryKey,
        items: items.filter(item =>
            item.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(({ items }) => items.length > 0);

    return (
        <div className="fixed top-20 left-4 z-40 bg-white border-2 border-black shadow-[var(--shadow-hard)] rounded-lg w-56 max-h-[calc(100vh-120px)] flex flex-col">
            {/* Header */}
            <div className="p-3 border-b-2 border-gray-200">
                <h3 className="text-xs font-bold font-mono mb-2">FURNITURE</h3>
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-2 py-1 text-xs border-2 border-gray-200 rounded focus:border-black focus:outline-none"
                />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-2">
                {filteredCategories.map(({ category, items }) => (
                    <div key={category} className="mb-1">
                        {/* Category Header */}
                        <button
                            onClick={() => toggleCategory(category)}
                            className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-100 transition-colors"
                        >
                            {expandedCategories.has(category) ? (
                                <ChevronDown size={12} />
                            ) : (
                                <ChevronRight size={12} />
                            )}
                            <span className="text-gray-600">{CATEGORY_ICONS[category]}</span>
                            <span className="text-xs font-semibold flex-1 text-left">
                                {FURNITURE_CATEGORIES[category]}
                            </span>
                            <span className="text-[10px] text-gray-400">{items.length}</span>
                        </button>

                        {/* Category Items */}
                        {expandedCategories.has(category) && (
                            <div className="ml-4 space-y-0.5">
                                {items.map((item) => (
                                    <button
                                        key={item.type}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('furniture-type', item.type);
                                            e.dataTransfer.setData('furniture-width', item.width.toString());
                                            e.dataTransfer.setData('furniture-height', item.height.toString());
                                            e.dataTransfer.effectAllowed = 'copy';
                                        }}
                                        onClick={() => onSelectItem(item.type, item.width, item.height)}
                                        className="w-full flex items-center justify-between p-1.5 rounded text-left hover:bg-gray-100 border border-transparent hover:border-gray-300 transition-all cursor-grab active:cursor-grabbing"
                                    >
                                        <span className="text-[11px]">{item.label}</span>
                                        <span className="text-[9px] text-gray-400 font-mono">
                                            {item.width}×{item.height}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* Custom Shape */}
                <div className="mt-2 pt-2 border-t border-gray-200">
                    <button
                        onClick={() => onSelectItem('CUSTOM', 0, 0)}
                        className={`w-full flex items-center gap-2 p-2 rounded transition-all border-2 ${isPlacingCustomFurniture
                                ? 'bg-neo-yellow border-black shadow-[var(--shadow-hard-sm)]'
                                : 'border-dashed border-gray-300 hover:bg-neo-yellow/20 hover:border-black'
                            }`}
                    >
                        <PencilRuler size={16} strokeWidth={isPlacingCustomFurniture ? 2.5 : 2} />
                        <span className={`text-xs font-medium ${isPlacingCustomFurniture ? 'font-bold' : ''}`}>Custom Shape</span>
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-gray-200">
                <p className="text-[9px] text-gray-400 leading-tight text-center">
                    Drag to canvas or click to place at center
                </p>
            </div>
        </div>
    );
};
