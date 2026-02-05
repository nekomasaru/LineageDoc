---
name: interoperability
description: MS Office (docx), PDF, Markdown 間の相互運用性とAI視覚校正の実装。
allowed-tools: [file_edit, read_url_content]
meta:
  domain: data-interop
  role: architect
  tech_stack: mammoth.js, docx.js, html-to-docx, pandoc, vertex-ai
---

# このスキルでやること

LineaDocにおける外部ドキュメント（docx/PDF）の取り込み（インポート）および出力（エクスポート）のロジックを管理する。

# インポート・ワークフロー (Inbound)

## 1. docx インポート (`mammoth.js`)
- **目的**: 既存の資産を素早くMarkdownへ変換。
- **方針**: スタイル（フォント・色）を無視し、セマンティクス（見出し・段落・リスト）のみを抽出する。
- **実装**: `mammoth.convertToMarkdown` を使用。

## 2. PDF/画像 インポート (Vertex AI)
- **目的**: 視覚的なレイアウトが重要な文書の構造化取り込み。
- **方針**: Gemini 1.5 Pro (Multi-modal) を使用し、ページ画像から「見出し番号」「インデント」「表構造」を推論。
- **出力**: MDSCHEMAに適合した Markdown + Frontmatter。

## 3. 系譜への統合 (AI Merge Flow)
- **処理**: 再インポートされたファイルは、現在の履歴に対する「外部ブランチ」としてグラフに追加される。
- **AI支援**: AIがエディタ内の現在の構成とインポートされた内容を比較し、変更要約を作成。

# エクスポート・ワークフロー (Outbound)

## 1. サーバーサイド docx 出力 (`html-to-docx` / Server Action)
- **目的**: プレビューで見ている見た目をそのままWord化。
- **実装**: `src/app/actions/interop.ts` にて実行。
- **安定化**: 
    - Windows環境等のバイナリ破損を防ぐため、クライアントへの返却は Base64 string で行い、フロントエンドで Data URL (fetch) スキームを用いて Blob 化する。
    - HTML 構造に UTF-8 宣言を含め、Word 側のパースエラーを最小限に抑える。

## 2. 構造化 docx 生成 (`docx.js`)
- **目的**: Wordの「スタイル」機能を活用した高度な制御。

## 3. プロフェッショナル・テンプレート (`Pandoc`)
- **目的**: 公文書等の厳密なフォーマット再現。
- **実装**: サーバーサイドで Pandoc を起動し、`reference-doc` (Wordテンプレートファイル) を指定して変換。

# AI 視覚校正 (Visual Auditing)

- **ロジック**:
    1. Markdownをプレビュー表示し、その「意図された構造」を取得。
    2. 参考資料としてのPDFと突き合わせる。
    3. AIが「視覚的な矛盾（番号の連番ミス、レイアウトのズレ）」を指摘。

# 運用ルールとリスク管理

## 1. 段階的評価 (Go/No-Go Checkpoints)
実装の各段階で以下の評価を行い、継続判断をする。
- **CP1 (Phase 1後)**: `mammoth.js` の変換精度が 80% 未満の場合、AIによる構造補正を前倒しで検討する。
- **CP2 (Phase 2後)**: AIマージのUXが複雑すぎる場合、機能を「差分表示」のみに縮退させる。
- **CP3 (Phase 3後)**: 視覚校正の誤検知が多い場合、自動修正は行わず「警告（提案）」に留める。

## 2. フェイルセーフ設計
- **ライブラリ・ファースト**: 高コストなAI解析に依存しすぎず、まずは `mammoth.js` 等の確実なライブラリで構造を抽出し、AIは「補完・洗練」の役割に徹する。
- **ユーザー主権**: AIによる自動変換・自動マージは行わず、常にユーザーがプレビューを確認して「承認」するフローを徹底する。

# 関連ファイル

- `src/components/_features/export/ExportModal.tsx`
- `src/lib/interop/docxParser.ts` (将来実装)
- `src/lib/interop/aiAuditor.ts` (将来実装)
- `docs/interoperability_architecture.md`
