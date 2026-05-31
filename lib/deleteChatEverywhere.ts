import {
    clearSessionUi,
    getCurrentSessionKey,
    readSessions,
    saveSessions,
    sortSessions,
    type ChatSession,
} from "@/lib/chatSessionUi";
import { deleteCloudChat, syncCloudChatsToLocalStorage } from "@/lib/chatHistoryCloud";

export type DeleteChatEverywhereResult = {
    deleted: boolean;
    nextSessions: ChatSession[];
    wasCurrentSession: boolean;
    nextCurrentSessionId: string | null;
};

export const deleteChatEverywhere = (
    chatId: string
): DeleteChatEverywhereResult => {
    const cleanId = String(chatId || "").trim();

    if (!cleanId || typeof window === "undefined") {
        return {
            deleted: false,
            nextSessions: [],
            wasCurrentSession: false,
            nextCurrentSessionId: null,
        };
    }

    const sessions = readSessions();
    const nextSessions = sortSessions(sessions.filter((item) => item.id !== cleanId));
    const currentSessionKey = getCurrentSessionKey();
    const savedCurrentId = localStorage.getItem(currentSessionKey) || "";
    const wasCurrentSession = savedCurrentId === cleanId;
    const nextCurrentSessionId = wasCurrentSession
        ? nextSessions[0]?.id || null
        : savedCurrentId || null;

    saveSessions(nextSessions);
    clearSessionUi(cleanId);

    if (wasCurrentSession) {
        if (nextCurrentSessionId) {
            localStorage.setItem(currentSessionKey, nextCurrentSessionId);
        } else {
            localStorage.removeItem(currentSessionKey);
        }
    }

    void deleteCloudChat(cleanId).then((deleted) => {
        if (deleted) {
            void syncCloudChatsToLocalStorage();
        }
    });

    return {
        deleted: true,
        nextSessions,
        wasCurrentSession,
        nextCurrentSessionId,
    };
};
