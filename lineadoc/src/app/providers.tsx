'use client';

import { LanguageProvider as ContextProvider } from '@/lib/LanguageContext';
import { MantineProvider, createTheme } from '@mantine/core';

const theme = createTheme({
    /** Put your mantine theme override here */
    primaryColor: 'teal',
    primaryShade: 6,
});

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ContextProvider>
            <MantineProvider theme={theme}>
                {children}
            </MantineProvider>
        </ContextProvider>
    );
}
