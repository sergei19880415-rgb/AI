import {
    applySessionUiSettingsToLegacyKeys,
    readSessionUiSettings,
    removeSessionUiSettings,
    writeSessionUiSettings,
} from "@/lib/chatUiSettings";
import { getUserScopedKey } from "@/lib/userStorage";

export type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    isLoading?: boolean;
    model_id?: string;
    model_display_name?: string;
};

export type ChatSession = {
    id: string;
    title: string;
    messages: ChatMessage[];
    updatedAt: number;
    folder?: string;
    isPinned?: boolean;
};

export const getSessionsKey = () => {
    return getUserScopedKey("ai_sessions_");
};

export const getCurrentSessionKey = () => {
    return getUserScopedKey("ai_current_session_");
};

export const readSessions = (): ChatSession[] => {
    try {
        const raw = localStorage.getItem(getSessionsKey());
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const sortSessions = (sessions: ChatSession[]) => {
    return [...sessions].sort((a, b) => {
        const pinA = a.isPinned ? 1 : 0;
        const pinB = b.isPinned ? 1 : 0;

        if (pinA !== pinB) {
            return pinB - pinA;
        }

        return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
};

export const saveSessions = (sessions: ChatSession[]) => {
    localStorage.setItem(getSessionsKey(), JSON.stringify(sessions));
    window.dispatchEvent(new Event("ai-chat-sessions-updated"));
    window.dispatchEvent(new Event("ai-chat-updated"));
};

export const getSessionTitleFromText = (text: string) => {
    const clean = text.trim();
    if (!clean) return "Новый чат";
    return clean.length > 60 ? `${clean.slice(0, 60)}...` : clean;
};

export const ensureSession = (requestedId?: string | null) => {
    const sessions = readSessions();

    if (sessions.length === 0) {
        const newSession: ChatSession = {
            id: crypto.randomUUID(),
            title: "Новый чат",
            messages: [],
            updatedAt: Date.now(),
        };

        saveSessions([newSession]);
        localStorage.setItem(getCurrentSessionKey(), newSession.id);
        applySessionUiSettingsToLegacyKeys(newSession.id);

        return newSession;
    }

    if (requestedId) {
        const found = sessions.find((item) => item.id === requestedId);
        if (found) {
            localStorage.setItem(getCurrentSessionKey(), found.id);
            applySessionUiSettingsToLegacyKeys(found.id);
            return found;
        }
    }

    const savedCurrentId = localStorage.getItem(getCurrentSessionKey()) || "";
    const current =
        sessions.find((item) => item.id === savedCurrentId) || sessions[0];

    localStorage.setItem(getCurrentSessionKey(), current.id);
    applySessionUiSettingsToLegacyKeys(current.id);
    return current;
};

export const ensureCurrentSession = () => {
    const sessions = readSessions();
    const savedCurrentId = localStorage.getItem(getCurrentSessionKey()) || "";
    const currentSession = sessions.find((item) => item.id === savedCurrentId);

    if (currentSession) {
        applySessionUiSettingsToLegacyKeys(currentSession.id);
        return currentSession;
    }

    const nextSession: ChatSession = {
        id: crypto.randomUUID(),
        title: "Новый чат",
        messages: [],
        updatedAt: Date.now(),
    };

    saveSessions([nextSession, ...sessions]);
    localStorage.setItem(getCurrentSessionKey(), nextSession.id);
    applySessionUiSettingsToLegacyKeys(nextSession.id);

    return nextSession;
};

export const persistSessionUiPatch = (
    sessionId: string | null | undefined,
    patch: Record<string, unknown>
) => {
    if (!sessionId) return;
    writeSessionUiSettings(sessionId, patch);
    applySessionUiSettingsToLegacyKeys(sessionId);
    window.dispatchEvent(new Event("ai-session-ui-settings-updated"));
    window.dispatchEvent(new Event("ai-selected-model-updated"));
    window.dispatchEvent(new Event("ai-selected-models-updated"));
    window.dispatchEvent(new Event("ai-parallel-settings-updated"));
    window.dispatchEvent(new Event("ai-active-mode-updated"));
};

export const clearSessionUi = (sessionId: string | null | undefined) => {
    if (!sessionId) return;
    removeSessionUiSettings(sessionId);
    window.dispatchEvent(new Event("ai-session-ui-settings-updated"));
};

export const getSessionUi = (sessionId?: string | null) => {
    return readSessionUiSettings(sessionId);
};
