'use client';

import { useState, useCallback, useEffect } from 'react';
import { LineaEvent } from '../lib/types';

const STORAGE_KEY = 'linea-doc-history';

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function useLinea() {
    const [events, setEvents] = useState<LineaEvent[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initial load from localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as LineaEvent[];
                setEvents(parsed);
                console.log('[Linea] Loaded history:', parsed.length, 'events');
            } catch (e) {
                console.error('Failed to parse linea history:', e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage whenever events change
    useEffect(() => {
        if (typeof window === 'undefined' || !isLoaded) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    }, [events, isLoaded]);

    const addEvent = useCallback((
        content: string,
        type: LineaEvent['type'] = 'user_edit',
        parentId: string | null = null,
        summary?: string
    ) => {
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
    }, [events.length]);

    const clearEvents = useCallback(() => {
        setEvents([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

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
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([newEvent]));
        }
        return newEvent;
    }, []);

    const getEventById = useCallback((id: string) => {
        return events.find((e) => e.id === id);
    }, [events]);

    const getLatestEvent = useCallback(() => {
        if (events.length === 0) return undefined;
        return events[events.length - 1];
    }, [events]);

    const getInitialEvent = useCallback(() => {
        if (events.length === 0) return undefined;
        return events[0];
    }, [events]);

    const getPreviousEvent = useCallback((id: string) => {
        const current = events.find((e) => e.id === id);
        if (!current || !current.parentId) return undefined;
        return events.find((e) => e.id === current.parentId);
    }, [events]);

    const getPreviousContent = useCallback(() => {
        const latest = getLatestEvent();
        return latest?.content;
    }, [getLatestEvent]);

    const getEventByVersion = useCallback((version: number) => {
        return events.find((e) => e.version === version);
    }, [events]);

    const updateEventSummary = useCallback((eventId: string, newSummary: string) => {
        setEvents(prev => prev.map(e =>
            e.id === eventId ? { ...e, summary: newSummary } : e
        ));
    }, []);

    return {
        events,
        isLoaded,
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
    };
}
