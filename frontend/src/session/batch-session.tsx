/* The provider and its hook intentionally share this session-only module. */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { BatchAnalysisResponse, BatchAnalysisResult } from '@/types/api';

const STORAGE_KEY = 'ecuador-prioritizer-current-batch-v1';

export interface BatchDraftItem {
  id: string;
  text: string;
  source: string;
  displaySource?: string;
}

export interface SessionResultItem extends BatchAnalysisResult {
  id: string;
  text: string;
  displaySource?: string;
}

interface StoredBatchSession {
  analyzedAt: string;
  results: SessionResultItem[];
}

interface BatchSessionContextValue {
  session: StoredBatchSession | null;
  saveResults: (response: BatchAnalysisResponse, drafts: BatchDraftItem[]) => void;
  clearResults: () => void;
}

const BatchSessionContext = createContext<BatchSessionContextValue | null>(null);

function readStoredSession(): StoredBatchSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredBatchSession;
    if (!Array.isArray(parsed.results) || typeof parsed.analyzedAt !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function BatchSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredBatchSession | null>(readStoredSession);

  useEffect(() => {
    try {
      if (session) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Session storage can be unavailable; the in-memory state still works for this tab.
    }
  }, [session]);

  const value = useMemo<BatchSessionContextValue>(() => ({
    session,
    saveResults(response, drafts) {
      const byId = new Map(drafts.map((draft) => [draft.id, draft]));
      const results = response.items.flatMap((result) => {
        const draft = result.client_id ? byId.get(result.client_id) : undefined;
        return draft ? [{ ...result, id: draft.id, text: draft.text, source: draft.source || result.source, displaySource: draft.displaySource }] : [];
      });
      setSession({ analyzedAt: new Date().toISOString(), results });
    },
    clearResults() {
      setSession(null);
    },
  }), [session]);

  return <BatchSessionContext.Provider value={value}>{children}</BatchSessionContext.Provider>;
}

export function useBatchSession(): BatchSessionContextValue {
  const context = useContext(BatchSessionContext);
  if (!context) throw new Error('useBatchSession must be used inside BatchSessionProvider.');
  return context;
}
