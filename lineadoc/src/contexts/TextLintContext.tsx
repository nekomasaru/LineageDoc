"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

// Interfaces for Type Safety
export interface TextLintError {
    ruleId: string;
    message: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'suggestion';
    fix?: {
        range: [number, number];
        text: string;
        isAbsolute: boolean;
    };
}

interface TextLintContextType {
    isChecking: boolean;
    errors: TextLintError[];
    checkText: (text: string) => Promise<void>;
    clearErrors: () => void;
    apiEndpoint: string;
}

const TextLintContext = createContext<TextLintContextType | null>(null);

export function TextLintProvider({
    children,
    apiEndpoint
}: {
    children: React.ReactNode;
    apiEndpoint: string;
}) {
    const [isChecking, setIsChecking] = useState(false);
    const [errors, setErrors] = useState<TextLintError[]>([]);

    const checkText = useCallback(async (text: string) => {
        if (!text.trim()) {
            setErrors([]);
            return;
        }

        setIsChecking(true);

        try {
            // In development, handle if API is not running or CORS issues
            const endpoint = apiEndpoint.endsWith('/') ? apiEndpoint : `${apiEndpoint}/`;

            const response = await fetch(`${endpoint}api/lint`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                // If 404/500, we might want to fail silently or show toast in a real app
                // For now, clear errors or keep previous ones
                console.error(`TextLint API Error: ${response.status}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setErrors(result.errors || []);
        } catch (error) {
            console.error('TextLint check failed:', error);
            // Optional: set a global error state here if needed
            // setErrors([]); // Choosing NOT to clear errors on failure so user sees last valid state? 
            // Or clear them to avoid out-of-sync? Let's clear for safety or keep empty list if failed.
            // But if network fails, maybe we shouldn't wipe out everything. 
            // Let's set to empty list to avoid showing stale valid errors for invalid text.
        } finally {
            setIsChecking(false);
        }
    }, [apiEndpoint]);

    const clearErrors = useCallback(() => {
        setErrors([]);
    }, []);

    const value = {
        isChecking,
        errors,
        checkText,
        clearErrors,
        apiEndpoint
    };

    return (
        <TextLintContext.Provider value={value}>
            {children}
        </TextLintContext.Provider>
    );
}

export function useTextLint() {
    const context = useContext(TextLintContext);
    if (!context) {
        throw new Error('useTextLint must be used within TextLintProvider');
    }
    return context;
}
