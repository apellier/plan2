'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'normal';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'normal'
}) => {
    // Handle keyboard
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
            if (e.key === 'Enter') onConfirm();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onConfirm, onCancel]);

    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: <Trash2 className="w-6 h-6 text-red-600" />,
            iconBg: 'bg-red-100',
            button: 'bg-red-500 hover:bg-red-600 text-white'
        },
        warning: {
            icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
            iconBg: 'bg-amber-100',
            button: 'bg-amber-500 hover:bg-amber-600 text-white'
        },
        normal: {
            icon: <AlertTriangle className="w-6 h-6 text-blue-600" />,
            iconBg: 'bg-blue-100',
            button: 'bg-blue-500 hover:bg-blue-600 text-white'
        }
    };

    const styles = variantStyles[variant];

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
            onClick={onCancel}
        >
            <div
                className="bg-white border-2 border-black shadow-[var(--shadow-hard)] rounded-xl p-6 max-w-sm w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${styles.iconBg}`}>
                        {styles.icon}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{title}</h3>
                        <p className="text-sm text-gray-600">{message}</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex gap-3 mt-6 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-medium border-2 border-black rounded-lg transition-colors ${styles.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
