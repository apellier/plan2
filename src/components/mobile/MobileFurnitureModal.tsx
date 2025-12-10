'use client';

import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { FurnitureType } from '@/lib/types';
import { useStore } from '@/lib/store';
import { FURNITURE_PRESETS, FURNITURE_CATEGORIES } from '@/lib/constants';
import {
    BedDouble, Sofa, ChefHat, Bath, Briefcase, TreeDeciduous, UtensilsCrossed,
    PencilRuler, ChevronDown, ChevronRight
} from 'lucide-react';

interface MobileFurnitureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectItem: (type: FurnitureType, width: number, height: number) => void;
}

type CategoryKey = keyof typeof FURNITURE_CATEGORIES;

const CATEGORY_ICONS: Record<CategoryKey, React.ReactNode> = {
    BEDROOM: <BedDouble size={18} />,
    LIVING: <Sofa size={18} />,
    DINING: <UtensilsCrossed size={18} />,
    OFFICE: <Briefcase size={18} />,
    BATHROOM: <Bath size={18} />,
    KITCHEN: <ChefHat size={18} />,
    OUTDOOR: <TreeDeciduous size={18} />,
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

/**
 * Full-screen modal for furniture selection on mobile devices.
 */
export const MobileFurnitureModal: React.FC<MobileFurnitureModalProps> = ({
    isOpen,
    onClose,
    onSelectItem,
}) => {
    const isPlacingCustomFurniture = useStore(state => state.isPlacingCustomFurniture);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<CategoryKey>>(
        new Set(['BEDROOM', 'LIVING'])
    );

    if (!isOpen) return null;

    const toggleCategory = (category: CategoryKey) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };

    const filteredCategories = Object.entries(FURNITURE_BY_CATEGORY).map(([category, items]) => ({
        category: category as CategoryKey,
        items: items.filter(item =>
            item.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(({ items }) => items.length > 0);

    const handleSelect = (type: FurnitureType, width: number, height: number) => {
        onSelectItem(type, width, height);
        if (type !== 'CUSTOM') {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-black bg-neo-yellow">
                <h2 className="text-lg font-bold font-mono">FURNITURE</h2>
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                >
                    <X size={24} strokeWidth={2.5} />
                </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search furniture..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {filteredCategories.map(({ category, items }) => (
                    <div key={category} className="mb-2">
                        {/* Category Header */}
                        <button
                            onClick={() => toggleCategory(category)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            {expandedCategories.has(category) ? (
                                <ChevronDown size={16} />
                            ) : (
                                <ChevronRight size={16} />
                            )}
                            <span className="text-gray-600">{CATEGORY_ICONS[category]}</span>
                            <span className="text-sm font-semibold flex-1 text-left">
                                {FURNITURE_CATEGORIES[category]}
                            </span>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                {items.length}
                            </span>
                        </button>

                        {/* Category Items */}
                        {expandedCategories.has(category) && (
                            <div className="grid grid-cols-2 gap-2 ml-4 mt-2">
                                {items.map((item) => (
                                    <button
                                        key={item.type}
                                        onClick={() => handleSelect(item.type, item.width, item.height)}
                                        className="flex flex-col items-start p-3 rounded-xl text-left bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-black transition-all active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    >
                                        <span className="text-sm font-medium">{item.label}</span>
                                        <span className="text-xs text-gray-400 font-mono">
                                            {item.width}×{item.height}cm
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* Custom Shape */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                        onClick={() => handleSelect('CUSTOM', 0, 0)}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all border-2 ${isPlacingCustomFurniture
                                ? 'bg-neo-yellow border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                : 'border-dashed border-gray-300 hover:bg-neo-yellow/20 hover:border-black'
                            }`}
                    >
                        <PencilRuler size={24} strokeWidth={isPlacingCustomFurniture ? 2.5 : 2} />
                        <div className="flex-1 text-left">
                            <span className={`text-sm font-medium ${isPlacingCustomFurniture ? 'font-bold' : ''}`}>
                                Custom Shape
                            </span>
                            <p className="text-xs text-gray-500">Draw your own furniture</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};
