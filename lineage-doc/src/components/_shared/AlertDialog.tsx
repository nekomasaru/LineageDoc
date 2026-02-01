import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export interface ActionButton {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'danger' | 'secondary' | 'outline' | 'ghost';
    icon?: React.ReactNode;
}

interface AlertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: React.ReactNode;
    actions: ActionButton[];
}

export function AlertDialog({ isOpen, onClose, title, description, actions }: AlertDialogProps) {
    if (!isOpen) return null;

    const getVariantClasses = (variant: ActionButton['variant'] = 'primary') => {
        switch (variant) {
            case 'primary':
                return 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm';
            case 'danger':
                return 'bg-red-600 text-white hover:bg-red-700 shadow-sm';
            case 'secondary':
                return 'bg-slate-100 text-slate-700 hover:bg-slate-200';
            case 'outline':
                return 'border border-slate-300 text-slate-700 hover:bg-slate-50';
            case 'ghost':
                return 'text-slate-500 hover:text-slate-700 hover:bg-slate-100';
            default:
                return 'bg-blue-600 text-white hover:bg-blue-700';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-full shrink-0">
                            <AlertCircle size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
                            <div className="text-slate-600 text-sm leading-relaxed">
                                {description}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row gap-3 sm:justify-end border-t border-slate-100">
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            onClick={action.onClick}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${getVariantClasses(action.variant)}`}
                        >
                            {action.icon && <span>{action.icon}</span>}
                            {action.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
