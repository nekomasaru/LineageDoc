---
name: quality-setup-vale
description: ローカル環境でValeを実行できる体制を整え、設定ファイル(.vale.ini)を配置する。
allowed-tools: [file_edit, run_command]
meta:
  domain: quality
  role: tooling-setup
  tech_stack: vale-cli
  phase: 2
  estimated_time: 30min
  dependencies: []
---

文体チェックツール「Vale」をプロジェクトに導入し、**LineaDoc (Organizational Knowledge OS)** の「Process Layer (統制)」として品質担保の自動化を行う。

# 設計思想

## 組織OSアーキテクチャにおける位置づけ

```
入力層（エディタ）
    ↓
┌─────────────────────────────────────┐
│  処理層（Vale + mdschema）          │  ← このスキル
│    - 文体チェック                    │
│    - 構造検証                        │
│    - 「関所」として品質を担保         │
└─────────────────────────────────────┘
    ↓
蓄積層（Supabase）
```

## Valeとは

Vale は文体チェック（Linting）ツール。ルールをYAMLで定義し、Markdownやテキストファイルに対してチェックを実行できる。

# インストール

```bash
# Windows (winget) - 推奨
winget install errata-ai.Vale

# Windows (Scoop)
scoop install vale

# Windows (Chocolatey)
choco install vale

# macOS (Homebrew)
brew install vale

# 確認
vale --version
```

# 作成するファイル

## `.vale.ini`（プロジェクトルート）

```ini
# Vale 設定ファイル
StylesPath = .vale/styles

# 日本語対応
# Vale は形態素解析を行わないため、文節単位のルールには制限がある
# 主にパターンマッチングベースのルールを使用

[*.md]
# 適用するスタイル
BasedOnStyles = LineaDoc

# 警告レベル
MinAlertLevel = suggestion
```

## `.vale/styles/LineaDoc/meta.json`

```json
{
  "name": "LineaDoc",
  "version": "1.0.0",
  "description": "LineaDoc公文書スタイルガイド"
}
```

## `.vale/styles/LineaDoc/Headings.yml`

```yaml
# 見出しのルール
extends: existence
message: "見出しには番号を含めることを推奨します（例：1. 目的）"
link: "https://example.com/style-guide#headings"
level: suggestion
scope: heading
tokens:
  - '^[一二三四五六七八九十]+\.\s'
  - '^\d+\.\s'
  - '^第[一二三四五六七八九十\d]+条'
```

## `.vale/styles/LineaDoc/ProhibitedWords.yml`

```yaml
# 禁止用語
extends: existence
message: "'%s' は使用を避けてください。代わりに適切な表現を使用してください。"
level: error
ignorecase: true
tokens:
  - "等々"  # → 「等」を使用
  - "したりする"  # → 「する」を使用
  - "というような"  # → 直接的な表現を使用
```

## `.vale/styles/LineaDoc/Consistency.yml`

```yaml
# 表記ゆれ検出（例）
extends: substitution
message: "'%s' は '%s' に統一してください。"
level: warning
ignorecase: true
swap:
  "行なう": "行う"
  "おこなう": "行う"
  "できる様": "できるよう"
  "であるが、": "であるが"
  "ください。": "下さい。"  # または逆（プロジェクトで統一）
```

# ディレクトリ構造

```
linea-doc/
├── .vale.ini
├── .vale/
│   └── styles/
│       └── LineaDoc/
│           ├── meta.json
│           ├── Headings.yml
│           ├── ProhibitedWords.yml
│           └── Consistency.yml
└── ...
```

# 実行方法

```bash
# 単一ファイルをチェック
vale document.md

# ディレクトリ全体をチェック
vale src/

# JSON形式で出力（CI連携用）
vale --output=JSON document.md
```

# VSCode 統合

```json
// .vscode/settings.json
{
  "vale.valeCLI.path": "vale",
  "vale.minAlertLevel": "suggestion"
}
```

VSCode拡張機能「Vale」をインストールすると、エディタ上でリアルタイムに警告が表示される。

# 注意事項：日本語対応の限界

Vale は英語ベースのツールのため、日本語の文法チェックには以下の制限がある：

| 機能 | 英語 | 日本語 |
|------|------|--------|
| スペルチェック | ✅ | ❌（形態素解析が必要） |
| 文法チェック | ✅ | ⚠️（パターンマッチのみ） |
| 表記ゆれ | ✅ | ✅（代替語リストで対応） |
| 禁止用語 | ✅ | ✅ |

高度な日本語チェックが必要な場合は、別途 `textlint` の導入を検討する。

# 禁止事項

- **全ルールをエラーにしない**: 最初は `suggestion` から始め、徐々に厳格化する。
- **完璧なルールセットを最初から作ろうとしない**: 運用しながら改善する。
- **CI必須にしない（初期段階）**: まずはローカルチェックから始める。

# 完了条件

- [ ] Vale がインストールされている
- [ ] `.vale.ini` が作成されている
- [ ] `.vale/styles/LineaDoc/` にルールファイルが配置されている
- [ ] `vale document.md` が正常に実行できる
- [ ] VSCode で警告が表示される（オプション）

# 次のスキル

- `quality-logic-lint`: ファイル保存時にValeを実行するロジック
- `quality-ui-feedback`: エラー・警告をUIに表示
