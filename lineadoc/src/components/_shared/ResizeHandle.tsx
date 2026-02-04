/**
 * ResizeHandle.tsx
 * 
 * react-resizable-panels 用のカスタムハンドルコンポーネント
 * refs を正しく伝搬させるために forwardRef を使用
 */

'use client';

import { forwardRef } from 'react';
// API名の不整合回避: Separator を ResizeHandle として扱う
import { Separator, SeparatorProps } from 'react-resizable-panels';

interface ResizeHandleProps extends SeparatorProps {
    className?: string;
    id?: string;
    direction?: 'horizontal' | 'vertical'; // スタイル制御用
}

export const ResizeHandle = forwardRef<HTMLDivElement, ResizeHandleProps>(
    ({ className = '', id, direction = 'horizontal', ...props }, ref) => {
        return (
            <Separator
                id={id}
                elementRef={ref} // ref を elementRef に渡す (ライブラリ仕様)
                {...props}
                className={`
                    group relative flex items-center justify-center bg-slate-200 hover:bg-cyan-400
                    transition-colors duration-200 z-50
                    ${direction === 'horizontal'
                        ? 'w-2 h-full cursor-col-resize -ml-1 mr-[-4px]'
                        : 'h-2 w-full cursor-row-resize -mt-1 mb-[-4px]'
                    }
                    ${className}
                `}
            >
                {/* ハンドルの視覚的な線 */}
                <div className={`
                    bg-slate-300 group-hover:bg-cyan-100 transition-colors pointer-events-none
                    ${direction === 'horizontal' ? 'w-px h-6' : 'h-px w-6'}
                `} />
            </Separator>
        );
    }
);

ResizeHandle.displayName = 'ResizeHandle';
