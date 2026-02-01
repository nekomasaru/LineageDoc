---
name: ai-llm-engineering
description: Vertex AI (Gemini) との接続、プロンプト設計、ストリーミング実装。
allowed-tools: [file_edit]
meta:
  domain: backend
  role: ai-logic
  tech_stack: vertex-ai-sdk
---

# このスキルでやること

1. **プロンプトエンジニアリング**: 
   - ユーザーの要望（「もっと丁寧に直して」等）を、LLMが理解できる具体的な指示（System Prompt）に変換する。

2. **API実装**:
   - Next.js Route Handler で Vertex AI API を叩くエンドポイントを作成する。Gemini 2.5 flash-liteとする。

3. **UI連携**:
   - AIの回答をストリーミング（逐次表示）するための `useChat` / `useCompletion` フックの実装。

# 実行手順

## Step 1: プロンプト設計（最重要）

コードを書く前に、必ず「どのような指示をAIに与えるか」を設計し、`prompts/system-prompt.ts` 等に定数化する。

- **役割**: 公的機関のベテラン文書担当者。
- **制約**: 事実を捏造しない。文体は「である」調。

## Step 2: Vercel AI SDK 実装

- `ai` パッケージと `@ai-sdk/google` を使用する。
- ストリーミングレスポンス (`StreamData`) を実装し、待機時間を短縮する。

# 具体例 (プロンプト)

```typescript
export const SYSTEM_PROMPT = `
あなたは日本の自治体職員を支援する文書作成アシスタントです。
以下のルールを厳守してください：
1. 提案は必ずMarkdown形式で出力すること。
2. 変更理由は「〜のため」と簡潔に添えること。
3. 曖昧な表現（「善処する」等）は避け、具体的かつ断定的な表現を使うこと。
`;
```
