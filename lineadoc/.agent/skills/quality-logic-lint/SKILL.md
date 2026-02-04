---
name: quality-logic-lint
description: 保存時またはボタン押下時にMarkdownに対してTextlint/mdschemaを実行する。
allowed-tools: [file_edit]
meta:
  domain: quality
  role: validation-logic
  tech_stack: textlint, api-routes
  phase: 2
  estimated_time: 50min
  dependencies: [quality-setup-vale]
---

# このスキルでやること

ユーザーがドキュメントを編集・保存する際、または手動でチェックボタンを押した際に、以下のバリデーションを実行し、結果を `qualityStore` に格納する。

1.- **MDSCHEMA**: テンプレートから継承された「見出し構造」のバリデーション。
- **Textlint**: 「ですます/だである」の混在や用語統一のバリデーション（API経由）、不適切な表現（公文書として不適切な言葉遣い）の自動検出。
- **Template Context**: `Document` メタデータに含まれる `mdSchema` DSLに基づいたリアルタイムチェック。

# 設計思想

## なぜサーバーサイドか (Option)

- Textlintはブラウザ(WebWorker)でも動作可能だが、重い処理やカスタムルールの管理をサーバー側に寄せるときはAPI Routeを使用する。
- **本スキルでは、ブラウザでの実行(WebWorker)を第一候補としつつ、構成管理の観点からAPI化も検討する。**

## 処理フロー

```
クライアント                        サーバー（API Route）
    │                                     │
    │  POST /api/lint                     │
    │  { content: "# 見出し..." }  ───→   │
    │                                     │
    │                               1. Textlint Engine初期化
    │                               2. lintText() 実行
    │                               3. 結果をJSON整形
    │                               4. 一時ファイル削除
    │                                     │
    │  ←───  { issues: [...] }            │
    │                                     │
```

# 作成するファイル

## `src/app/api/lint/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { TextLintEngine } from 'textlint';
import { TextlintResult } from '@textlint/types';

// ルール設定は .textlintrc を参照するか、動的に読み込む
// ※ 実際の実装ではパフォーマンスのためEngineの再利用などを検討

interface LintIssue {
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  rule: string;
}

interface LintResponse {
  success: boolean;
  issues: LintIssue[];
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<LintResponse>> {
  const { content } = await request.json();
  
  if (!content || typeof content !== 'string') {
    return NextResponse.json({ success: false, issues: [], error: 'Content is required' }, { status: 400 });
  }

  try {
    const engine = new TextLintEngine({
        configFile: ".textlintrc" // またはプロジェクトごとの設定パス
    });

    const results: TextlintResult[] = await engine.executeOnText(content);
    
    // 結果の変換
    const issues: LintIssue[] = results.flatMap(result => 
        result.messages.map(msg => ({
            line: msg.line,
            column: msg.column,
            severity: msg.severity === 2 ? 'error' : 'warning',
            message: msg.message,
            rule: msg.ruleId
        }))
    );

    return NextResponse.json({
      success: true,
      issues,
    });
    
  } catch (error) {
    console.error('Lint error:', error);
    return NextResponse.json({
      success: false,
      issues: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}


## `src/lib/api/lintApi.ts`（クライアント側）

```typescript
interface LintIssue {
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  rule: string;
}

interface LintResult {
  success: boolean;
  issues: LintIssue[];
  error?: string;
}

/**
 * サーバーサイドでTextlintを実行し、結果を取得する
 */
export async function lintMarkdown(content: string): Promise<LintResult> {
  try {
    const response = await fetch('/api/lint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    
    return await response.json();
  } catch (error) {
    return {
      success: false,
      issues: [],
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}
```

# 使用例

## 手動チェックボタン

```tsx
import { lintMarkdown } from '@/lib/api/lintApi';
import { useEditorStore } from '@/stores/editorStore';

function LintButton() {
  const { markdown } = useEditorStore();
  const [issues, setIssues] = useState([]);
  const [isLinting, setIsLinting] = useState(false);
  
  const handleLint = async () => {
    setIsLinting(true);
    const result = await lintMarkdown(markdown);
    setIssues(result.issues);
    setIsLinting(false);
  };
  
  return (
    <>
      <button onClick={handleLint} disabled={isLinting}>
        {isLinting ? 'チェック中...' : '文体チェック'}
      </button>
      
      {issues.length > 0 && (
        <div className="mt-2">
          {issues.map((issue, i) => (
            <div key={i} className={`text-sm ${getSeverityColor(issue.severity)}`}>
              行 {issue.line}: {issue.message}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
```

## 保存時に自動チェック

```typescript
// api-hook-autosave と連携
const result = await saveCurrentDocument(documentId, title);

if (result.success) {
  // 保存成功後にLintを非同期実行
  lintMarkdown(markdown).then(({ issues }) => {
    if (issues.length > 0) {
      // 問題があれば通知（保存はすでに完了）
      toast.info(`${issues.length}件の文体指摘があります`);
    }
  });
}
```

# セキュリティ考慮

- **一時ファイルはUUIDで命名**: ファイル名衝突を防止
- **一時ファイルは即座に削除**: 機密情報の残存を防止
- **コマンドインジェクション防止**: ファイルパスは内部生成のみ使用

# 設定管理 (Configuration Management)

Lint設定（Textlint/MDSchema）は以下の優先順位で適用される。

1. **テンプレート**: ドキュメント作成時の初期値（例：「議事録」用プリセット）
2. **プロジェクト**: プロジェクト単位でのオーバーライド（例：用語集の追加）
3. **管理者ロック**: 管理者が強制するルール（変更不可）

## 管理画面機能

- **MDSCHEMA/TEXTLINT管理メニュー**: 管理者権限を持つユーザーのみアクセス可能。
- **テンプレート設定**: 各テンプレートごとの `.textlintrc` や `schema.json` を編集。
- **プロジェクト設定**: プロジェクト設定画面から、適用するルールのオン/オフを調整（ロック項目を除く）。

# 禁止事項

- **クライアントサイドでの重い処理**: Textlintはブラウザでも動作するが、WebWorker利用などを検討すること
- **ユーザー入力をコマンドに直接渡す**: セキュリティリスク（サーバーサイド実行の場合）

# 完了条件

- [ ] `src/app/api/lint/route.ts` が作成されている
- [ ] `src/lib/api/lintApi.ts` が作成されている
- [ ] APIが正常にTextlintを実行できる
- [ ] エラーハンドリングが適切に機能する

# 次のスキル

- `quality-ui-feedback`: Lint結果をエディタUIに表示
