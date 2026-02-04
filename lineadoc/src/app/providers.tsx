'use client';

import { LanguageProvider as ContextProvider } from '@/lib/LanguageContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return <ContextProvider>{children}</ContextProvider>;
}
