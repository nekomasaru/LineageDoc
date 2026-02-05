'use client';

import { useState, useCallback, useEffect } from 'react';
import { LineaEvent } from '../lib/types';

const STORAGE_BASE_KEY = 'linea-doc-history';

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function useLinea(documentId?: string | null) {
    const [events, setEvents] = useState<LineaEvent[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadedId, setLoadedId] = useState<string | null>(null);

    const storageKey = documentId ? `${STORAGE_BASE_KEY}-${documentId}` : null;

    // --- NEW: 同期的な整合性チェック ---
    // 引数の documentId と、実際に読み込みが完了した loadedId が一致しているかを確認
    const effectivelyLoaded = isLoaded && documentId === loadedId;

    // Initial load from localStorage
    useEffect(() => {
        if (typeof window === 'undefined' || !storageKey || !documentId) {
            setEvents([]);
            setIsLoaded(true);
            setLoadedId(null);
            return;
        }

        // IDが変わった瞬間に一旦ロード未完了にする（非同期処理の開始）
        setIsLoaded(false);

        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as LineaEvent[];
                setEvents(parsed);
                console.log(`[Linea] Loaded history for ${documentId}:`, parsed.length, 'events');
            } catch (e) {
                console.error('Failed to parse linea history:', e);
                setEvents([]);
            }
        } else {
            setEvents([]);
        }

        setIsLoaded(true);
        setLoadedId(documentId);
    }, [storageKey, documentId]);

    // Save to localStorage whenever events change
    useEffect(() => {
        // IDが一致し、ロードが完了している場合のみ保存を許可
        if (typeof window === 'undefined' || !effectivelyLoaded || !storageKey || !documentId) return;

        if (events.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(events));
            // 本文も保存用に同期
            const latest = events[events.length - 1];
            if (latest.content && documentId) {
                localStorage.setItem(`lineadoc-doc-content-${documentId}`, latest.content);
            }
        }
    }, [events, effectivelyLoaded, storageKey, documentId]);

    const addEvent = useCallback((
        content: string,
        type: LineaEvent['type'] = 'user_edit',
        parentId: string | null = null,
        summary?: string
    ) => {
        if (!effectivelyLoaded) {
            console.warn('[Linea] addEvent called before load completed. Skipping.');
            return {} as LineaEvent;
        }

        const latest = events.length > 0 ? events[events.length - 1] : null;
        const nextVersion = (latest?.version ?? 0) + 1;

        const newEvent: LineaEvent = {
            id: generateId(),
            parentId,
            timestamp: new Date().toISOString(),
            type,
            content,
            summary,
            version: nextVersion,
        };

        setEvents((prev) => [...prev, newEvent]);
        return newEvent;
    }, [events.length, effectivelyLoaded]);

    const clearEvents = useCallback(() => {
        setEvents([]);
        if (typeof window !== 'undefined' && storageKey) {
            localStorage.removeItem(storageKey);
        }
    }, [storageKey]);

    // Reset history and initialize with given content (v1)
    const resetWithContent = useCallback((content: string, summary: string = '履歴のリセット') => {
        const newEvent: LineaEvent = {
            id: generateId(),
            parentId: null,
            timestamp: new Date().toISOString(),
            type: 'user_edit',
            content,
            summary,
            version: 1,
        };

        setEvents([newEvent]);
        if (typeof window !== 'undefined' && storageKey) {
            localStorage.setItem(storageKey, JSON.stringify([newEvent]));
        }
        return newEvent;
    }, [storageKey]);

    const getEventById = useCallback((id: string) => {
        if (!effectivelyLoaded) return undefined;
        return events.find((e) => e.id === id);
    }, [events, effectivelyLoaded]);

    const getLatestEvent = useCallback(() => {
        if (!effectivelyLoaded || events.length === 0) return undefined;
        return events[events.length - 1];
    }, [events, effectivelyLoaded]);

    const getInitialEvent = useCallback(() => {
        if (!effectivelyLoaded || events.length === 0) return undefined;
        return events[0];
    }, [events, effectivelyLoaded]);

    const getPreviousEvent = useCallback((id: string) => {
        if (!effectivelyLoaded) return undefined;
        const current = events.find((e) => e.id === id);
        if (!current || !current.parentId) return undefined;
        return events.find((e) => e.id === current.parentId);
    }, [events, effectivelyLoaded]);

    const getPreviousContent = useCallback(() => {
        const latest = getLatestEvent();
        return latest?.content;
    }, [getLatestEvent]);

    const getEventByVersion = useCallback((version: number) => {
        if (!effectivelyLoaded) return undefined;
        return events.find((e) => e.version === version);
    }, [events, effectivelyLoaded]);

    const updateEventSummary = useCallback((eventId: string, newSummary: string) => {
        setEvents(prev => prev.map(e =>
            e.id === eventId ? { ...e, summary: newSummary } : e
        ));
    }, []);

    const updateEventContent = useCallback((eventId: string, newContent: string) => {
        setEvents(prev => prev.map(e =>
            e.id === eventId ? { ...e, content: newContent } : e
        ));
    }, []);

    return {
        events: effectivelyLoaded ? events : [],
        isLoaded: effectivelyLoaded,
        loadedId,
        addEvent,
        clearEvents,
        resetWithContent,
        getEventById,
        getLatestEvent,
        getInitialEvent,
        getPreviousEvent,
        getPreviousContent,
        getEventByVersion,
        updateEventSummary,
        updateEventContent,
    };
}
