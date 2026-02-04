---
name: quality-logic-lint
description: 保存時またはボタン押下時にMarkdownに対してVale/mdschemaを実行する。
allowed-tools: [file_edit]
meta:
  domain: quality
  role: validation-logic
  tech_stack: vale-cli, api-routes
  phase: 2
  estimated_time: 50min
  dependencies: [quality-setup-vale]
---

# このスキルでやること

ユーザーがドキュメントを編集・保存する際、または手動でチェックボタンを押した際に、以下のバリデーションを実行し、結果を `qualityStore` に格納する。

1. **MDSCHEMA チェック**: 公文書固有の構造（Frontmatterの必須項目、章立ての構成）が正しいか。
2. **Textlint/Vale チェック**: 用語統一、不適切な表現（公文書として不適切な言葉遣い）の自動検出。

# 設計思想

## なぜサーバーサイドか

- Vale CLIはNode.js上で直接実行できない（シェルコマンド）
- ブラウザからはファイルシステムにアクセスできない
- Next.js API Routeで一時ファイルを作成し、Valeを実行

## 処理フロー

```
クライアント                        サーバー（API Route）
    │                                     │
    │  POST /api/lint                     │
    │  { content: "# 見出し..." }  ───→   │
    │                                     │
    │                               1. 一時ファイル作成
    │                               2. vale 実行
    │                               3. 結果をJSON解析
    │                               4. 一時ファイル削除
    │                                     │
    │  ←───  { issues: [...] }            │
    │                                     │
```

# 作成するファイル

## `src/app/api/lint/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

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
    return NextResponse.json({
      success: false,
      issues: [],
      error: 'Content is required',
    }, { status: 400 });
  }
  
  // 一時ディレクトリとファイルを作成
  const tempDir = join(process.cwd(), '.temp');
  const tempFile = join(tempDir, `${randomUUID()}.md`);
  
  try {
    // ディレクトリ作成
    await mkdir(tempDir, { recursive: true });
    
    // 一時ファイルに書き込み
    await writeFile(tempFile, content, 'utf-8');
    
    // Vale を実行
    const { stdout, stderr } = await execAsync(
      `vale --output=JSON "${tempFile}"`,
      { cwd: process.cwd() }
    );
    
    // JSON解析
    const valeOutput = JSON.parse(stdout || '{}');
    const fileIssues = valeOutput[tempFile] || [];
    
    // フォーマット変換
    const issues: LintIssue[] = fileIssues.map((issue: any) => ({
      line: issue.Line,
      column: issue.Span?.[0] || 1,
      severity: mapSeverity(issue.Severity),
      message: issue.Message,
      rule: issue.Check,
    }));
    
    return NextResponse.json({
      success: true,
      issues,
    });
    
  } catch (error) {
    console.error('Lint error:', error);
    
    // Vale が見つからない場合などのエラーハンドリング
    if (error instanceof Error && error.message.includes('vale')) {
      return NextResponse.json({
        success: false,
        issues: [],
        error: 'Vale CLI is not installed or not in PATH',
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: false,
      issues: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
    
  } finally {
    // 一時ファイル削除
    try {
      await unlink(tempFile);
    } catch {
      // 削除失敗は無視
    }
  }
}

function mapSeverity(valeSeverity: string): 'error' | 'warning' | 'suggestion' {
  switch (valeSeverity.toLowerCase()) {
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    default:
      return 'suggestion';
  }
}
```

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
 * サーバーサイドでValeを実行し、結果を取得する
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

# 禁止事項

- **クライアントサイドでのVale実行**: ブラウザでは不可能
- **ユーザー入力をコマンドに直接渡す**: セキュリティリスク
- **一時ファイルの放置**: finally ブロックで必ず削除
- **エラー時の詳細なスタックトレース露出**: クライアントには最小限の情報のみ

# 完了条件

- [ ] `src/app/api/lint/route.ts` が作成されている
- [ ] `src/lib/api/lintApi.ts` が作成されている
- [ ] APIが正常にValeを実行できる
- [ ] エラーハンドリングが適切に機能する
- [ ] 一時ファイルがクリーンアップされる

# 次のスキル

- `quality-ui-feedback`: Lint結果をエディタUIに表示
