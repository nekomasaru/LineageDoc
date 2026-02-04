/**
 * NetworkGraph.tsx
 * 
 * ドキュメント・タグ・プロジェクトの相関をグラフで可視化するコンポーネント
 * GraphRAG スタイルのビジュアライゼーション
 */

'use client';

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useProjectStore } from '@/stores/projectStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useAppStore } from '@/stores/appStore';
import { useEditorStore } from '@/stores/editorStore';
import { buildGraphData, GraphNode, GraphLink } from '@/lib/graph-utils';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

// react-force-graph-2d はクライアントサイドのみで動作
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full text-slate-400">
            グラフを読み込み中...
        </div>
    ),
});

export function NetworkGraph() {
    const documents = useDocumentStore(state => state.documents);
    const { setFilterProjectId, setFilterTag, setSearchQuery } = useDocumentStore();
    const { setCurrentDocument } = useAppStore();
    const { loadDocument } = useEditorStore();
    const { projects } = useProjectStore();

    const graphRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

    // グラフデータを生成
    const graphData = useMemo(() => {
        return buildGraphData(documents);
    }, [documents]);

    // コンテナサイズを監視
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // ノードクリック時のハンドラ
    const handleNodeClick = useCallback((node: any, event: any) => {
        if (node.type === 'document') {
            // ドキュメントを開く
            const docId = node.id.replace('doc-', '');
            const doc = documents.find(d => d.id === docId);
            if (doc) {
                setCurrentDocument(doc.id, doc.title);
                loadDocument(doc.rawContent);
            }
        } else if (node.type === 'project') {
            // プロジェクトでフィルタ
            const projectName = node.label;
            // 名前からプロジェクトIDを探す (一致しなければ無視)
            const project = projects.find(p => p.name === projectName);
            if (project) {
                setFilterProjectId(project.id);
                setFilterTag(null);
                setSearchQuery('');
            }
        } else if (node.type === 'tag') {
            // タグでフィルタ
            const tagName = node.label.replace('#', '');
            setFilterTag(tagName);
            setFilterProjectId(null);
            setSearchQuery('');
        }
    }, [documents, setCurrentDocument, loadDocument, setFilterProjectId, setFilterTag, setSearchQuery, projects]);

    // ノードのカスタム描画
    const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.label;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px sans-serif`;

        // ノードの円を描画
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size || 6, 0, 2 * Math.PI, false);
        ctx.fillStyle = node.color || '#0d9488';
        ctx.fill();

        // ラベルを描画
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#334155';
        ctx.fillText(label, node.x, node.y + (node.size || 6) + fontSize);
    }, []);

    // リンクの色
    const linkColor = useCallback((link: any) => {
        if (link.type === 'belongs_to_project') return 'rgba(99, 102, 241, 0.4)'; // indigo
        if (link.type === 'has_tag') return 'rgba(245, 158, 11, 0.4)'; // amber
        if (link.type === 'references') return 'rgba(239, 68, 68, 0.6)'; // red
        return 'rgba(148, 163, 184, 0.3)';
    }, []);

    // ズーム制御
    const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 300);
    const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 300);
    const handleFit = () => graphRef.current?.zoomToFit(400);

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* ヘッダー */}
            <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                <div>
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-gradient-to-b from-cyan-500 to-indigo-500 rounded-sm"></span>
                        ナレッジグラフ
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">Knowledge Network</p>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={handleZoomIn}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                        title="ズームイン"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleZoomOut}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                        title="ズームアウト"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleFit}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                        title="全体表示"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* 凡例 */}
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50 flex gap-4 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                    ドキュメント
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    プロジェクト
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    タグ
                </span>
            </div>

            {/* グラフ本体 */}
            <div ref={containerRef} className="flex-1 overflow-hidden">
                {graphData.nodes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
                        <p>ドキュメントがありません</p>
                        <p className="text-xs mt-1">新しいドキュメントを作成してください</p>
                    </div>
                ) : (
                    <ForceGraph2D
                        ref={graphRef}
                        graphData={graphData}
                        width={dimensions.width}
                        height={dimensions.height}
                        nodeCanvasObject={nodeCanvasObject}
                        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, (node.size || 6) + 4, 0, 2 * Math.PI, false);
                            ctx.fillStyle = color;
                            ctx.fill();
                        }}
                        linkColor={linkColor}
                        linkWidth={1.5}
                        linkDirectionalParticles={0}
                        onNodeClick={handleNodeClick}
                        cooldownTicks={100}
                        nodeRelSize={6}
                        backgroundColor="transparent"
                    />
                )}
            </div>

            {/* フッター: 統計 */}
            <div className="px-3 py-2 border-t border-slate-200 bg-white text-[10px] text-slate-400 flex gap-4">
                <span>{graphData.nodes.filter(n => n.type === 'document').length} ドキュメント</span>
                <span>{graphData.nodes.filter(n => n.type === 'project').length} プロジェクト</span>
                <span>{graphData.nodes.filter(n => n.type === 'tag').length} タグ</span>
                <span>{graphData.links.length} 接続</span>
            </div>
        </div>
    );
}
