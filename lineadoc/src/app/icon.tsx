import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
    width: 32,
    height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                }}
            >
                <svg
                    width="32"
                    height="32"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* L shape */}
                    <path
                        d="M10 20 V 80 H 45 V 60 H 30 V 20 Z"
                        fill="#1e293b" // slate-800
                    />

                    {/* D shape */}
                    <path
                        d="M50 20 V 80 H 70 C 85 80 90 70 90 50 C 90 30 85 20 70 20 Z M 70 40 V 60 C 75 60 75 55 75 50 C 75 45 75 40 70 40 Z"
                        fill="#1e293b" // slate-800
                    />
                </svg>
            </div>
        ),
        {
            ...size,
        }
    );
}
