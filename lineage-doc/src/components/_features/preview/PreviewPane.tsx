'use client';

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback, ElementType, HTMLAttributes } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { Components, ExtraProps } from 'react-markdown';

interface PreviewPaneProps {
    content: string;
    targetLine?: number;
    onVisibleLineChange?: (line: number) => void;
}

export interface PreviewPaneHandle {
    scrollToLine: (line: number) => void;
}

// 行番号を付与するカスタムコンポーネントを生成
function createComponentsWithLineNumbers(): Components {
    const wrapWithDataLine = <T extends ElementType>(Tag: T) => {
        return function WrappedComponent(
            props: HTMLAttributes<HTMLElement> & ExtraProps
        ) {
            const line = props.node?.position?.start?.line;
            return React.createElement(Tag, { ...props, 'data-line': line });
        };
    };

    return {
        p: wrapWithDataLine('p'),
        h1: wrapWithDataLine('h1'),
        h2: wrapWithDataLine('h2'),
        h3: wrapWithDataLine('h3'),
        h4: wrapWithDataLine('h4'),
        h5: wrapWithDataLine('h5'),
        h6: wrapWithDataLine('h6'),
        ul: wrapWithDataLine('ul'),
        ol: wrapWithDataLine('ol'),
        li: wrapWithDataLine('li'),
        blockquote: wrapWithDataLine('blockquote'),
        pre: wrapWithDataLine('pre'),
        table: wrapWithDataLine('table'),
    };
}

export const PreviewPane = forwardRef<PreviewPaneHandle, PreviewPaneProps>(
    function PreviewPane({ content, targetLine, onVisibleLineChange }, ref) {
        const containerRef = useRef<HTMLDivElement>(null);
        const isScrollingFromExternalRef = useRef(false);
        const isHoveredRef = useRef(false); // マウスがプレビュー上にあるか
        const [scale, setScale] = useState(1.0);
        const components = createComponentsWithLineNumbers();

        // ズーム制御
        const handleZoomIn = useCallback(() => setScale(s => Math.min(s + 0.1, 3.0)), []); // 上限も3.0に拡張
        const handleZoomOut = useCallback(() => setScale(s => Math.max(s - 0.1, 0.1)), []); // 下限を0.1に
        const handleResetZoom = useCallback(() => setScale(1.0), []);

        // Ctrl + Wheel でのズーム制御
        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            const handleWheel = (e: WheelEvent) => {
                // コンテナ上またはその内部でのホイール操作かつCtrlキー押下時
                if (e.ctrlKey) {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                        setScale(s => Math.min(s + 0.1, 3.0));
                    } else {
                        setScale(s => Math.max(s - 0.1, 0.1));
                    }
                }
            };

            // passive: false にして preventDefault を有効化
            container.addEventListener('wheel', handleWheel, { passive: false });

            return () => {
                container.removeEventListener('wheel', handleWheel);
            };
        }, []);

        const scrollToLine = useCallback((line: number) => {
            if (!containerRef.current) return;
            isScrollingFromExternalRef.current = true;

            const targetElement = containerRef.current.querySelector(
                `[data-line="${line}"]`
            ) as HTMLElement;

            if (targetElement) {
                // scrollIntoViewは水平スクロールも誘発するため、scrollTopのみ操作する方式に変更
                const container = containerRef.current;
                const elementRect = targetElement.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();

                // 要素を画面上部に表示するようにスクロール調整 (エディタの挙動に合わせる)
                // 上端から40pxの位置に表示
                const offset = (elementRect.top - containerRect.top) - 40;
                container.scrollTop += offset;

                // ハイライト演出
                targetElement.style.transition = 'none';
                targetElement.style.backgroundColor = 'rgba(37, 99, 235, 0.2)'; // Blue tint
                targetElement.style.outline = '2px solid rgba(37, 99, 235, 0.5)';
                targetElement.style.borderRadius = '2px';

                // フェードアウト
                setTimeout(() => {
                    targetElement.style.transition = 'all 0.5s ease-out';
                    targetElement.style.backgroundColor = 'transparent';
                    targetElement.style.outlineColor = 'transparent';
                }, 400);
            }

            // 少し遅延させてフラグをリセット
            setTimeout(() => {
                isScrollingFromExternalRef.current = false;
            }, 100);
        }, []);

        useImperativeHandle(ref, () => ({
            scrollToLine,
        }));

        useEffect(() => {
            if (targetLine !== undefined) {
                scrollToLine(targetLine);
            }
        }, [targetLine, scrollToLine]);

        // プレビュースクロール時にエディタへ通知
        const handleScroll = useCallback(() => {
            // 1. 外部からのスクロール中は通知しない
            if (isScrollingFromExternalRef.current) return;
            // 2. マウスがプレビュー上にない（ホバーしていない）場合は通知しない
            if (!isHoveredRef.current) return;

            if (!containerRef.current || !onVisibleLineChange) return;

            const container = containerRef.current;
            const elements = container.querySelectorAll('[data-line]');
            let closestElement: Element | null = null;
            let closestDistance = Infinity;

            // コンテナのトップ位置を取得
            const containerRect = container.getBoundingClientRect();

            elements.forEach((el) => {
                const rect = el.getBoundingClientRect();
                // コンテナ上端との距離（絶対値）
                const distance = Math.abs(rect.top - containerRect.top);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestElement = el;
                }
            });

            if (closestElement) {
                const line = parseInt((closestElement as HTMLElement).getAttribute('data-line') || '1', 10);
                onVisibleLineChange(line);
            }
        }, [onVisibleLineChange]);

        return (
            <div className="h-full relative group">
                {/* Zoom Controls (Hoverで表示) */}
                <div className="absolute top-4 right-8 flex flex-col gap-1 bg-white/90 p-1 rounded-lg shadow-md border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 print:hidden">
                    <button onClick={handleZoomIn} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="拡大">
                        <ZoomIn size={18} />
                    </button>
                    <button onClick={handleZoomOut} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="縮小">
                        <ZoomOut size={18} />
                    </button>
                    <button onClick={handleResetZoom} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="リセット (100%)">
                        <RotateCcw size={18} />
                    </button>
                    <div className="text-[10px] text-center font-medium text-slate-500 pt-1 border-t border-slate-100">
                        {Math.round(scale * 100)}%
                    </div>
                </div>

                <div
                    ref={containerRef}
                    className="h-full overflow-y-auto bg-slate-100 p-8"
                    onScroll={handleScroll}
                    onMouseEnter={() => { isHoveredRef.current = true; }}
                    onMouseLeave={() => { isHoveredRef.current = false; }}
                >
                    <div
                        className="mx-auto bg-white shadow-lg origin-top"
                        style={{
                            width: '210mm',
                            minHeight: '297mm',
                            padding: '20mm',
                            fontFamily: '"Noto Sans JP", sans-serif',
                            zoom: scale,
                        }}
                    >
                        <article className="prose prose-slate max-w-none leading-loose text-justify">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkBreaks]}
                                components={components}
                            >
                                {content}
                            </ReactMarkdown>
                        </article>
                    </div>
                </div>
            </div>
        );
    }
);
