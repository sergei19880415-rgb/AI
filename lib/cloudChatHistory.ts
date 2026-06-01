import { writeSessionUiSettings } from "@/lib/chatUiSettings";
import { getUserScopedKey } from "@/lib/userStorage";

const CHAT_HISTORY_WEBHOOK_URL = "https://tgdomen.ru/webhook/chat-history";
const SAVED_CHAT_IDS_PREFIX = "ai_cloud_saved_chat_ids_";
const SAVED_CHAT_METADATA_PREFIX = "ai_cloud_saved_chat_metadata_";
const DELETED_CHAT_IDS_PREFIX = "ai_cloud_deleted_chat_ids_";
const RETURN_AFTER_LOGIN_STORAGE_KEY = "ai_return_after_login";
const SAVED_MESSAGE_IDS_PREFIX = "ai_cloud_saved_message_ids_";
const GET_CHATS_FOCUS_THROTTLE_MS = 15000;
const CLOUD_CHAT_SESSIONS_UPDATED_EVENT = "ai-chat-sessions-updated";
const CLOUD_CHAT_UPDATED_EVENT = "ai-chat-updated";
const pendingChatSaves = new Map<string, Promise<boolean>>();
const pendingMessageSaves = new Map<string, Promise<boolean>>();
const pendingMessageLoads = new Map<string, Promise<CloudChatMessage[]>>();
const pendingDeletes = new Map<string, Promise<boolean>>();
let pendingChatsLoad: Promise<CloudChatSession[] | null> | null = null;
let lastFocusChatsLoadAt = 0;
const currentSessionSavedChatIds = new Set<string>();

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
        value.map((item) => String(item || "").trim()).filter(Boolean),
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
          .filter(Boolean),
      ),
    ];
  }

  return [];
};

const getCloudChatUiMode = (mode?: string) => {
  const cleanMode = String(mode || "chat")
    .trim()
    .toLowerCase();
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
        : [],
    );
  } catch {
    return new Set<string>();
  }
};

const writeSavedChatIds = (ids: Set<string>) => {
  if (!isBrowser()) return;
  localStorage.setItem(
    getUserScopedKey(SAVED_CHAT_IDS_PREFIX),
    JSON.stringify(Array.from(ids)),
  );
};

const readSavedChatMetadata = () => {
  if (!isBrowser()) return new Map<string, string>();

  try {
    const raw = localStorage.getItem(
      getUserScopedKey(SAVED_CHAT_METADATA_PREFIX),
    );
    const parsed = raw ? JSON.parse(raw) : {};
    if (!isRecord(parsed)) return new Map<string, string>();

    return new Map(
      Object.entries(parsed)
        .map(
          ([id, metadata]) =>
            [String(id || "").trim(), String(metadata || "")] as const,
        )
        .filter(([id]) => Boolean(id)),
    );
  } catch {
    return new Map<string, string>();
  }
};

const writeSavedChatMetadata = (metadata: Map<string, string>) => {
  if (!isBrowser()) return;

  localStorage.setItem(
    getUserScopedKey(SAVED_CHAT_METADATA_PREFIX),
    JSON.stringify(Object.fromEntries(metadata)),
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
        : [],
    );
  } catch {
    return new Set<string>();
  }
};

const writeDeletedChatIds = (ids: Set<string>) => {
  if (!isBrowser()) return;
  localStorage.setItem(
    getUserScopedKey(DELETED_CHAT_IDS_PREFIX),
    JSON.stringify(Array.from(ids)),
  );
};

const readSavedMessageIds = () => {
  if (!isBrowser()) return new Set<string>();

  try {
    const raw = localStorage.getItem(
      getUserScopedKey(SAVED_MESSAGE_IDS_PREFIX),
    );
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(parsed)
        ? parsed.map((item) => String(item || "").trim()).filter(Boolean)
        : [],
    );
  } catch {
    return new Set<string>();
  }
};

const writeSavedMessageIds = (ids: Set<string>) => {
  if (!isBrowser()) return;
  localStorage.setItem(
    getUserScopedKey(SAVED_MESSAGE_IDS_PREFIX),
    JSON.stringify(Array.from(ids)),
  );
};

const getMessageSaveKey = (chatId: string, messageId: string) => {
  return `${chatId}:${messageId}`;
};

const markCloudChatDeletedLocally = (chatId: string) => {
  const cleanId = String(chatId || "").trim();
  if (!cleanId) return;

  const deletedIds = readDeletedChatIds();
  deletedIds.add(cleanId);
  writeDeletedChatIds(deletedIds);

  const savedIds = readSavedChatIds();
  savedIds.delete(cleanId);
  currentSessionSavedChatIds.delete(cleanId);
  writeSavedChatIds(savedIds);

  const savedMetadata = readSavedChatMetadata();
  savedMetadata.delete(cleanId);
  writeSavedChatMetadata(savedMetadata);

  pendingChatSaves.delete(cleanId);
  Array.from(pendingMessageSaves.keys()).forEach((key) => {
    if (key.startsWith(`${cleanId}:`)) pendingMessageSaves.delete(key);
  });
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
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
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
    if (!raw.trim()) return null;

    let data: unknown = null;

    try {
      data = JSON.parse(raw) as unknown;
    } catch {
      return null;
    }

    if (hasAuthError(data)) {
      handleCloudAuthError();
    }

    if (!response.ok || !isRecord(data) || data.ok !== true) return null;
    return data;
  } catch {
    return null;
  }
};

const isSuccessfulCloudResponse = (
  value: unknown,
  expectedAction?: string,
): value is Record<string, unknown> => {
  if (!isRecord(value)) return false;
  if (hasAuthError(value)) return false;
  if (value.ok !== true) return false;
  if (expectedAction && value.action !== expectedAction) return false;
  return true;
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

const reconcileSavedChatIdsFromCloud = (cloudSessions: CloudChatSession[]) => {
  const cloudIds = new Set(
    cloudSessions.map((item) => String(item.id || "").trim()).filter(Boolean),
  );

  currentSessionSavedChatIds.clear();
  cloudIds.forEach((id) => currentSessionSavedChatIds.add(id));
  writeSavedChatIds(cloudIds);

  const savedMetadata = readSavedChatMetadata();
  Array.from(savedMetadata.keys()).forEach((id) => {
    if (!cloudIds.has(id)) savedMetadata.delete(id);
  });
  cloudSessions.forEach((session) => {
    savedMetadata.set(
      session.id,
      getChatMetadataSignature({
        id: session.id,
        title: session.title,
        mode: session.mode || "chat",
        selected_models: session.selected_models,
      }),
    );
  });
  writeSavedChatMetadata(savedMetadata);
};

const normalizeCloudChat = (value: unknown): CloudChatSession | null => {
  if (!isRecord(value)) return null;

  const id = String(value.id || value.chat_id || "").trim();
  if (!id) return null;

  const title = String(value.title || "Новый чат").trim() || "Новый чат";
  const mode = getCloudChatUiMode(String(value.mode || "chat"));
  const updatedAt = Number(
    value.updatedAt || value.updated_at || value.created_at || 0,
  );
  const selectedModels = normalizeSelectedModels(
    value.selected_models || value.selectedModels,
  );

  return {
    id,
    title,
    mode,
    selected_models: selectedModels,
    messages: [],
    updatedAt:
      Number.isFinite(updatedAt) && updatedAt > 0 ? updatedAt : Date.now(),
  };
};

const normalizeRole = (value: unknown): CloudChatMessageRole => {
  const role = String(value || "")
    .trim()
    .toLowerCase();
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
      String(
        value.model_display_name || value.model || value.model_id || "",
      ).trim() || undefined,
    provider: String(value.provider || "").trim() || undefined,
    attached_file_name:
      String(value.file_name || value.attached_file_name || "").trim() ||
      undefined,
  };
};

type GetCloudChatsOptions = {
  force?: boolean;
  source?: "startup" | "focus" | "poll" | "manual";
};

const loadCloudChats = async (): Promise<CloudChatSession[] | null> => {
  const deletedIds = readDeletedChatIds();
  console.log("cloud get_chats");

  const data = await postChatHistory({ action: "get_chats" });
  if (!isSuccessfulCloudResponse(data)) return null;

  const chatList = unwrapRequiredList(data, "chats");
  if (chatList === null) return null;

  const cloudSessions = chatList
    .map(normalizeCloudChat)
    .filter((item): item is CloudChatSession => Boolean(item))
    .filter((item) => !deletedIds.has(item.id));

  reconcileSavedChatIdsFromCloud(cloudSessions);
  return cloudSessions;
};

export const getCloudChats = async (
  options: GetCloudChatsOptions = {},
): Promise<CloudChatSession[] | null> => {
  if (options.source === "focus" && !options.force) {
    const now = Date.now();
    if (now - lastFocusChatsLoadAt < GET_CHATS_FOCUS_THROTTLE_MS) {
      return null;
    }
    lastFocusChatsLoadAt = now;
  }

  if (pendingChatsLoad) {
    if (options.force && options.source === "manual") {
      await pendingChatsLoad;
    } else {
      return pendingChatsLoad;
    }
  }

  pendingChatsLoad = loadCloudChats().finally(() => {
    pendingChatsLoad = null;
  });

  return pendingChatsLoad;
};

export const getCloudMessages = async (chatId: string) => {
  const cleanChatId = String(chatId || "").trim();
  if (!cleanChatId) return [];

  const pendingLoad = pendingMessageLoads.get(cleanChatId);
  if (pendingLoad) return pendingLoad;

  const loadPromise = (async () => {
    console.log("cloud get_messages", cleanChatId);
    const data = await postChatHistory({
      action: "get_messages",
      chat_id: cleanChatId,
    });

    return unwrapList(data, "messages")
      .map(normalizeCloudMessage)
      .filter((item): item is CloudChatMessage => Boolean(item));
  })().finally(() => {
    pendingMessageLoads.delete(cleanChatId);
  });

  pendingMessageLoads.set(cleanChatId, loadPromise);
  return loadPromise;
};

const saveCloudChatPayload = async (chat: CloudChatPayload) => {
  const cleanId = String(chat.id || "").trim();
  if (!cleanId || readDeletedChatIds().has(cleanId)) return false;

  const metadataSignature = getChatMetadataSignature(chat);
  console.log("cloud save_chat", cleanId);

  const data = await postChatHistory({
    action: "save_chat",
    chat: {
      id: cleanId,
      title: String(chat.title || "Новый чат").trim() || "Новый чат",
      mode: getCloudChatUiMode(chat.mode),
      selected_models: normalizeSelectedModels(chat.selected_models),
    },
  });

  if (!isSuccessfulCloudResponse(data, "save_chat")) return false;

  const savedIds = readSavedChatIds();
  const savedMetadata = readSavedChatMetadata();
  savedIds.add(cleanId);
  currentSessionSavedChatIds.add(cleanId);
  savedMetadata.set(cleanId, metadataSignature);
  writeSavedChatIds(savedIds);
  writeSavedChatMetadata(savedMetadata);

  return true;
};

export const ensureCloudChatSaved = async (chat: CloudChatPayload) => {
  const cleanId = String(chat.id || "").trim();
  if (!cleanId || readDeletedChatIds().has(cleanId)) return false;

  const metadataSignature = getChatMetadataSignature({ ...chat, id: cleanId });
  const savedMetadata = readSavedChatMetadata();
  if (
    currentSessionSavedChatIds.has(cleanId) &&
    savedMetadata.get(cleanId) === metadataSignature
  ) {
    return true;
  }

  const pendingSave = pendingChatSaves.get(cleanId);
  if (pendingSave) return pendingSave;

  const savePromise = saveCloudChatPayload(chat).finally(() => {
    pendingChatSaves.delete(cleanId);
  });

  pendingChatSaves.set(cleanId, savePromise);
  return savePromise;
};

export const saveCloudChat = async (chat: CloudChatPayload) => {
  const cleanId = String(chat.id || "").trim();
  if (!cleanId || readDeletedChatIds().has(cleanId)) return false;

  const metadataSignature = getChatMetadataSignature({ ...chat, id: cleanId });
  const savedMetadata = readSavedChatMetadata();
  if (
    currentSessionSavedChatIds.has(cleanId) &&
    savedMetadata.get(cleanId) === metadataSignature
  ) {
    return true;
  }

  const pendingSave = pendingChatSaves.get(cleanId);
  if (pendingSave) return pendingSave;

  const savePromise = saveCloudChatPayload(chat).finally(() => {
    pendingChatSaves.delete(cleanId);
  });

  pendingChatSaves.set(cleanId, savePromise);
  return savePromise;
};

export const deleteCloudChat = async (chatId: string) => {
  const cleanId = String(chatId || "").trim();
  if (!cleanId) return false;

  markCloudChatDeletedLocally(cleanId);

  const pendingDelete = pendingDeletes.get(cleanId);
  if (pendingDelete) return pendingDelete;

  const deletePromise = (async () => {
    console.log("cloud delete_chat", cleanId);

    const data = await postChatHistory({
      action: "delete_chat",
      chat_id: cleanId,
    });

    if (hasAuthError(data)) {
      handleCloudAuthError();
    }

    return isSuccessfulCloudResponse(data, "delete_chat");
  })().finally(() => {
    pendingDeletes.delete(cleanId);
  });

  pendingDeletes.set(cleanId, deletePromise);
  return deletePromise;
};

export const markCloudChatSaved = (chatId: string) => {
  const cleanId = String(chatId || "").trim();
  if (!cleanId) return;

  const savedIds = readSavedChatIds();
  savedIds.add(cleanId);
  currentSessionSavedChatIds.add(cleanId);
  writeSavedChatIds(savedIds);
};

export const saveCloudMessage = async (
  message: CloudMessagePayload,
  chat?: CloudChatPayload,
) => {
  const cleanChatId = String(message.chat_id || "").trim();
  const cleanMessageId = String(message.id || "").trim();
  if (!cleanChatId || !cleanMessageId) return false;

  const messageSaveKey = getMessageSaveKey(cleanChatId, cleanMessageId);
  const savedMessageIds = readSavedMessageIds();
  if (savedMessageIds.has(messageSaveKey)) return true;

  const pendingMessageSave = pendingMessageSaves.get(messageSaveKey);
  if (pendingMessageSave) return pendingMessageSave;

  const savePromise = (async () => {
    if (chat) {
      const isChatSaved = await ensureCloudChatSaved({
        ...chat,
        id: cleanChatId,
      });
      if (!isChatSaved) return false;
    } else if (!currentSessionSavedChatIds.has(cleanChatId)) {
      return false;
    }

    console.log("cloud save_message", cleanMessageId);

    const data = await postChatHistory({
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

    const saved = isSuccessfulCloudResponse(data, "save_message");
    if (saved) {
      const latestSavedMessageIds = readSavedMessageIds();
      latestSavedMessageIds.add(messageSaveKey);
      writeSavedMessageIds(latestSavedMessageIds);
    }

    return saved;
  })().finally(() => {
    pendingMessageSaves.delete(messageSaveKey);
  });

  pendingMessageSaves.set(messageSaveKey, savePromise);
  return savePromise;
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
  messages: CloudChatMessage[],
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

export const replaceLocalChatsWithCloud = <T extends CloudChatSession>(
  localSessions: T[],
  cloudSessions: CloudChatSession[],
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
        cloudSession.selected_models,
      );
      const existingSelectedModels = normalizeSelectedModels(
        existing?.selected_models,
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

  return reconciledSessions.sort(
    (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0),
  );
};

export const mergeCloudMessagesIntoSession = <T extends CloudChatSession>(
  session: T,
  cloudMessages: CloudChatMessage[],
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

type SyncCloudChatsOptions = GetCloudChatsOptions;

export const syncCloudChatsToLocalStorage = async (
  options: SyncCloudChatsOptions = {},
) => {
  if (!isBrowser()) return false;

  const cloudSessions = await getCloudChats(options);
  if (cloudSessions === null) return false;

  let localSessions: CloudChatSession[] = [];

  try {
    const raw = localStorage.getItem(getUserScopedKey("ai_sessions_"));
    const parsed = raw ? JSON.parse(raw) : [];
    localSessions = Array.isArray(parsed) ? parsed : [];
  } catch {
    localSessions = [];
  }

  const nextSessions = replaceLocalChatsWithCloud(localSessions, cloudSessions);
  localStorage.setItem(
    getUserScopedKey("ai_sessions_"),
    JSON.stringify(nextSessions),
  );

  const currentSessionKey = getUserScopedKey("ai_current_session_");
  const currentSessionId = localStorage.getItem(currentSessionKey) || "";
  if (
    currentSessionId &&
    !nextSessions.some((item) => item.id === currentSessionId)
  ) {
    const nextCurrentSessionId = nextSessions[0]?.id || "";
    if (nextCurrentSessionId) {
      localStorage.setItem(currentSessionKey, nextCurrentSessionId);
    } else {
      localStorage.removeItem(currentSessionKey);
    }
  }

  window.dispatchEvent(new Event(CLOUD_CHAT_SESSIONS_UPDATED_EVENT));
  window.dispatchEvent(new Event(CLOUD_CHAT_UPDATED_EVENT));

  return true;
};
