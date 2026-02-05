/**
 * aiPromptTemplates.ts
 * 
 * LineaDoc AIアシスタント用のプロンプトテンプレート集。
 * Gemini 2.5 Flash を前提に、構造化された指示を提供します。
 */

export type AIActionType =
    // 編集系 (Editing)
    | 'summarize' | 'continue' | 'improve' | 'shorter' | 'longer' | 'tone' | 'plain' | 'explain' | 'fix_grammar'
    // 公務・生成系 (Gov Tasks / Generation)
    | 'official_polish' | 'notice_draft' | 'outline_draft' | 'agenda_draft' | 'qa_draft'
    // 分析系 (Analysis)
    | 'todo_extract' | 'points_extract' | 'consistency_check'
    // 共通・互換用 (Legacy / Helper)
    | 'format' | 'plainJapanese' | 'qa' | 'generate' | 'polish';

export interface PromptContext {
    documentTitle?: string;
    selectedText?: string;
    fullContent?: string;
    actionOptions?: Record<string, any>;
}

export const SYSTEM_BASE = `あなたは LineaDoc の AI アシスタントです。
日本の公文書やビジネス文書の作成・整理を支援する専門家として振る舞ってください。
すべての出力は Markdown 形式で行い、論理的で明快な日本語を使用してください。`;

/**
 * 4層階層プロンプト（Golden Prompt）の構築
 * [Layer 1: Governance] > [Layer 2: Project/RAG] > [Layer 3: User Intent] > [Layer 4: External]
 */
export const buildGoldenPrompt = (ctx: PromptContext, coreTask: string, constraints: string = '') => `
# Role & Global Rules
${SYSTEM_BASE}

# Layer 1: Governance & Compliance (最優先・絶対遵守)
- 断定的な表現を避け、客観的な事実に基づく記述を心がけること。
- 性別、年齢、国籍等に関する差別的表現は一切禁止。
- 自治体の公用文作成要領（「こと/事」「様/殿」の使い分け等）を遵守すること。

# Layer 2: Project Knowledge & Facts (事実の根拠)
- ドキュメントタイトル: ${ctx.documentTitle || '名称未設定'}
- コンテンツ文脈: ${ctx.fullContent?.slice(0, 500) || 'なし'}
- [RAG/他ドキュメントの知見がここに入ります]
※内部的な事実や数値が外部情報と矛盾する場合、常にこちらの内部情報を正としてください。

# Layer 3: Context & User Intent (現在の対話)
${coreTask}

# Layer 4: External Knowledge (補助・出典明記)
- [Google 検索（Grounding）結果がここに入ります]
- 内部情報に存在しない一般的な事実のみを補完してください。
- ネット情報を使用する場合は必ず「[出典: URL]」を付与してください。

# Output Constraints
${constraints || '- 改善後の Markdown テキストのみを出力してください。\n- 差分（Diff）が明確になる構造を維持してください。'}
- Layer 2 の事実と矛盾する情報を絶対に採用しないでください。
`;

export const PROMPT_TEMPLATES: Record<AIActionType, (ctx: PromptContext) => string> = {
    // --- 編集系 (Editing) ---
    format: (ctx) => buildGoldenPrompt(ctx, `
## タスク
以下の「平文（テキスト）」を、構造化された「Markdown形式」に変換してください。

## 対象テキスト
---
${ctx.selectedText || ctx.fullContent}
---
`, `
- 内容を分析し、適切な見出し（# ## ###）を付けてください。
- データの羅列は積極的に「Markdownテーブル」に変換してください。
`),

    summarize: (ctx) => buildGoldenPrompt(ctx, `
## タスク
以下の Markdown テキストを要約してください。

## 対象テキスト
---
${ctx.selectedText || ctx.fullContent}
---
`, `
- 箇条書き（3〜5点）でまとめてください。
- 重要な用語は強調（**太字**）してください。
`),

    polish: (ctx) => {
        const tone = ctx.actionOptions?.tone || 'formal';
        const toneDesc = tone === 'formal' ? '公用文・ビジネスフォーマル（敬体）' :
            tone === 'concise' ? '簡潔・簡明（無駄を削ぎ落とす）' :
                '詳細・丁寧（補足を追加）';

        return buildGoldenPrompt(ctx, `
## タスク
以下の Markdown テキストを「${toneDesc}」の方針で磨き上げてください。

## 対象テキスト
---
${ctx.selectedText}
---
`);
    },

    improve: (ctx) => buildGoldenPrompt(ctx, `
## タスク
以下の文章の品質を全面的に向上させてください。
語彙を豊かにし、論理構成を整えてください。

## 対象テキスト
---
${ctx.selectedText}
---
`),

    continue: (ctx) => buildGoldenPrompt(ctx, `
## タスク
以下の Markdown テキストの続きを生成してください。

## 対象テキスト
---
${ctx.selectedText}
---
`, `
- 前文のトーン（敬体・常体）に合わせてください。
- すでにある構造（見出し、リスト）を継続してください。
`),

    shorter: (ctx) => buildGoldenPrompt(ctx, `
## タスク
以下の文章を大幅に短縮してください。要点のみに絞り、冗長な表現を徹底的に排除してください。

## 対象テキスト
---
${ctx.selectedText}
---
`),

    longer: (ctx) => buildGoldenPrompt(ctx, `
## タスク
以下の文章を、背景や補足情報を追加して拡張してください。

## 対象テキスト
---
${ctx.selectedText}
---
`),

    tone: (ctx) => {
        const tone = ctx.actionOptions?.tone || 'professional';
        const toneMap: Record<string, string> = {
            professional: '堅実でプロフェッショナルなビジネス文体',
            casual: '親しみやすく、くだけたカジュアルな文体',
            straightforward: '回りくどくない、直接的で力強い表現',
            confident: '自信に満ちた、断定的で信頼感のある文体',
            friendly: '温かみがあり、距離感の近いフレンドリーな文体'
        };
        return buildGoldenPrompt(ctx, `
## タスク
以下の文章のトーンを「${toneMap[tone] || toneMap.professional}」に変更してください。

## 対象テキスト
---
${ctx.selectedText}
---
`);
    },

    plain: (ctx) => buildGoldenPrompt(ctx, `
## タスク
以下のテキストを、専門知識のない人にも分かりやすい「シンプルな言葉（やさしい日本語）」に言い換えてください。

## 対象テキスト
---
${ctx.selectedText}
---
`),

    explain: (ctx) => buildGoldenPrompt(ctx, `
## タスク
以下の選択範囲の内容について、背景や関連用語を含めて解説してください。

## 対象テキスト
---
${ctx.selectedText}
---
`),

    fix_grammar: (ctx) => buildGoldenPrompt(ctx, `
## タスク
以下の文章の誤字脱字、文法的な誤り、表記揺れを修正してください。

## 対象テキスト
---
${ctx.selectedText}
---
`),

    // --- 公務・生成系 (Gov Tasks / Generation) ---
    official_polish: (ctx) => buildGoldenPrompt(ctx, `
## タスク
以下の文章を、日本の「公用文ルール」および「行政事務」に完全に準拠した形式に磨き上げてください。
「貴職」「供覧」「左記のとおり」などの適切な語彙を使用してください。

## 対象テキスト
---
${ctx.selectedText}
---
`),

    notice_draft: (ctx) => buildGoldenPrompt(ctx, `
## タスク
行政機関が送付する「通知文・案内文」のドラフトを生成してください。
日付、宛先、発信者、件名、記書き等の標準的な公文書フォーマットを守ってください。

## 指示
${ctx.actionOptions?.instruction || '住民または他機関への通知'}
`, `
- Markdown 形式で出力。
`),

    outline_draft: (ctx) => buildGoldenPrompt(ctx, `
## タスク
ドキュメントの「構成案（アウトライン）」を作成してください。
背景、目的、現状、課題、実施内容、期待される効果を網羅してください。

## 指示
${ctx.actionOptions?.instruction || '新規施策またはプロジェクトの立案'}
`),

    agenda_draft: (ctx) => buildGoldenPrompt(ctx, `
## タスク
会議の「次第・アジェンダ」を作成してください。

## 指示
${ctx.actionOptions?.instruction || '定例会議または検討会'}
`),

    qa_draft: (ctx) => buildGoldenPrompt(ctx, `
## タスク
以下の資料に基づき、想定される「質問（Q）」と「回答（A）」のペアを作成してください。

## 対象テキスト
---
${ctx.selectedText || ctx.fullContent}
---
`),

    // --- 分析系 (Analysis) ---
    todo_extract: (ctx) => buildGoldenPrompt(ctx, `
## タスク
以下のテキストから、今後対応すべき「アクションアイテム（ToDo）」を抽出してください。

## 対象テキスト
---
${ctx.selectedText || ctx.fullContent}
---
`),

    points_extract: (ctx) => buildGoldenPrompt(ctx, `
## タスク
以下のテキストから「重要な論点」や「キーポイント」を抽出してください。

## 対象テキスト
---
${ctx.selectedText || ctx.fullContent}
---
`),

    consistency_check: (ctx) => buildGoldenPrompt(ctx, `
## タスク
以下の文章全体を確認し、論理的な矛盾、用語の不一致、または前後の主張の齟齬がないかチェックしてください。
問題点がある場合は、その箇所と修正案を提示してください。

## 対象テキスト
---
${ctx.fullContent}
---
`),

    // --- 互換用 (Legacy) ---
    plainJapanese: (ctx) => PROMPT_TEMPLATES.plain(ctx),
    qa: (ctx) => PROMPT_TEMPLATES.qa_draft(ctx),
    generate: (ctx) => buildGoldenPrompt(ctx, `
## タスク
ユーザーの指示に従って、新しい Markdown コンテンツを生成してください。

## 指示
${ctx.actionOptions?.instruction || '新しい文書の作成'}
`)
};
