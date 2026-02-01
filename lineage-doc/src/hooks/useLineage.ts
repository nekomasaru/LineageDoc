'use client';

import { useState, useCallback, useEffect } from 'react';
import { LineageEvent } from '@/lib/types';

const STORAGE_KEY = 'lineage-doc-history';

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useLineage() {
    const [events, setEvents] = useState<LineageEvent[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // 初回マウント時にローカルストレージから読み込み
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as LineageEvent[];
                // バージョン番号がない古いデータをマイグレーション
                const migrated = parsed.map((e, i, arr) => ({
                    ...e,
                    version: e.version ?? i + 1,
                    parentId: e.parentId !== undefined ? e.parentId : (i > 0 ? arr[i - 1].id : null),
                }));
                setEvents(migrated);
                console.log('[Lineage] Loaded history:', migrated.length, 'events');
            } catch (e) {
                console.error('Failed to parse lineage history:', e);
            }
        }
        setIsLoaded(true);
    }, []);

    // イベントが変更されたらローカルストレージに保存
    useEffect(() => {
        if (typeof window === 'undefined' || !isLoaded) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    }, [events, isLoaded]);

    const addEvent = useCallback((
        type: LineageEvent['type'],
        content: string,
        parentId: string | null,
        summary?: string
    ) => {
        const newVersion = events.length + 1; // Note: 分岐するとバージョン番号の概念が難しくなるが、一旦通し番号
        const newEvent: LineageEvent = {
            id: generateId(),
            parentId,
            timestamp: new Date().toISOString(),
            type,
            content,
            summary,
            version: newVersion,
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

    // 履歴をリセットし、指定されたコンテンツで初期化する（v1を作成）
    const resetWithContent = useCallback((content: string, summary: string = '履歴のリセット') => {
        const newEvent: LineageEvent = {
            id: generateId(),
            parentId: null,
            timestamp: new Date().toISOString(),
            type: 'user_edit',
            content,
            summary,
            version: 1, // 確実にv1にする
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

    // 最新のイベントを取得
    const getLatestEvent = useCallback(() => {
        if (events.length === 0) return undefined;
        return events[events.length - 1];
    }, [events]);

    // 最初のイベントを取得
    const getInitialEvent = useCallback(() => {
        if (events.length === 0) return undefined;
        return events[0];
    }, [events]);

    // 指定IDのイベントの親イベントを取得
    const getPreviousEvent = useCallback((id: string) => {
        const current = events.find((e) => e.id === id);
        if (!current || !current.parentId) return undefined;
        return events.find((e) => e.id === current.parentId);
    }, [events]);

    // 1つ前のコンテンツを取得（最新に対して）
    const getPreviousContent = useCallback(() => {
        const latest = getLatestEvent();
        return latest?.content;
    }, [getLatestEvent]);

    // バージョン番号からイベントを取得
    const getEventByVersion = useCallback((version: number) => {
        return events.find((e) => e.version === version);
    }, [events]);

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
    };
}
