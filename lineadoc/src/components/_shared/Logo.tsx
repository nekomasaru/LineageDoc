'use client';

import React from 'react';

interface LogoProps {
    size?: number;
    className?: string;
    showText?: boolean;
    useImage?: boolean;
}

/**
 * LineaDoc Logo Component
 * Supports both high-res Image and lightweight SVG.
 */
export const Logo: React.FC<LogoProps> = ({
    size = 24,
    className = '',
    showText = false,
    useImage = true // Default to premium image
}) => {
    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            <div
                className="relative flex items-center justify-center shrink-0"
                style={{ width: size, height: size }}
            >
                {useImage ? (
                    <img
                        src="/logo.png"
                        alt="LineaDoc Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                ) : (
                    <svg
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full text-cyan-600"
                    >
                        {/* L shape */}
                        <path
                            d="M10 20 V 80 H 45 V 60 H 30 V 20 Z"
                            fill="currentColor"
                        />

                        {/* D shape */}
                        <path
                            d="M50 20 V 80 H 70 C 85 80 90 70 90 50 C 90 30 85 20 70 20 Z M 70 40 V 60 C 75 60 75 55 75 50 C 75 45 75 40 70 40 Z"
                            fill="currentColor"
                        />
                    </svg>
                )}
            </div>
            {showText && (
                <span className="font-bold text-slate-800 tracking-tight">LineaDoc</span>
            )}
        </div>
    );
};
