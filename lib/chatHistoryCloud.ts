import { writeSessionUiSettings } from "@/lib/chatUiSettings";
import { getUserScopedKey } from "@/lib/userStorage";

const CHAT_HISTORY_WEBHOOK_URL = "https://tgdomen.ru/webhook/chat-history";
const SAVED_CHAT_IDS_PREFIX = "ai_cloud_saved_chat_ids_";
const SAVED_CHAT_METADATA_PREFIX = "ai_cloud_saved_chat_metadata_";
const DELETED_CHAT_IDS_PREFIX = "ai_cloud_deleted_chat_ids_";
const RETURN_AFTER_LOGIN_STORAGE_KEY = "ai_return_after_login";
const pendingChatSaves = new Set<string>();

export type CloudChatMessageRole = "user" | "assistant" | "system";

export type CloudChatSession = {
    id: string;
    title: string;
    messages: CloudChatMessage[];
    updatedAt: number;
    mode?: string;
    selected_models?: string[];
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
    selected_models?: string[];
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

export const normalizeSelectedModels = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return [
            ...new Set(
                value.map((item) => String(item || "").trim()).filter(Boolean)
            ),
        ];
    }

    if (typeof value === "string") {
        const clean = value.trim();
        if (!clean) return [];

        try {
            const parsed = JSON.parse(clean);
            if (Array.isArray(parsed)) {
                return normalizeSelectedModels(parsed);
            }
        } catch {
            // Fall back to comma-separated values below.
        }

        return [
            ...new Set(
                clean
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
            ),
        ];
    }

    return [];
};

const getCloudChatUiMode = (mode?: string) => {
    const cleanMode = String(mode || "chat").trim().toLowerCase();
    if (cleanMode === "image") return "image";
    if (cleanMode === "video") return "video";
    return "chat";
};

const getCloudChatActiveMode = (mode?: string) => {
    return getCloudChatUiMode(mode) === "image" ? "image" : "text";
};

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

const readSavedChatMetadata = () => {
    if (!isBrowser()) return new Map<string, string>();

    try {
        const raw = localStorage.getItem(getUserScopedKey(SAVED_CHAT_METADATA_PREFIX));
        const parsed = raw ? JSON.parse(raw) : {};
        if (!isRecord(parsed)) return new Map<string, string>();

        return new Map(
            Object.entries(parsed)
                .map(([id, metadata]) => [
                    String(id || "").trim(),
                    String(metadata || ""),
                ] as const)
                .filter(([id]) => Boolean(id))
        );
    } catch {
        return new Map<string, string>();
    }
};

const writeSavedChatMetadata = (metadata: Map<string, string>) => {
    if (!isBrowser()) return;

    localStorage.setItem(
        getUserScopedKey(SAVED_CHAT_METADATA_PREFIX),
        JSON.stringify(Object.fromEntries(metadata))
    );
};

const readDeletedChatIds = () => {
    if (!isBrowser()) return new Set<string>();

    try {
        const raw = localStorage.getItem(getUserScopedKey(DELETED_CHAT_IDS_PREFIX));
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

const writeDeletedChatIds = (ids: Set<string>) => {
    if (!isBrowser()) return;
    localStorage.setItem(
        getUserScopedKey(DELETED_CHAT_IDS_PREFIX),
        JSON.stringify(Array.from(ids))
    );
};

const markCloudChatDeletedLocally = (chatId: string) => {
    const cleanId = String(chatId || "").trim();
    if (!cleanId) return;

    const deletedIds = readDeletedChatIds();
    deletedIds.add(cleanId);
    writeDeletedChatIds(deletedIds);

    const savedIds = readSavedChatIds();
    savedIds.delete(cleanId);
    writeSavedChatIds(savedIds);

    const savedMetadata = readSavedChatMetadata();
    savedMetadata.delete(cleanId);
    writeSavedChatMetadata(savedMetadata);

    pendingChatSaves.delete(cleanId);
};

const hasAuthError = (value: unknown): boolean => {
    if (!isRecord(value)) return false;

    if (value.auth_error === true) return true;

    const nestedData = value.data;
    if (isRecord(nestedData) && nestedData.auth_error === true) return true;

    const nestedJson = value.json;
    return isRecord(nestedJson) && nestedJson.auth_error === true;
};

const handleCloudAuthError = () => {
    if (!isBrowser()) return;

    localStorage.removeItem("ai_session_token");
    localStorage.removeItem("ai_session_expires_at");

    try {
        sessionStorage.setItem(
            RETURN_AFTER_LOGIN_STORAGE_KEY,
            `${window.location.pathname}${window.location.search}${window.location.hash}`
        );
    } catch {
        // sessionStorage can be unavailable in restricted browser contexts.
    }

    window.dispatchEvent(new Event("ai-session-expired"));
};

const getChatMetadataSignature = (chat: CloudChatPayload) => {
    return JSON.stringify({
        title: String(chat.title || "Новый чат").trim() || "Новый чат",
        mode: getCloudChatUiMode(chat.mode),
        selected_models: normalizeSelectedModels(chat.selected_models),
    });
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
        let data: unknown = null;

        if (raw.trim()) {
            try {
                data = JSON.parse(raw) as unknown;
            } catch {
                data = { success: true };
            }
        } else {
            data = { success: true };
        }

        if (hasAuthError(data)) {
            handleCloudAuthError();
        }

        if (!response.ok) return null;
        return data;
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

const unwrapRequiredList = (value: unknown, key: "chats" | "messages") => {
    if (Array.isArray(value)) return value;

    if (isRecord(value)) {
        const direct = value[key];
        if (Array.isArray(direct)) return direct;

        const data = value.data;
        if (Array.isArray(data)) return data;
        if (isRecord(data) && Array.isArray(data[key])) return data[key];
    }

    return null;
};

const normalizeCloudChat = (value: unknown): CloudChatSession | null => {
    if (!isRecord(value)) return null;

    const id = String(value.id || value.chat_id || "").trim();
    if (!id) return null;

    const title = String(value.title || "Новый чат").trim() || "Новый чат";
    const mode = getCloudChatUiMode(String(value.mode || "chat"));
    const updatedAt = Number(value.updatedAt || value.updated_at || value.created_at || 0);
    const selectedModels = normalizeSelectedModels(
        value.selected_models || value.selectedModels
    );

    return {
        id,
        title,
        mode,
        selected_models: selectedModels,
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
        model: String(value.model || value.model_id || "").trim() || undefined,
        model_id: String(value.model || value.model_id || "").trim() || undefined,
        model_display_name:
            String(value.model_display_name || value.model || value.model_id || "").trim() ||
            undefined,
        provider: String(value.provider || "").trim() || undefined,
        attached_file_name:
            String(value.file_name || value.attached_file_name || "").trim() || undefined,
    };
};

export const getCloudChats = async (): Promise<CloudChatSession[] | null> => {
    const deletedIds = readDeletedChatIds();
    const data = await postChatHistory({ action: "get_chats" });
    if (data === null) return null;

    const chatList = unwrapRequiredList(data, "chats");
    if (chatList === null) return null;

    return chatList
        .map(normalizeCloudChat)
        .filter((item): item is CloudChatSession => Boolean(item))
        .filter((item) => !deletedIds.has(item.id));
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
    if (!cleanId || readDeletedChatIds().has(cleanId)) return;

    const savedIds = readSavedChatIds();
    const savedMetadata = readSavedChatMetadata();
    const metadataSignature = getChatMetadataSignature(chat);
    if (
        pendingChatSaves.has(cleanId) ||
        (savedIds.has(cleanId) && savedMetadata.get(cleanId) === metadataSignature)
    ) {
        return;
    }

    pendingChatSaves.add(cleanId);
    const data = await postChatHistory({
        action: "save_chat",
        chat: {
            id: cleanId,
            title: String(chat.title || "Новый чат").trim() || "Новый чат",
            mode: getCloudChatUiMode(chat.mode),
            selected_models: normalizeSelectedModels(chat.selected_models),
        },
    });

    pendingChatSaves.delete(cleanId);

    if (data !== null) {
        savedIds.add(cleanId);
        savedMetadata.set(cleanId, metadataSignature);
        writeSavedChatIds(savedIds);
        writeSavedChatMetadata(savedMetadata);
    }
};

export const deleteCloudChat = async (chatId: string) => {
    const cleanId = String(chatId || "").trim();
    if (!cleanId) return false;

    markCloudChatDeletedLocally(cleanId);
    console.log("delete_chat request", cleanId);

    const data = await postChatHistory({
        action: "delete_chat",
        chat_id: cleanId,
    });

    console.log("delete_chat response", data);

    if (hasAuthError(data)) {
        handleCloudAuthError();
    }

    return data !== null;
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

const persistCloudChatUiSettings = (chat: CloudChatSession) => {
    const selectedModels = normalizeSelectedModels(chat.selected_models);
    if (!chat.id || (!chat.mode && selectedModels.length === 0)) return;

    writeSessionUiSettings(chat.id, {
        activeMode: getCloudChatActiveMode(chat.mode),
        uiMode: getCloudChatUiMode(chat.mode),
        ...(selectedModels.length > 0
            ? {
                  parallelCount: selectedModels.length,
                  selectedModels,
                  selectedModel: selectedModels[0] || "",
              }
            : {}),
    });
};

export const inferSelectedModelsFromMessages = (
    messages: CloudChatMessage[]
): string[] => {
    const result: string[] = [];

    [...messages].reverse().forEach((message) => {
        const modelId = String(message.model || message.model_id || "").trim();
        if (modelId && !result.includes(modelId)) {
            result.push(modelId);
        }
    });

    return result;
};

export const mergeCloudChatsIntoLocal = <T extends CloudChatSession>(
    localSessions: T[],
    cloudSessions: CloudChatSession[]
): T[] => {
    const deletedIds = readDeletedChatIds();
    const localById = new Map<string, T>();

    localSessions.forEach((session) => {
        if (!deletedIds.has(session.id)) {
            localById.set(session.id, session);
        }
    });

    const reconciledSessions = cloudSessions
        .filter((cloudSession) => !deletedIds.has(cloudSession.id))
        .map((cloudSession) => {
            const existing = localById.get(cloudSession.id);
            const cloudSelectedModels = normalizeSelectedModels(
                cloudSession.selected_models
            );
            const existingSelectedModels = normalizeSelectedModels(
                existing?.selected_models
            );
            const nextSession = {
                ...(existing || {}),
                ...cloudSession,
                messages: existing?.messages || cloudSession.messages || [],
                title: cloudSession.title || existing?.title || "Новый чат",
                mode: cloudSession.mode || existing?.mode,
                selected_models: cloudSelectedModels.length
                    ? cloudSelectedModels
                    : existingSelectedModels,
                updatedAt: cloudSession.updatedAt || existing?.updatedAt || Date.now(),
            } as T;

            persistCloudChatUiSettings(nextSession);
            markCloudChatSaved(cloudSession.id);
            return nextSession;
        });

    const cloudIds = new Set(reconciledSessions.map((session) => session.id));
    const savedIds = readSavedChatIds();
    const savedMetadata = readSavedChatMetadata();

    Array.from(savedIds).forEach((id) => {
        if (!cloudIds.has(id)) {
            savedIds.delete(id);
            savedMetadata.delete(id);
        }
    });

    writeSavedChatIds(savedIds);
    writeSavedChatMetadata(savedMetadata);

    return reconciledSessions.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
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

    const mergedMessages = Array.from(byId.values());
    const selectedModels = normalizeSelectedModels(session.selected_models);
    const inferredSelectedModels = selectedModels.length
        ? selectedModels
        : inferSelectedModelsFromMessages(mergedMessages);

    return {
        ...session,
        selected_models: inferredSelectedModels,
        messages: mergedMessages,
    };
};

export const syncCloudChatsToLocalStorage = async () => {
    if (!isBrowser()) return false;

    const cloudSessions = await getCloudChats();
    if (cloudSessions === null) return false;

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

    return true;
};
