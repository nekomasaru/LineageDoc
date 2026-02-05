'use client';

import React from 'react';

interface AIAssistantIconProps {
    size?: number;
    className?: string;
    animated?: boolean;
}

export const AIAssistantIcon: React.FC<AIAssistantIconProps> = ({
    size = 24,
    className = '',
    animated = false
}) => {
    return (
        <div
            className={`relative flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
        >
            <svg
                viewBox="0 0 100 100"
                className={`w-full h-full ${animated ? 'animate-assistant-pulse' : ''}`}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="ai-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0891b2" /> {/* Teal-600 */}
                        <stop offset="100%" stopColor="#9333ea" /> {/* Purple-600 */}
                    </linearGradient>

                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Outer Orbit 1 */}
                <ellipse
                    cx="50"
                    cy="50"
                    rx="45"
                    ry="18"
                    stroke="url(#ai-gradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className={animated ? 'animate-assistant-orbit-1' : ''}
                    style={{ transformOrigin: '50% 50%', transform: 'rotate(45deg)' }}
                />

                {/* Outer Orbit 2 */}
                <ellipse
                    cx="50"
                    cy="50"
                    rx="45"
                    ry="18"
                    stroke="url(#ai-gradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className={animated ? 'animate-assistant-orbit-2' : ''}
                    style={{ transformOrigin: '50% 50%', transform: 'rotate(-45deg)' }}
                />

                {/* Outer Orbit 3 (Vertical-ish) */}
                <ellipse
                    cx="50"
                    cy="50"
                    rx="45"
                    ry="18"
                    stroke="url(#ai-gradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className={animated ? 'animate-assistant-orbit-3' : ''}
                    style={{ transformOrigin: '50% 50%', transform: 'rotate(90deg)' }}
                />

                {/* Central Core */}
                <circle
                    cx="50"
                    cy="50"
                    r="12"
                    fill="url(#ai-gradient)"
                    filter="url(#glow)"
                />
            </svg>
        </div>
    );
};
