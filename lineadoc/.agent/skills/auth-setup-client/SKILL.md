---
name: auth-setup-client
description: Supabase Auth のクライアントサイド初期化処理とログイン/ログアウト機能を実装する。
allowed-tools: [file_edit]
meta:
  domain: backend
  role: authentication
  tech_stack: "@supabase/supabase-js, @supabase/auth-helpers-nextjs"
  phase: 2
  estimated_time: 45min
  dependencies: [db-schema-init]
---

# このスキルでやること

Supabase Authenticationを使用したユーザー認証機能のクライアント側実装を行う。
ログイン/ログアウト、セッション管理、保護されたルートへのアクセス制御を提供する。

# 設計思想

## 組織OSアーキテクチャにおける位置づけ

```
入力層（エディタ）
    ↓
┌─────────────────────────────────────┐
│  認証層（Supabase Auth）            │  ← このスキル
│    - ログイン/ログアウト             │
│    - セッション管理                  │
│    - RLSとの連携                    │
└─────────────────────────────────────┘
    ↓
蓄積層（Supabase DB）
```

## 認証フロー

```
ユーザー → ログインページ → Supabase Auth → セッション発行
                                              ↓
                                         RLSで自分のデータのみアクセス可能
```

# パッケージインストール

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/ssr
```

# 作成するファイル

## `src/lib/supabase/client.ts`（ブラウザ用）

```typescript
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

## `src/lib/supabase/server.ts`（サーバー用）

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component では set できない場合がある
          }
        },
      },
    }
  );
}
```

## `src/lib/supabase/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 未認証ユーザーを /login にリダイレクト
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

## `src/middleware.ts`

```typescript
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

## `src/hooks/useAuth.ts`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // 現在のセッションを取得
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // セッション変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, signIn, signUp, signOut };
}
```

# 環境変数

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

# 使用例

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

function Header() {
  const { user, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <a href="/login">ログイン</a>;
  }

  return (
    <div>
      <span>{user.email}</span>
      <button onClick={signOut}>ログアウト</button>
    </div>
  );
}
```

# 禁止事項

- **ANON_KEYをサーバーサイドで使いまわさない**: サーバー側では適切なクライアント作成関数を使用。
- **セッション情報をlocalStorageに直接保存**: Supabaseのセッション管理に任せる。
- **認証なしでの本番運用**: RLSが機能しなくなる。

# 完了条件

- [ ] `src/lib/supabase/client.ts` が作成されている
- [ ] `src/lib/supabase/server.ts` が作成されている
- [ ] `src/middleware.ts` が作成されている
- [ ] `src/hooks/useAuth.ts` が作成されている
- [ ] ログイン/ログアウトが動作する
- [ ] 未認証ユーザーが保護ページにアクセスできない

# 次のスキル

- `api-client-save`: 認証済みユーザーのデータ保存
