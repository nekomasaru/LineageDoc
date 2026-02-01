'use client';

import React from 'react';

interface LogoProps {
    size?: number;
    className?: string;
    showText?: boolean;
}

/**
 * LineaDoc Logo Component
 * Uses the original PNG for perfect design accuracy.
 */
export const Logo: React.FC<LogoProps> = ({ size = 24, className = '', showText = false }) => {
    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            <div
                className="relative flex items-center justify-center shrink-0"
                style={{ width: size, height: size }}
            >
                <img
                    src="/logo.png"
                    alt="LineaDoc Logo"
                    className="max-w-full max-h-full object-contain"
                />
            </div>
            {showText && (
                <span className="font-bold text-slate-900 tracking-tight">LineaDoc</span>
            )}
        </div>
    );
};
