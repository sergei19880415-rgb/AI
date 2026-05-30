import { getUserScopedKey } from "@/lib/userStorage";

const CHAT_HISTORY_WEBHOOK_URL = "https://tgdomen.ru/webhook/chat-history";
const SAVED_CHAT_IDS_PREFIX = "ai_cloud_saved_chat_ids_";
const pendingChatSaves = new Set<string>();

export type CloudChatMessageRole = "user" | "assistant" | "system";

export type CloudChatSession = {
    id: string;
    title: string;
    messages: CloudChatMessage[];
    updatedAt: number;
    mode?: string;
};

export type CloudChatMessage = {
    id: string;
    role: CloudChatMessageRole;
    content: string;
    isLoading?: boolean;
    model_id?: string;
    model_display_name?: string;
    attached_file_name?: string;
    attached_file_mime_type?: string;
    model?: string;
    provider?: string;
    file_name?: string;
};

type CloudChatPayload = {
    id: string;
    title: string;
    mode: string;
};

type CloudMessagePayload = {
    id: string;
    chat_id: string;
    role: CloudChatMessageRole;
    content: string;
    model: string;
    provider: string;
    file_name: string;
};

const isBrowser = () => typeof window !== "undefined";

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getSessionToken = () => {
    if (!isBrowser()) return "";
    return localStorage.getItem("ai_session_token") || "";
};

const readSavedChatIds = () => {
    if (!isBrowser()) return new Set<string>();

    try {
        const raw = localStorage.getItem(getUserScopedKey(SAVED_CHAT_IDS_PREFIX));
        const parsed = raw ? JSON.parse(raw) : [];
        return new Set(
            Array.isArray(parsed)
                ? parsed.map((item) => String(item || "").trim()).filter(Boolean)
                : []
        );
    } catch {
        return new Set<string>();
    }
};

const writeSavedChatIds = (ids: Set<string>) => {
    if (!isBrowser()) return;
    localStorage.setItem(
        getUserScopedKey(SAVED_CHAT_IDS_PREFIX),
        JSON.stringify(Array.from(ids))
    );
};

const postChatHistory = async (payload: Record<string, unknown>) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return null;

    try {
        const response = await fetch(CHAT_HISTORY_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ...payload,
                session_token: sessionToken,
            }),
        });

        const raw = await response.text();
        if (!response.ok) return null;
        if (!raw.trim()) return { success: true };

        try {
            return JSON.parse(raw) as unknown;
        } catch {
            return { success: true };
        }
    } catch {
        return null;
    }
};

const unwrapList = (value: unknown, key: "chats" | "messages") => {
    if (Array.isArray(value)) return value;

    if (isRecord(value)) {
        const direct = value[key];
        if (Array.isArray(direct)) return direct;

        const data = value.data;
        if (Array.isArray(data)) return data;
        if (isRecord(data) && Array.isArray(data[key])) return data[key];
    }

    return [];
};

const normalizeCloudChat = (value: unknown): CloudChatSession | null => {
    if (!isRecord(value)) return null;

    const id = String(value.id || value.chat_id || "").trim();
    if (!id) return null;

    const title = String(value.title || "Новый чат").trim() || "Новый чат";
    const mode = String(value.mode || "chat").trim() || "chat";
    const updatedAt = Number(value.updatedAt || value.updated_at || value.created_at || 0);

    return {
        id,
        title,
        mode,
        messages: [],
        updatedAt: Number.isFinite(updatedAt) && updatedAt > 0 ? updatedAt : Date.now(),
    };
};

const normalizeRole = (value: unknown): CloudChatMessageRole => {
    const role = String(value || "").trim().toLowerCase();
    if (role === "assistant" || role === "system") return role;
    return "user";
};

const normalizeCloudMessage = (value: unknown): CloudChatMessage | null => {
    if (!isRecord(value)) return null;

    const id = String(value.id || value.message_id || "").trim();
    if (!id) return null;

    const content = String(value.content || value.text || value.message || "");

    return {
        id,
        role: normalizeRole(value.role),
        content,
        model_id: String(value.model || value.model_id || "").trim() || undefined,
        model_display_name:
            String(value.model_display_name || value.model || value.model_id || "").trim() ||
            undefined,
        provider: String(value.provider || "").trim() || undefined,
        attached_file_name:
            String(value.file_name || value.attached_file_name || "").trim() || undefined,
    };
};

export const getCloudChats = async () => {
    const data = await postChatHistory({ action: "get_chats" });
    return unwrapList(data, "chats")
        .map(normalizeCloudChat)
        .filter((item): item is CloudChatSession => Boolean(item));
};

export const getCloudMessages = async (chatId: string) => {
    const cleanChatId = String(chatId || "").trim();
    if (!cleanChatId) return [];

    const data = await postChatHistory({
        action: "get_messages",
        chat_id: cleanChatId,
    });

    return unwrapList(data, "messages")
        .map(normalizeCloudMessage)
        .filter((item): item is CloudChatMessage => Boolean(item));
};

export const saveCloudChat = async (chat: CloudChatPayload) => {
    const cleanId = String(chat.id || "").trim();
    if (!cleanId) return;

    const savedIds = readSavedChatIds();
    if (savedIds.has(cleanId) || pendingChatSaves.has(cleanId)) return;

    pendingChatSaves.add(cleanId);
    const data = await postChatHistory({
        action: "save_chat",
        chat: {
            id: cleanId,
            title: String(chat.title || "Новый чат").trim() || "Новый чат",
            mode: String(chat.mode || "chat").trim() || "chat",
        },
    });

    pendingChatSaves.delete(cleanId);

    if (data !== null) {
        savedIds.add(cleanId);
        writeSavedChatIds(savedIds);
    }
};

export const markCloudChatSaved = (chatId: string) => {
    const cleanId = String(chatId || "").trim();
    if (!cleanId) return;

    const savedIds = readSavedChatIds();
    savedIds.add(cleanId);
    writeSavedChatIds(savedIds);
};

export const saveCloudMessage = async (message: CloudMessagePayload) => {
    const cleanChatId = String(message.chat_id || "").trim();
    const cleanMessageId = String(message.id || "").trim();
    if (!cleanChatId || !cleanMessageId) return;

    await postChatHistory({
        action: "save_message",
        message: {
            id: cleanMessageId,
            chat_id: cleanChatId,
            role: normalizeRole(message.role),
            content: String(message.content || ""),
            model: String(message.model || ""),
            provider: String(message.provider || ""),
            file_name: String(message.file_name || ""),
        },
    });
};

export const mergeCloudChatsIntoLocal = <T extends CloudChatSession>(
    localSessions: T[],
    cloudSessions: CloudChatSession[]
): T[] => {
    const byId = new Map<string, T>();

    localSessions.forEach((session) => {
        byId.set(session.id, session);
    });

    cloudSessions.forEach((cloudSession) => {
        const existing = byId.get(cloudSession.id);

        if (existing) {
            byId.set(cloudSession.id, {
                ...existing,
                title: existing.title || cloudSession.title,
                updatedAt: Math.max(existing.updatedAt || 0, cloudSession.updatedAt || 0),
            });
            markCloudChatSaved(cloudSession.id);
            return;
        }

        byId.set(cloudSession.id, cloudSession as T);
        markCloudChatSaved(cloudSession.id);
    });

    return Array.from(byId.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
};

export const mergeCloudMessagesIntoSession = <T extends CloudChatSession>(
    session: T,
    cloudMessages: CloudChatMessage[]
): T => {
    if (!cloudMessages.length) return session;

    const byId = new Map<string, CloudChatMessage>();
    (session.messages || []).forEach((message) => {
        byId.set(message.id, message);
    });

    cloudMessages.forEach((message) => {
        const existing = byId.get(message.id);
        byId.set(message.id, {
            ...(existing || {}),
            ...message,
        });
    });

    return {
        ...session,
        messages: Array.from(byId.values()),
    };
};

export const syncCloudChatsToLocalStorage = async () => {
    if (!isBrowser()) return;

    const cloudSessions = await getCloudChats();
    if (!cloudSessions.length) return;

    let localSessions: CloudChatSession[] = [];

    try {
        const raw = localStorage.getItem(getUserScopedKey("ai_sessions_"));
        const parsed = raw ? JSON.parse(raw) : [];
        localSessions = Array.isArray(parsed) ? parsed : [];
    } catch {
        localSessions = [];
    }

    localStorage.setItem(
        getUserScopedKey("ai_sessions_"),
        JSON.stringify(mergeCloudChatsIntoLocal(localSessions, cloudSessions))
    );
    window.dispatchEvent(new Event("ai-chat-sessions-updated"));
    window.dispatchEvent(new Event("ai-chat-updated"));
};
