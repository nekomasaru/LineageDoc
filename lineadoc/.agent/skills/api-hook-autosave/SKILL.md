---
name: api-hook-autosave
description: 編集操作が止まってから数秒後に保存APIを叩くDebounce処理を実装する。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: data-sync
  tech_stack: react, zustand, use-debounce
  day: 5
  estimated_time: 40min
  dependencies: [api-client-save]
---

# このスキルでやること

ユーザーの編集操作が一定時間（例：3秒）止まったタイミングで、自動的にSupabaseへ保存する「自動保存」機能を実装する。

# 設計思想

## なぜ自動保存か

- **データ消失防止**: ブラウザクラッシュ、誤操作時のリスク軽減
- **UX向上**: 「保存ボタン」を意識しなくてよい
- **リネージ自動構築**: 一定間隔で履歴が蓄積される

## タイミング戦略

```
編集       編集       編集                   保存
  ↓         ↓         ↓                      ↓
──┼─────────┼─────────┼──────────────────────┼───→ 時間
  │← 3秒 →│← 3秒 →│←────── 3秒 ──────→│
              リセット   リセット           発火
```

**Debounce**: 最後の編集から3秒後に保存APIを呼ぶ。編集が続く間はリセットされる。

# 作成するファイル

## `src/hooks/useAutoSave.ts`

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useEditorStore } from '@/stores/editorStore';
import { saveCurrentDocument } from '@/lib/api/documentApi';

interface UseAutoSaveOptions {
  documentId?: string;
  documentTitle?: string;
  debounceMs?: number;
  enabled?: boolean;
  onSaveStart?: () => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: string) => void;
}

export function useAutoSave(options: UseAutoSaveOptions = {}) {
  const {
    documentId,
    documentTitle,
    debounceMs = 3000,
    enabled = true,
    onSaveStart,
    onSaveSuccess,
    onSaveError,
  } = options;
  
  const { markdown, isDirty } = useEditorStore();
  const isSavingRef = useRef(false);
  const lastSavedMarkdownRef = useRef<string>('');
  
  // Debounce付き保存処理
  const debouncedSave = useDebouncedCallback(
    async () => {
      // 保存中なら何もしない
      if (isSavingRef.current) return;
      
      // 変更がなければ何もしない
      const currentMarkdown = useEditorStore.getState().markdown;
      if (currentMarkdown === lastSavedMarkdownRef.current) return;
      
      isSavingRef.current = true;
      onSaveStart?.();
      
      try {
        const result = await saveCurrentDocument(
          documentId,
          documentTitle,
          '自動保存'
        );
        
        if (result.success) {
          lastSavedMarkdownRef.current = currentMarkdown;
          onSaveSuccess?.();
        } else {
          onSaveError?.(result.error ?? 'Unknown error');
        }
      } catch (error) {
        onSaveError?.(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        isSavingRef.current = false;
      }
    },
    debounceMs
  );
  
  // markdown変更を監視
  useEffect(() => {
    if (enabled && isDirty) {
      debouncedSave();
    }
  }, [markdown, enabled, isDirty, debouncedSave]);
  
  // 手動保存（即時）
  const saveNow = useCallback(async () => {
    debouncedSave.cancel();
    
    if (isSavingRef.current) return;
    
    isSavingRef.current = true;
    onSaveStart?.();
    
    try {
      const result = await saveCurrentDocument(
        documentId,
        documentTitle
      );
      
      if (result.success) {
        lastSavedMarkdownRef.current = useEditorStore.getState().markdown;
        onSaveSuccess?.();
      } else {
        onSaveError?.(result.error ?? 'Unknown error');
      }
    } catch (error) {
      onSaveError?.(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      isSavingRef.current = false;
    }
  }, [documentId, documentTitle, debouncedSave, onSaveStart, onSaveSuccess, onSaveError]);
  
  // アンマウント時に保留中の保存をキャンセル
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);
  
  return {
    saveNow,
    isSaving: isSavingRef.current,
  };
}
```

# 使用例

## エディタページでの使用

```tsx
import { useAutoSave } from '@/hooks/useAutoSave';
import { toast } from 'sonner';

function EditorPage({ documentId }: { documentId: string }) {
  const [isSaving, setIsSaving] = useState(false);
  
  const { saveNow } = useAutoSave({
    documentId,
    documentTitle: 'My Document',
    debounceMs: 3000,
    enabled: true,
    onSaveStart: () => setIsSaving(true),
    onSaveSuccess: () => {
      setIsSaving(false);
      // 控えめな通知（トーストではなくアイコン変化など）
    },
    onSaveError: (error) => {
      setIsSaving(false);
      toast.error(`自動保存に失敗しました: ${error}`);
    },
  });
  
  // Ctrl+S での手動保存
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveNow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveNow]);
  
  return (
    <div>
      {isSaving && <span className="text-slate-400 text-sm">保存中...</span>}
      <SplitEditorLayout />
    </div>
  );
}
```

# 保存状態のUI表示

```tsx
// 控えめな保存インジケーター
function SaveIndicator() {
  const { isDirty, lastSavedAt } = useEditorStore();
  
  if (isDirty) {
    return <span className="text-amber-500 text-xs">●未保存</span>;
  }
  
  if (lastSavedAt) {
    return (
      <span className="text-slate-400 text-xs">
        保存済み {formatDistanceToNow(lastSavedAt, { locale: ja })}
      </span>
    );
  }
  
  return null;
}
```

# ページ離脱時の警告

```tsx
// 未保存のまま離脱しようとした場合に警告
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (useEditorStore.getState().isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, []);
```

# パフォーマンス考慮

## Debounce時間の調整

| ユースケース | 推奨値 |
|-------------|--------|
| 短い文書 | 2-3秒 |
| 長い文書（遅い回線） | 5-10秒 |
| モバイル | 5秒以上 |

## ネットワーク状態の考慮

```typescript
// オフライン時は自動保存を無効化
const isOnline = useOnlineStatus();

useAutoSave({
  enabled: isOnline,
  // ...
});
```

# 禁止事項

- **Debounceなしの即時保存**: APIへの過剰なリクエストを防ぐ。
- **エラー時の無視**: ユーザーに通知し、リトライ機会を与える。
- **保存中の再保存**: `isSavingRef` でガードする。
- **アンマウント時のリーク**: `debouncedSave.cancel()` を必ず呼ぶ。

# 完了条件

- [ ] `src/hooks/useAutoSave.ts` が作成されている
- [ ] 編集後3秒で自動保存が発火する
- [ ] 保存中は重複実行されない
- [ ] Ctrl+S で即時保存できる
- [ ] 未保存時のページ離脱で警告が出る
- [ ] 保存状態がUIに反映される

# 次のスキル（Day 4-5完了後、品質管理フェーズへ）

- `quality-setup-vale`: 文体チェックツールの導入
