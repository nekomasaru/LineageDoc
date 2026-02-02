import { LineaEvent, LayoutNode, LayoutLink } from './types';

/**
 * リネージイベントからグラフ描画用のレイアウト情報を計算する
 * 
 * 安定版アルゴリズム (Chronological Root-to-Leaf):
 * 1. 作成順 (events配列の順) に親子関係（childrenMap）を構築。
 * 2. ルート（parentIdなし）から開始し、最初の子供を同じ列に、2番目以降の子供を新しい列に割り当てる。
 * 3. これにより、メインパス (v1-v2-v3...) が常に Column 0 に固定され、
 *    分岐が新しい列で成長しても既存のカラムがジャンプすることがなくなる。
 */
export function calculateGraphLayout(events: LineaEvent[]): { nodes: LayoutNode[], links: LayoutLink[], maxColumn: number } {
    if (events.length === 0) return { nodes: [], links: [], maxColumn: 0 };

    // 1. ノードを新しい順（降順）に並べる -> Y軸の表示順序（上ほど最新）
    const sortedEventsDesc = [...events].reverse();
    const nodeMap = new Map<string, LayoutNode>();

    sortedEventsDesc.forEach((event, index) => {
        nodeMap.set(event.id, {
            event,
            column: -1, // 未定
            yIndex: index
        });
    });

    // 2. カラムの割り当て
    // childrenMap: parentId -> [childId1, childId2, ...] ※chrono順
    const childrenMap = new Map<string, string[]>();
    events.forEach(e => {
        if (e.parentId) {
            const children = childrenMap.get(e.parentId) || [];
            children.push(e.id);
            childrenMap.set(e.parentId, children);
        }
    });

    const roots = events.filter(e => !e.parentId);
    let usedColumns = 0;

    /**
     * 再帰的にカラムを割り当てる関数
     */
    function assign(eventId: string, col: number) {
        const node = nodeMap.get(eventId);
        if (!node || node.column !== -1) return;

        node.column = col;
        const children = childrenMap.get(eventId) || [];

        // 最初の子供がいれば同じ列で延長（これをメインラインとみなす）
        if (children.length > 0) {
            assign(children[0], col);
        }

        // 2本目以降の枝は新しい列を消費して開始
        for (let i = 1; i < children.length; i++) {
            usedColumns++;
            assign(children[i], usedColumns);
        }
    }

    // 各ルート（通常は1つだが念のため）から割り当て開始
    roots.forEach(root => {
        if (nodeMap.get(root.id)?.column === -1) {
            assign(root.id, usedColumns);
            // 次のルートがあれば新しい列を開始
            if (roots.length > 1) usedColumns++;
        }
    });

    // 3. リンク（エッジ）の生成
    const links: LayoutLink[] = [];
    const layoutNodes = Array.from(nodeMap.values());

    layoutNodes.forEach(node => {
        if (node.event.parentId) {
            const parentNode = nodeMap.get(node.event.parentId);
            if (parentNode) {
                links.push({
                    sourceId: node.event.id,
                    targetId: parentNode.event.id,
                    sourceColumn: node.column,
                    targetColumn: parentNode.column,
                    sourceY: node.yIndex,
                    targetY: parentNode.yIndex
                });
            }
        }
    });

    return {
        nodes: layoutNodes.sort((a, b) => a.yIndex - b.yIndex),
        links,
        maxColumn: usedColumns
    };
}
