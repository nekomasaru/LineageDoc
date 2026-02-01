'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle, useCallback, ElementType, HTMLAttributes } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
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
        const components = createComponentsWithLineNumbers();

        const scrollToLine = useCallback((line: number) => {
            if (!containerRef.current) return;
            isScrollingFromExternalRef.current = true;

            const targetElement = containerRef.current.querySelector(
                `[data-line="${line}"]`
            );

            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'instant', block: 'start' });
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
            // これにより、エディタでの打鍵によるプレビューレイアウト変化時のジャンプを防止
            if (!isHoveredRef.current) return;

            if (!containerRef.current || !onVisibleLineChange) return;

            const container = containerRef.current;
            const scrollTop = container.scrollTop;

            // 表示中の最初の要素を探す
            const elements = container.querySelectorAll('[data-line]');
            let closestElement: Element | null = null;
            let closestDistance = Infinity;

            elements.forEach((el) => {
                const rect = el.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
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
            <div
                ref={containerRef}
                className="h-full overflow-y-auto bg-white"
                onScroll={handleScroll}
                onMouseEnter={() => { isHoveredRef.current = true; }}
                onMouseLeave={() => { isHoveredRef.current = false; }}
            >
                <div
                    className="mx-auto bg-white shadow-lg"
                    style={{
                        width: '210mm',
                        minHeight: '297mm',
                        padding: '20mm',
                        fontFamily: '"Noto Sans JP", sans-serif',
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
        );
    }
);
