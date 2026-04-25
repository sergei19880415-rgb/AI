"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type DragEvent,
    type KeyboardEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
} from "@headlessui/react";
import TextareaAutosize from "react-textarea-autosize";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import Select from "@/components/Select";
import ChatFeatures from "./ChatFeatures";
import Audio from "./Audio";
import Voice from "./Voice";
import Time from "./Time";
import CloseLine from "./CloseLine";
import RecreateVideo from "./RecreateVideo";
import {
    applySessionUiSettingsToLegacyKeys,
    clearSessionAttachedFileContext,
    readSessionUiSettings,
    writeSessionUiSettings,
} from "@/lib/chatUiSettings";

const WEBHOOK_URL =
    "https://tgdomen.ru/webhook/3bcfce39-4b24-4493-b3a7-cab0030e8a36";
const FILE_UPLOAD_WEBHOOK_URL = "https://tgdomen.ru/webhook/file-upload";

const FALLBACK_MODEL = "gpt-5-nano";
const SUMMARY_MODEL_ID = "summary";
const SUMMARY_MODEL_LABEL = "✨ Саммари";
const CHAT_DRAFT_STORAGE_KEY = "ai_chat_draft_message";
const RETURN_AFTER_LOGIN_STORAGE_KEY = "ai_return_after_login";

type ChatMode = "chat" | "search" | "image" | "video";

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    isLoading?: boolean;
    model_id?: string;
    model_display_name?: string;
    attached_file_name?: string;
    attached_file_mime_type?: string;
};

type ChatSession = {
    id: string;
    title: string;
    messages: ChatMessage[];
    updatedAt: number;
};

type ModelMode = "text" | "image";

type ModelCatalogItem = {
    model_id: string;
    display_name?: string;
    provider?: string;
    group_order?: number;
    model_order?: number;
    input_price_per_1m?: number | null;
    output_price_per_1m?: number | null;
    is_active?: boolean;
    mode_type?: ModelMode | string;
    allowed_qualities?: string[] | string;
    default_quality?: string;
    allowed_sizes?: string[] | string;
    default_size?: string;
};

type VisibleModelInfo = {
    modelId: string;
    displayName: string;
    provider: string;
    modeType: ModelMode;
    allowedQualities: string[];
    defaultQuality: string;
    allowedSizes: string[];
    defaultSize: string;
};

type SummaryAnswer = {
    provider: string;
    model: string;
    text: string;
};

type ParsedWebhookResponse = {
    text: string;
    authError: boolean;
    modelAccessError: boolean;
};

type ParsedFileUploadResponse = {
    success: boolean;
    authError: boolean;
    message: string;
};

type ImageOptionState = {
    quality: string;
    size: string;
};

type FilePreviewMeta = {
    icon: string;
    iconClassName: string;
    badge: string;
};

const getFileExtension = (fileName: string) => {
    const normalized = String(fileName || "").trim().toLowerCase();
    if (!normalized.includes(".")) return "";
    return normalized.split(".").pop() || "";
};

const getFilePreviewMeta = (
    fileName: string,
    mimeType?: string
): FilePreviewMeta => {
    const ext = getFileExtension(fileName);
    const normalizedMimeType = String(mimeType || "").trim().toLowerCase();

    if (ext === "pdf" || normalizedMimeType === "application/pdf") {
        return { icon: "box-fill", iconClassName: "fill-red-500", badge: "PDF" };
    }

    if (
        ext === "doc" ||
        ext === "docx" ||
        normalizedMimeType === "application/msword" ||
        normalizedMimeType.includes(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    ) {
        return { icon: "copy", iconClassName: "fill-blue-500", badge: "DOC" };
    }

    if (
        ext === "xls" ||
        ext === "xlsx" ||
        normalizedMimeType === "application/vnd.ms-excel" ||
        normalizedMimeType.includes(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    ) {
        return { icon: "toggle", iconClassName: "fill-emerald-500", badge: "XLS" };
    }

    if (
        ["png", "jpg", "jpeg", "webp"].includes(ext) ||
        normalizedMimeType.startsWith("image/")
    ) {
        return { icon: "gallery-fill", iconClassName: "fill-violet-500", badge: "IMG" };
    }

    return { icon: "folders", iconClassName: "fill-gray-500", badge: "FILE" };
};

const getUserEmail = () => {
    if (typeof window === "undefined") return "";
    return (localStorage.getItem("ai_user_email") || "")
        .toString()
        .trim()
        .toLowerCase();
};

const getSessionToken = () => {
    if (typeof window === "undefined") return "";
    return (localStorage.getItem("ai_session_token") || "").toString().trim();
};

const getUserStorageKey = () => {
    return getUserEmail() || "unauthorized";
};

const requireUserEmail = () => {
    const email = getUserEmail();

    if (email) {
        return email;
    }

    window.alert("Сессия не найдена. Войди в аккаунт заново.");
    return null;
};

const requireSessionToken = () => {
    const token = getSessionToken();

    if (token) {
        return token;
    }

    window.alert("Сессия авторизации не найдена. Войди в аккаунт заново.");
    return null;
};

const getSessionsKey = () => {
    return `ai_sessions_${getUserStorageKey()}`;
};

const getCurrentSessionKey = () => {
    return `ai_current_session_${getUserStorageKey()}`;
};

const getSelectedModelKey = () => {
    return `ai_selected_model_${getUserStorageKey()}`;
};

const getSelectedModelsKey = () => {
    return `ai_selected_models_${getUserStorageKey()}`;
};

const getParallelCountKey = () => {
    return `ai_parallel_count_${getUserStorageKey()}`;
};

const getActiveModeKey = () => {
    return `ai_active_mode_${getUserStorageKey()}`;
};

const getUiModeKey = () => {
    return `ai_ui_mode_${getUserStorageKey()}`;
};

const normalizePositiveInt = (value: unknown, fallback: number) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 1) return fallback;
    return Math.floor(num);
};

const readSessions = (): ChatSession[] => {
    try {
        const raw = localStorage.getItem(getSessionsKey());
        if (!raw) return [];

        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as ChatSession[]) : [];
    } catch {
        return [];
    }
};

const saveSessions = (sessions: ChatSession[]) => {
    localStorage.setItem(getSessionsKey(), JSON.stringify(sessions));
    window.dispatchEvent(new Event("ai-chat-sessions-updated"));
    window.dispatchEvent(new Event("ai-chat-updated"));
};

const getSessionTitleFromText = (text: string) => {
    const clean = text.trim();
    if (!clean) return "Новый чат";
    return clean.length > 60 ? `${clean.slice(0, 60)}...` : clean;
};

const getModelsCatalog = (): ModelCatalogItem[] => {
    try {
        const raw = localStorage.getItem("ai_models_catalog");
        if (!raw) return [];

        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as ModelCatalogItem[]) : [];
    } catch {
        return [];
    }
};

const getAllowedModels = (): string[] => {
    const fromCatalog = getModelsCatalog()
        .map((item) => String(item?.model_id || "").trim())
        .filter(Boolean);

    if (fromCatalog.length > 0) {
        return fromCatalog;
    }

    return (localStorage.getItem("ai_allowed_models") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
};

const readSelectedModels = (): string[] => {
    try {
        const raw = localStorage.getItem(getSelectedModelsKey());
        if (raw) {
            const parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed
                    .map((item) => String(item || "").trim())
                    .filter(Boolean);
            }
        }
    } catch {
        // ignore
    }

    const single = (localStorage.getItem(getSelectedModelKey()) || "").trim();
    return single ? [single] : [];
};

const normalizeModeType = (value: unknown): ModelMode => {
    return String(value || "text").trim().toLowerCase() === "image"
        ? "image"
        : "text";
};

const normalizeStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value
            .map((item) => String(item || "").trim())
            .filter(Boolean);
    }

    return String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
};

const getUniqueOptionValues = (
    values: string[],
    fallbackValue?: string,
    hardFallback?: string
) => {
    const result = [...values];
    const normalizedFallback = String(fallbackValue || "").trim();
    const normalizedHardFallback = String(hardFallback || "").trim();

    if (normalizedFallback && !result.includes(normalizedFallback)) {
        result.unshift(normalizedFallback);
    }

    if (result.length === 0 && normalizedHardFallback) {
        result.push(normalizedHardFallback);
    }

    return [...new Set(result)];
};

const getVisibleModels = (
    requestedMode: ModelMode = "text"
): VisibleModelInfo[] => {
    const catalog = getModelsCatalog();

    const catalogMap = new Map(
        catalog
            .map((item) => [String(item.model_id || "").trim(), item] as const)
            .filter(([modelId]) => Boolean(modelId))
    );

    const parallelCount = normalizePositiveInt(
        localStorage.getItem(getParallelCountKey()),
        1
    );

    const selected = [...new Set(readSelectedModels())];

    const availableForMode = catalog
        .filter((item) => normalizeModeType(item.mode_type) === requestedMode)
        .map((item) => String(item.model_id || "").trim())
        .filter(Boolean);

    const selectedForMode = selected
        .filter((modelId) => {
            const info = catalogMap.get(modelId);
            return info && normalizeModeType(info.mode_type) === requestedMode;
        })
        .slice(0, parallelCount);

    const fallbackModelIds =
        selectedForMode.length > 0
            ? selectedForMode
            : availableForMode.slice(
                  0,
                  requestedMode === "image" ? 1 : parallelCount
              );

    return fallbackModelIds.map((modelId, index) => {
        const info = catalogMap.get(modelId);

        const allowedQualities = normalizeStringArray(info?.allowed_qualities);
        const allowedSizes = normalizeStringArray(info?.allowed_sizes);

        const defaultQuality =
            String(info?.default_quality || "").trim() ||
            allowedQualities[0] ||
            "low";

        const defaultSize =
            String(info?.default_size || "").trim() ||
            allowedSizes[0] ||
            "1024x1024";

        return {
            modelId,
            displayName:
                info?.display_name?.trim() || modelId || `Модель ${index + 1}`,
            provider: info?.provider?.trim() || "AI",
            modeType: normalizeModeType(info?.mode_type),
            allowedQualities,
            defaultQuality,
            allowedSizes,
            defaultSize,
        };
    });
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const readTextField = (value: unknown, field: string): string | null => {
    if (!isRecord(value)) return null;

    const fieldValue = value[field];

    if (
        typeof fieldValue === "string" ||
        typeof fieldValue === "number" ||
        typeof fieldValue === "boolean"
    ) {
        return String(fieldValue);
    }

    return null;
};

const extractAnswerText = (value: unknown): string | null => {
    const directAnswer = readTextField(value, "answer");
    if (directAnswer) return directAnswer;

    const directText = readTextField(value, "text");
    if (directText) return directText;

    const directMessage = readTextField(value, "message");
    if (directMessage) return directMessage;

    if (isRecord(value)) {
        const nestedJson = value.json;

        const nestedAnswer = readTextField(nestedJson, "answer");
        if (nestedAnswer) return nestedAnswer;

        const nestedText = readTextField(nestedJson, "text");
        if (nestedText) return nestedText;
    }

    return null;
};

const extractAuthError = (value: unknown): boolean => {
    if (!isRecord(value)) return false;

    const direct = value.auth_error;
    if (typeof direct === "boolean") return direct;

    const nestedJson = value.json;
    if (!isRecord(nestedJson)) return false;

    const nested = nestedJson.auth_error;
    return typeof nested === "boolean" ? nested : false;
};

const extractModelAccessError = (value: unknown): boolean => {
    if (!isRecord(value)) return false;

    const direct = value.model_access_error;
    if (typeof direct === "boolean") return direct;

    const nestedData = value.data;
    if (isRecord(nestedData)) {
        const nestedDataFlag = nestedData.model_access_error;
        if (typeof nestedDataFlag === "boolean") return nestedDataFlag;
    }

    const nestedJson = value.json;
    if (!isRecord(nestedJson)) return false;

    const nestedJsonDirect = nestedJson.model_access_error;
    if (typeof nestedJsonDirect === "boolean") return nestedJsonDirect;

    const nestedJsonData = nestedJson.data;
    if (!isRecord(nestedJsonData)) return false;

    const nestedJsonDataFlag = nestedJsonData.model_access_error;
    return typeof nestedJsonDataFlag === "boolean" ? nestedJsonDataFlag : false;
};

const normalizeUploadPayload = (value: unknown): unknown => {
    const directPayload = Array.isArray(value) ? value[0] : value;

    if (!isRecord(directPayload)) {
        return directPayload;
    }

    const nestedData = directPayload.data;

    if (isRecord(nestedData) || Array.isArray(nestedData)) {
        return Array.isArray(nestedData) ? nestedData[0] : nestedData;
    }

    return directPayload;
};

const extractSuccessFlag = (value: unknown): boolean | null => {
    if (!isRecord(value)) return null;

    const direct = value.success;
    if (typeof direct === "boolean") return direct;

    const nestedJson = value.json;
    if (!isRecord(nestedJson)) return null;

    const nested = nestedJson.success;
    return typeof nested === "boolean" ? nested : null;
};

const extractUploadMessage = (value: unknown): string => {
    if (!isRecord(value)) return "";

    return (
        readTextField(value, "message") ||
        readTextField(value, "text") ||
        readTextField(value, "answer") ||
        ""
    );
};

const parseFileUploadResponse = (
    raw: string,
    status: number,
    responseOk: boolean
): ParsedFileUploadResponse => {
    const fallbackMessage = raw.trim() || `Ошибка загрузки файла. status=${status}`;
    const trimmed = raw.trim();

    if (!trimmed) {
        return {
            success: false,
            authError: false,
            message: fallbackMessage || "Пустой ответ от сервера загрузки файла",
        };
    }

    try {
        let data: unknown = JSON.parse(trimmed);

        if (typeof data === "string") {
            try {
                data = JSON.parse(data) as unknown;
            } catch {
                return {
                    success: responseOk,
                    authError: false,
                    message: data,
                };
            }
        }

        const payload = normalizeUploadPayload(data);
        const authError = extractAuthError(payload) || extractAuthError(data);
        const successFlag =
            extractSuccessFlag(payload) ?? extractSuccessFlag(data) ?? false;
        const extractedMessage =
            extractUploadMessage(payload) || extractUploadMessage(data);

        return {
            success: Boolean(responseOk) && successFlag === true,
            authError,
            message: extractedMessage || fallbackMessage,
        };
    } catch {
        return {
            success: responseOk,
            authError: false,
            message: fallbackMessage,
        };
    }
};

const isUsableAssistantMessage = (item: ChatMessage) => {
    if (item.role !== "assistant") return false;
    if (item.isLoading) return false;

    const text = item.content.trim();
    if (!text) return false;
    if (text === "Печатает...") return false;
    if (text === "Ответ остановлен") return false;
    if (text.startsWith("Ошибка сети")) return false;
    if (text.startsWith("Ошибка сервера")) return false;

    return true;
};

const buildSummaryData = (
    messages: ChatMessage[],
    visibleModels: VisibleModelInfo[]
): { userQuery: string; answers: SummaryAnswer[] } | null => {
    const cleanMessages = messages.filter((item) => !item.isLoading);
    const lastUserIndex = [...cleanMessages]
        .map((item) => item.role)
        .lastIndexOf("user");

    if (lastUserIndex === -1) return null;

    const lastUserMessage = cleanMessages[lastUserIndex];
    const modelMap = new Map(
        visibleModels.map((item) => [item.modelId, item] as const)
    );

    const answers = cleanMessages
        .slice(lastUserIndex + 1)
        .filter(isUsableAssistantMessage)
        .map((item) => {
            const info = item.model_id ? modelMap.get(item.model_id) : undefined;
            return {
                provider: info?.provider || "AI",
                model:
                    item.model_display_name ||
                    info?.displayName ||
                    item.model_id ||
                    "Модель",
                text: item.content.trim(),
            };
        })
        .filter((item) => item.text);

    if (answers.length === 0) return null;

    return {
        userQuery: lastUserMessage.content.trim(),
        answers,
    };
};

const PanelMessage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionIdFromUrl = searchParams.get("id") || "";
    const abortControllersRef = useRef<AbortController[]>([]);
    const summaryAbortControllerRef = useRef<AbortController | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const [message, setMessage] = useState("");
    const [generateVideo, setGenerateVideo] = useState(false);
    const [activeMode, setActiveMode] = useState<ChatMode>("chat");
    const [isSending, setIsSending] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [isFileDragActive, setIsFileDragActive] = useState(false);
    const [attachedFileName, setAttachedFileName] = useState("");
    const [attachedFileMimeType, setAttachedFileMimeType] = useState("");
    const [attachedFileError, setAttachedFileError] = useState("");
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [summaryText, setSummaryText] = useState("");
    const [catalogVersion, setCatalogVersion] = useState(0);
    const [sessionExpiredModalOpen, setSessionExpiredModalOpen] = useState(false);
    const [modelAccessModalOpen, setModelAccessModalOpen] = useState(false);
    const [imageOptionsByModel, setImageOptionsByModel] = useState<
        Record<string, ImageOptionState>
    >({});

    useEffect(() => {
        if (typeof window === "undefined") return;

        const savedDraft = sessionStorage.getItem(CHAT_DRAFT_STORAGE_KEY) || "";
        if (!savedDraft.trim()) return;

        setMessage(savedDraft);
        sessionStorage.removeItem(CHAT_DRAFT_STORAGE_KEY);
    }, []);

    useEffect(() => {
        if (!sessionIdFromUrl) return;

        const resolvedSettings = applySessionUiSettingsToLegacyKeys(sessionIdFromUrl);
        const nextUiMode = String(resolvedSettings.uiMode || "chat")
            .trim()
            .toLowerCase();

        setActiveMode(
            nextUiMode === "image"
                ? "image"
                : nextUiMode === "video"
                  ? "video"
                  : "chat"
        );
        setGenerateVideo(nextUiMode === "video");
        setImageOptionsByModel(
            readSessionUiSettings(sessionIdFromUrl)?.imageOptionsByModel || {}
        );
        setAttachedFileName(resolvedSettings.attachedFileName || "");
        setAttachedFileMimeType(resolvedSettings.attachedFileMimeType || "");
        setAttachedFileError("");
        setCatalogVersion((value) => value + 1);
    }, [sessionIdFromUrl]);

    useEffect(() => {
        const headerMode = activeMode === "image" ? "image" : "text";
        const uiMode =
            activeMode === "image"
                ? "image"
                : activeMode === "video"
                ? "video"
                : "chat";

        localStorage.setItem(getActiveModeKey(), headerMode);
        localStorage.setItem(getUiModeKey(), uiMode);
        writeSessionUiSettings(sessionIdFromUrl, {
            activeMode: headerMode,
            uiMode,
        });
        window.dispatchEvent(new Event("ai-active-mode-updated"));
    }, [activeMode, sessionIdFromUrl]);

    useEffect(() => {
        writeSessionUiSettings(sessionIdFromUrl, {
            imageOptionsByModel,
        });
    }, [imageOptionsByModel, sessionIdFromUrl]);

    useEffect(() => {
        const handleUpdate = () => {
            setCatalogVersion((value) => value + 1);
        };

        window.addEventListener("ai-models-catalog-updated", handleUpdate);
        window.addEventListener("ai-selected-model-updated", handleUpdate);
        window.addEventListener("ai-selected-models-updated", handleUpdate);

        return () => {
            window.removeEventListener("ai-models-catalog-updated", handleUpdate);
            window.removeEventListener("ai-selected-model-updated", handleUpdate);
            window.removeEventListener("ai-selected-models-updated", handleUpdate);
        };
    }, []);

    useEffect(() => {
        const handleEditRequest = (event: Event) => {
            const detail = (event as CustomEvent<{ content?: string }>).detail;
            const nextContent = String(detail?.content || "").trim();
            if (!nextContent) return;

            setMessage(nextContent);
            requestAnimationFrame(() => textareaRef.current?.focus());
        };

        window.addEventListener("ai-message-edit-request", handleEditRequest);

        return () => {
            window.removeEventListener(
                "ai-message-edit-request",
                handleEditRequest
            );
        };
    }, []);

    const visibleModels = useMemo(() => {
        void catalogVersion;
        return getVisibleModels(activeMode === "image" ? "image" : "text");
    }, [activeMode, catalogVersion]);

    const activeImageModel = activeMode === "image" ? visibleModels[0] : null;

    const imageQualityValues = useMemo(
        () =>
            activeImageModel
                ? getUniqueOptionValues(
                      activeImageModel.allowedQualities,
                      activeImageModel.defaultQuality,
                      "low"
                  )
                : [],
        [activeImageModel]
    );

    const imageSizeValues = useMemo(
        () =>
            activeImageModel
                ? getUniqueOptionValues(
                      activeImageModel.allowedSizes,
                      activeImageModel.defaultSize,
                      "1024x1024"
                  )
                : [],
        [activeImageModel]
    );

    useEffect(() => {
        if (!activeImageModel) return;

        setImageOptionsByModel((current) => {
            const currentValue = current[activeImageModel.modelId];
            const nextQuality = imageQualityValues.includes(currentValue?.quality)
                ? currentValue.quality
                : imageQualityValues[0] || activeImageModel.defaultQuality;
            const nextSize = imageSizeValues.includes(currentValue?.size)
                ? currentValue.size
                : imageSizeValues[0] || activeImageModel.defaultSize;

            if (
                currentValue?.quality === nextQuality &&
                currentValue?.size === nextSize
            ) {
                return current;
            }

            return {
                ...current,
                [activeImageModel.modelId]: {
                    quality: nextQuality,
                    size: nextSize,
                },
            };
        });
    }, [activeImageModel, imageQualityValues, imageSizeValues]);

    const selectedImageOptions = activeImageModel
        ? imageOptionsByModel[activeImageModel.modelId]
        : null;

    const parseResponseText = (
        raw: string,
        status: number
    ): ParsedWebhookResponse => {
        const trimmed = raw.trim();

        if (!trimmed) {
            return {
                text: `Пустое тело ответа. status=${status}`,
                authError: false,
                modelAccessError: false,
            };
        }

        try {
            let data: unknown = JSON.parse(trimmed);

            if (typeof data === "string") {
                try {
                    data = JSON.parse(data) as unknown;
                } catch {
                    return {
                        text: typeof data === "string" ? data : String(data),
                        authError: false,
                        modelAccessError: false,
                    };
                }
            }

            if (Array.isArray(data)) {
                const first = data[0];
                const authError = extractAuthError(first);
                const modelAccessError = extractModelAccessError(first);

                if (typeof first === "string") {
                    return { text: first, authError, modelAccessError };
                }

                const extracted = extractAnswerText(first);
                if (extracted) return { text: extracted, authError, modelAccessError };

                return {
                    text: JSON.stringify(first, null, 2),
                    authError,
                    modelAccessError,
                };
            }

            if (isRecord(data)) {
                const authError = extractAuthError(data);
                const modelAccessError = extractModelAccessError(data);
                const extracted = extractAnswerText(data);
                if (extracted) return { text: extracted, authError, modelAccessError };

                return {
                    text: JSON.stringify(data, null, 2),
                    authError,
                    modelAccessError,
                };
            }

            return { text: String(data), authError: false, modelAccessError: false };
        } catch {
            return { text: trimmed, authError: false, modelAccessError: false };
        }
    };

    const getCurrentSession = () => {
        const sessions = readSessions();

        const currentSession =
            sessions.find((item) => item.id === sessionIdFromUrl) ||
            sessions.find(
                (item) => item.id === localStorage.getItem(getCurrentSessionKey())
            );

        return { sessions, currentSession };
    };

    const ensureCurrentSession = () => {
        const { sessions, currentSession } = getCurrentSession();

        if (currentSession) {
            return currentSession;
        }

        const nextSession = {
            id: crypto.randomUUID(),
            title: "Новый чат",
            messages: [],
            updatedAt: Date.now(),
        };

        saveSessions([nextSession, ...sessions]);
        localStorage.setItem(getCurrentSessionKey(), nextSession.id);
        window.history.replaceState({}, "", `/chat?id=${nextSession.id}`);

        return nextSession;
    };

    const uploadFile = async (file?: File | null) => {
        if (!file) return;

        setAttachedFileError("");
        setIsUploadingFile(true);

        try {
            const currentUser = requireUserEmail();
            if (!currentUser) return;
            const sessionToken = requireSessionToken();
            if (!sessionToken) return;

            const currentSession = ensureCurrentSession();
            const formData = new FormData();

            formData.append("session_id", currentSession.id);
            formData.append("user_email", currentUser);
            formData.append("session_token", sessionToken);
            formData.append("data", file);

            const response = await fetch(FILE_UPLOAD_WEBHOOK_URL, {
                method: "POST",
                body: formData,
            });
            const raw = await response.text();
            const uploadResponse = parseFileUploadResponse(
                raw,
                response.status,
                response.ok
            );

            if (uploadResponse.authError) {
                localStorage.removeItem("ai_session_token");
                localStorage.removeItem("ai_session_expires_at");
                setAttachedFileName("");
                setAttachedFileMimeType("");
                writeSessionUiSettings(currentSession.id, {
                    attachedFileName: "",
                    attachedFileMimeType: "",
                });
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                setSessionExpiredModalOpen(true);
                throw new Error(uploadResponse.message);
            }

            if (!uploadResponse.success) {
                setAttachedFileName("");
                setAttachedFileMimeType("");
                writeSessionUiSettings(currentSession.id, {
                    attachedFileName: "",
                    attachedFileMimeType: "",
                });
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                throw new Error(uploadResponse.message);
            }

            setAttachedFileName(file.name);
            writeSessionUiSettings(currentSession.id, {
                attachedFileName: file.name,
                attachedFileMimeType: file.type || "",
            });
            setAttachedFileMimeType(file.type || "");
        } catch (error) {
            setAttachedFileError(
                error instanceof Error ? error.message : "Ошибка загрузки файла"
            );
            setAttachedFileName("");
            setAttachedFileMimeType("");
            const { currentSession } = getCurrentSession();
            writeSessionUiSettings(currentSession?.id, {
                attachedFileName: "",
                attachedFileMimeType: "",
            });
        } finally {
            setIsUploadingFile(false);
        }
    };

    const handleAttachFileClick = () => {
        setAttachedFileError("");
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        await uploadFile(file);
        event.target.value = "";
    };

    const handleDropFile = async (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsFileDragActive(false);

        if (isUploadingFile) return;

        const files = event.dataTransfer.files;
        if (!files || files.length === 0) return;

        if (files.length > 1) {
            setAttachedFileError("Можно загрузить только один файл за раз.");
            return;
        }

        await uploadFile(files[0]);
    };

    const handleClearFileContext = async () => {
        if (!sessionIdFromUrl || isUploadingFile || isSending || isSummarizing) {
            return;
        }
    
        setAttachedFileError("");
    
        try {
            const currentUser = requireUserEmail();
            if (!currentUser) return;
            const sessionToken = requireSessionToken();
            if (!sessionToken) return;

            const response = await fetch(WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    session_id: sessionIdFromUrl,
                    user_email: currentUser,
                    session_token: sessionToken,
                    clear_file_context: true,
                }),
            });
    
            const raw = await response.text();
    
            if (!response.ok) {
                throw new Error(
                    raw || `Ошибка очистки контекста. status=${response.status}`
                );
            }
    
            setAttachedFileName("");
            setAttachedFileMimeType("");
            setAttachedFileError("");
            clearSessionAttachedFileContext(sessionIdFromUrl);
        } catch (error) {
            setAttachedFileError(
                error instanceof Error ? error.message : "Ошибка очистки контекста"
            );
        }
    };

    const upsertSessionMessages = (
        sessionId: string,
        updater: (messages: ChatMessage[]) => ChatMessage[]
    ) => {
        const refreshedSessions = readSessions();
        const finalSessions = refreshedSessions.map((item) => {
            if (item.id !== sessionId) return item;

            return {
                ...item,
                messages: updater(item.messages || []),
                updatedAt: Date.now(),
            };
        });

        saveSessions(finalSessions);
    };

    const replaceMessageById = (
        sessionId: string,
        messageId: string,
        nextMessage: ChatMessage
    ) => {
        upsertSessionMessages(sessionId, (messages) =>
            messages.map((msg) => (msg.id === messageId ? nextMessage : msg))
        );
    };

    const handleStop = () => {
        abortControllersRef.current.forEach((controller) => controller.abort());
    };

    const refreshAssistantMessage = async (
        assistantMessageId: string,
        modelId: string
    ) => {
        if (isSummarizing || !assistantMessageId || !modelId) return;

        const currentUser = requireUserEmail();
        if (!currentUser) return;
        const sessionToken = requireSessionToken();
        if (!sessionToken) return;

        const { currentSession } = getCurrentSession();

        if (!currentSession) return;

        const messages = currentSession.messages || [];
        const assistantIndex = messages.findIndex(
            (item) => item.id === assistantMessageId && item.role === "assistant"
        );

        if (assistantIndex === -1) return;

        let userIndex = -1;

        for (let index = assistantIndex - 1; index >= 0; index -= 1) {
            if (messages[index]?.role === "user") {
                userIndex = index;
                break;
            }
        }

        if (userIndex === -1) return;

        const promptText = String(messages[userIndex]?.content || "").trim();
        if (!promptText) return;
        const previousAssistantMessage = messages[assistantIndex];

        const modelCatalogItem = getModelsCatalog().find(
            (item) => item.model_id === modelId
        );
        const isImageModel =
            normalizeModeType(modelCatalogItem?.mode_type) === "image";
        const requestMode = isImageModel ? "image" : activeMode;
        const modelDisplayName =
            messages[assistantIndex]?.model_display_name ||
            modelCatalogItem?.display_name ||
            modelId;
        const defaultQuality =
            String(modelCatalogItem?.default_quality || "").trim() || "low";
        const defaultSize =
            String(modelCatalogItem?.default_size || "").trim() || "1024x1024";

        replaceMessageById(currentSession.id, assistantMessageId, {
            id: assistantMessageId,
            role: "assistant",
            content: isImageModel ? "Генерирую изображение..." : "Печатает...",
            isLoading: true,
            model_id: modelId,
            model_display_name: modelDisplayName,
        });

        setIsSending(true);
        abortControllersRef.current = [];

        const history = messages
            .slice(0, assistantIndex)
            .filter((item) => {
                if (item.isLoading) return false;
                if (item.role === "user") return true;
                return item.model_id === modelId;
            })
            .map((item) => ({
                role: item.role,
                content: item.content,
            }))
            .slice(-20);

        const controller = new AbortController();
        abortControllersRef.current.push(controller);

        try {
            const response = await fetch(WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(
                    isImageModel
                        ? {
                              session_id: currentSession.id,
                              user_query: promptText,
                              model: modelId,
                              task_type: "image",
                              mode: "image",
                              image_quality:
                                  imageOptionsByModel[modelId]?.quality ||
                                  defaultQuality,
                              image_size:
                                  imageOptionsByModel[modelId]?.size ||
                                  defaultSize,
                              history: [],
                              user_email: currentUser,
                              session_token: sessionToken,
                          }
                        : {
                              session_id: currentSession.id,
                              user_query: promptText,
                              model: modelId,
                              history,
                              user_email: currentUser,
                              session_token: sessionToken,
                              mode: requestMode,
                          }
                ),
                signal: controller.signal,
            });

            const raw = await response.text();
            const answerText = response.ok
                ? parseResponseText(raw, response.status)
                : {
                      text: raw.trim() || `Ошибка сервера. status=${response.status}`,
                      authError: false,
                      modelAccessError: false,
                  };

            if (answerText.modelAccessError) {
                replaceMessageById(currentSession.id, assistantMessageId, {
                    ...previousAssistantMessage,
                    isLoading: false,
                });
                setModelAccessModalOpen(true);
                return;
            }

            replaceMessageById(currentSession.id, assistantMessageId, {
                id: assistantMessageId,
                role: "assistant",
                content: answerText.text,
                model_id: modelId,
                model_display_name: modelDisplayName,
            });
        } catch (error) {
            const errorText =
                error instanceof Error ? error.message : "Ошибка сети";

            replaceMessageById(currentSession.id, assistantMessageId, {
                id: assistantMessageId,
                role: "assistant",
                content:
                    error instanceof DOMException && error.name === "AbortError"
                        ? "Ответ остановлен"
                        : `Ошибка сети: ${errorText}`,
                model_id: modelId,
                model_display_name: modelDisplayName,
            });
        } finally {
            abortControllersRef.current = [];
            setIsSending(false);
        }
    };

    useEffect(() => {
        const handleRefreshRequest = (event: Event) => {
            const detail = (event as CustomEvent<{ assistantMessageId?: string; modelId?: string }>).detail;

            void refreshAssistantMessage(
                String(detail?.assistantMessageId || ""),
                String(detail?.modelId || "")
            );
        };

        window.addEventListener(
            "ai-answer-refresh-request",
            handleRefreshRequest
        );

        return () => {
            window.removeEventListener(
                "ai-answer-refresh-request",
                handleRefreshRequest
            );
        };
    }, [activeMode, imageOptionsByModel, isSummarizing]);

    const sendMessage = async () => {
        const text = message.trim();
        if (!text || isSending || isSummarizing || isUploadingFile) return;

        const currentUser = requireUserEmail();
        if (!currentUser) return;
        const sessionToken = requireSessionToken();
        if (!sessionToken) return;

        const selectedModels = visibleModels;
        const requestMode = activeMode;
        const { sessions } = getCurrentSession();

        if (selectedModels.length === 0) {
            if (activeMode === "image") {
                window.alert(
                    "Для режима картинок не найдено ни одной доступной image-модели."
                );
            } else {
                window.alert("Не найдено ни одной доступной текстовой модели.");
            }
            return;
        }

        let currentSession =
            sessions.find((item) => item.id === sessionIdFromUrl) ||
            sessions.find(
                (item) => item.id === localStorage.getItem(getCurrentSessionKey())
            );

        let workingSessions = sessions;

        if (!currentSession) {
            currentSession = {
                id: crypto.randomUUID(),
                title: "Новый чат",
                messages: [],
                updatedAt: Date.now(),
            };
            workingSessions = [currentSession, ...sessions];
            saveSessions(workingSessions);
            localStorage.setItem(getCurrentSessionKey(), currentSession.id);
            window.history.replaceState({}, "", `/chat?id=${currentSession.id}`);
        }

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: text,
            attached_file_name: attachedFileName || undefined,
            attached_file_mime_type: attachedFileMimeType || undefined,
        };

        const loadingMessages: ChatMessage[] = selectedModels.map((model) => ({
            id: crypto.randomUUID(),
            role: "assistant",
            content:
                activeMode === "image"
                    ? "Генерирую изображение..."
                    : "Печатает...",
            isLoading: true,
            model_id: model.modelId,
            model_display_name: model.displayName,
        }));

        const nextMessages = [
            ...(currentSession.messages || []),
            userMessage,
            ...loadingMessages,
        ];

        const nextSessions = workingSessions.map((item) =>
            item.id === currentSession!.id
                ? {
                      ...item,
                      title:
                          item.messages.length === 0
                              ? getSessionTitleFromText(text)
                              : item.title,
                      messages: nextMessages,
                      updatedAt: Date.now(),
                  }
                : item
        );

        saveSessions(nextSessions);
        localStorage.setItem(getCurrentSessionKey(), currentSession.id);

        setMessage("");
        setIsSending(true);
        abortControllersRef.current = [];
        let hasAuthError = false;
        let hasModelAccessError = false;
        const hasSessionExisted = sessions.some((item) => item.id === currentSession?.id);

        try {
            await Promise.allSettled(
                selectedModels.map(async (model) => {
                    if (hasAuthError || hasModelAccessError) return;

                    const loadingMessage = loadingMessages.find(
                        (item) => item.model_id === model.modelId
                    );
                    if (!loadingMessage) return;

                    const history = [...(currentSession?.messages || []), userMessage]
                        .filter((item) => {
                            if (item.isLoading) return false;
                            if (item.role === "user") return true;
                            return item.model_id === model.modelId;
                        })
                        .map((item) => ({
                            role: item.role,
                            content: item.content,
                        }))
                        .slice(-20);

                    const controller = new AbortController();
                    abortControllersRef.current.push(controller);

                    try {
                        const response = await fetch(WEBHOOK_URL, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(
                                activeMode === "image"
                                    ? {
                                          session_id: currentSession.id,
                                          user_query: text,
                                          model: model.modelId,
                                          task_type: "image",
                                          mode: "image",
                                          image_quality:
                                              imageOptionsByModel[model.modelId]
                                                  ?.quality ||
                                              model.defaultQuality,
                                          image_size:
                                              imageOptionsByModel[model.modelId]
                                                  ?.size || model.defaultSize,
                                          history: [],
                                          user_email: currentUser,
                                          session_token: sessionToken,
                                      }
                                    : {
                                          session_id: currentSession.id,
                                          user_query: text,
                                          model: model.modelId,
                                          history,
                                          user_email: currentUser,
                                          session_token: sessionToken,
                                          mode: requestMode,
                                      }
                            ),
                            signal: controller.signal,
                        });

                        const raw = await response.text();

                        const parsedResponse = response.ok
                            ? parseResponseText(raw, response.status)
                            : {
                                  text:
                                      raw.trim() ||
                                      `Ошибка сервера. status=${response.status}`,
                                  authError: false,
                                  modelAccessError: false,
                              };

                        if (parsedResponse.authError) {
                            hasAuthError = true;
                            abortControllersRef.current.forEach((item) => item.abort());

                            const rollbackSessions = hasSessionExisted
                                ? workingSessions.map((item) =>
                                      item.id === currentSession!.id
                                          ? {
                                                ...item,
                                                messages: currentSession!.messages || [],
                                                updatedAt: Date.now(),
                                            }
                                          : item
                                  )
                                : workingSessions.filter(
                                      (item) => item.id !== currentSession!.id
                                  );

                            saveSessions(rollbackSessions);
                            setMessage(text);
                            sessionStorage.setItem(CHAT_DRAFT_STORAGE_KEY, text);
                            localStorage.removeItem("ai_session_token");
                            localStorage.removeItem("ai_session_expires_at");
                            sessionStorage.setItem(
                                RETURN_AFTER_LOGIN_STORAGE_KEY,
                                `${window.location.pathname}${window.location.search}${window.location.hash}`
                            );
                            setSessionExpiredModalOpen(true);
                            return;
                        }

                        if (parsedResponse.modelAccessError) {
                            hasModelAccessError = true;
                            abortControllersRef.current.forEach((item) => item.abort());

                            const rollbackSessions = hasSessionExisted
                                ? workingSessions.map((item) =>
                                      item.id === currentSession!.id
                                          ? {
                                                ...item,
                                                messages: currentSession!.messages || [],
                                                updatedAt: Date.now(),
                                            }
                                          : item
                                  )
                                : workingSessions.filter(
                                      (item) => item.id !== currentSession!.id
                                  );

                            saveSessions(rollbackSessions);
                            setMessage(text);
                            sessionStorage.setItem(CHAT_DRAFT_STORAGE_KEY, text);
                            setModelAccessModalOpen(true);
                            return;
                        }

                        replaceMessageById(currentSession.id, loadingMessage.id, {
                            id: loadingMessage.id,
                            role: "assistant",
                            content: parsedResponse.text,
                            model_id: model.modelId,
                            model_display_name: model.displayName,
                        });
                    } catch (error) {
                        if (
                            error instanceof DOMException &&
                            error.name === "AbortError"
                        ) {
                            if (hasAuthError || hasModelAccessError) {
                                return;
                            }
                            replaceMessageById(currentSession.id, loadingMessage.id, {
                                id: loadingMessage.id,
                                role: "assistant",
                                content: "Ответ остановлен",
                                model_id: model.modelId,
                                model_display_name: model.displayName,
                            });
                        } else {
                            if (hasAuthError || hasModelAccessError) {
                                return;
                            }
                            const errorText =
                                error instanceof Error
                                    ? error.message
                                    : "Ошибка сети";

                            replaceMessageById(currentSession.id, loadingMessage.id, {
                                id: loadingMessage.id,
                                role: "assistant",
                                content: `Ошибка сети: ${errorText}`,
                                model_id: model.modelId,
                                model_display_name: model.displayName,
                            });
                        }
                    }
                })
            );
        } finally {
            abortControllersRef.current = [];
            setIsSending(false);
        }
    };

    const summarizeAnswers = async () => {
        if (isSending || isSummarizing) return;

        const currentUser = requireUserEmail();
        if (!currentUser) return;
        const sessionToken = requireSessionToken();
        if (!sessionToken) return;

        const { currentSession } = getCurrentSession();

        if (!currentSession) {
            window.alert("Сначала открой чат и получи ответы моделей.");
            return;
        }

        const summaryData = buildSummaryData(
            currentSession.messages || [],
            visibleModels
        );

        if (!summaryData) {
            window.alert(
                "Сначала получи хотя бы один готовый ответ, потом жми Саммари."
            );
            return;
        }

        setSummaryOpen(true);
        setSummaryText("✨ Анализирую ответы и пишу выжимку...");
        setIsSummarizing(true);

        try {
            const controller = new AbortController();
            summaryAbortControllerRef.current = controller;

            const response = await fetch(WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    session_id: currentSession.id,
                    user_query: summaryData.userQuery,
                    answers: summaryData.answers,
                    model: SUMMARY_MODEL_ID,
                    history: [],
                    user_email: currentUser,
                    session_token: sessionToken,
                }),
                signal: controller.signal,
            });

            const raw = await response.text();

            const answerText = response.ok
                ? parseResponseText(raw, response.status)
                : {
                      text: raw.trim() || `Ошибка сервера. status=${response.status}`,
                      authError: false,
                      modelAccessError: false,
                  };

            setSummaryText(answerText.text);
        } catch (error) {
            const errorText =
                error instanceof Error ? error.message : "Ошибка сети";
            setSummaryText(`Ошибка сети при создании саммари: ${errorText}`);
        } finally {
            summaryAbortControllerRef.current = null;
            setIsSummarizing(false);
        }
    };

    const handleCopySummary = async () => {
        if (!summaryText.trim()) return;

        try {
            await navigator.clipboard.writeText(summaryText);
        } catch {
            // ignore
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (isSending) {
                handleStop();
                return;
            }
            if (isUploadingFile) {
                return;
            }
            sendMessage();
        }
    };

    const placeholder =
        activeMode === "search"
            ? "Что найти в сети?"
            : activeMode === "image"
            ? "Опиши изображение..."
            : activeMode === "video"
            ? "Опиши видео..."
            : "Напиши вопрос...";

    const attachedFilePreviewMeta = useMemo(
        () => getFilePreviewMeta(attachedFileName, attachedFileMimeType),
        [attachedFileName, attachedFileMimeType]
    );

    return (
        <>
            <div className="relative z-2 mx-auto w-full max-w-258">
                <div
                    className={`flex items-stretch gap-3 rounded-xl border bg-gray-0 p-3 shadow-[0_3rem_6.25rem_0_rgba(17,12,46,0.15)] max-md:flex-col max-md:items-stretch max-md:gap-2 max-md:p-3 ${
                        isFileDragActive
                            ? "border-primary-300 ring-2 ring-primary-100"
                            : "border-gray-50"
                    }`}
                    onDragEnter={(event) => {
                        event.preventDefault();
                        setIsFileDragActive(true);
                    }}
                    onDragOver={(event) => {
                        event.preventDefault();
                    }}
                    onDragLeave={(event) => {
                        event.preventDefault();
                        if (event.currentTarget === event.target) {
                            setIsFileDragActive(false);
                        }
                    }}
                    onDrop={(event) => {
                        void handleDropFile(event);
                    }}
                >
                    <div className="shrink-0 self-stretch">
                        <ChatFeatures
                            activeMode={activeMode}
                            onSelectChat={() => {
                                setActiveMode("chat");
                                setGenerateVideo(false);
                            }}
                            onSelectImage={() => {
                                setActiveMode("image");
                                setGenerateVideo(false);
                            }}
                            onGenerateVideo={() => {
                                setActiveMode("video");
                                setGenerateVideo(true);
                            }}
                            onAttachFile={handleAttachFileClick}
                        />
                    </div>

                    <div className="min-w-0 flex-1 rounded-xl border border-gray-100 bg-white px-4 py-2 shadow-[0_0.0625rem_0.125rem_0_rgba(13,13,18,0.06)]">
                        {generateVideo && (
                            <div className="mb-3">
                                <CloseLine
                                    title="Создать видео"
                                    onClose={() => {
                                        setGenerateVideo(false);
                                        if (activeMode === "video") {
                                            setActiveMode("chat");
                                        }
                                    }}
                                />
                            </div>
                        )}

                        {generateVideo && (
                            <div className="mb-3">
                                <RecreateVideo />
                            </div>
                        )}

                        {activeMode === "image" && activeImageModel && (
                            <div className="mb-3 grid gap-3 md:grid-cols-2">
                                <Select
                                    label="Качество"
                                    placeholder="Выбери качество"
                                    options={imageQualityValues.map(
                                        (value, index) => ({
                                            id: index,
                                            name: value,
                                        })
                                    )}
                                    value={
                                        imageQualityValues
                                            .map((value, index) => ({
                                                id: index,
                                                name: value,
                                            }))
                                            .find(
                                                (option) =>
                                                    option.name ===
                                                    selectedImageOptions?.quality
                                            ) || null
                                    }
                                    onChange={(option) => {
                                        if (!option || !activeImageModel) return;

                                        setImageOptionsByModel((current) => ({
                                            ...current,
                                            [activeImageModel.modelId]: {
                                                quality: option.name,
                                                size:
                                                    current[activeImageModel.modelId]
                                                        ?.size ||
                                                    imageSizeValues[0] ||
                                                    activeImageModel.defaultSize,
                                            },
                                        }));
                                    }}
                                />

                                <Select
                                    label="Размер"
                                    placeholder="Выбери размер"
                                    options={imageSizeValues.map(
                                        (value, index) => ({
                                            id: index,
                                            name: value,
                                        })
                                    )}
                                    value={
                                        imageSizeValues
                                            .map((value, index) => ({
                                                id: index,
                                                name: value,
                                            }))
                                            .find(
                                                (option) =>
                                                    option.name ===
                                                    selectedImageOptions?.size
                                            ) || null
                                    }
                                    onChange={(option) => {
                                        if (!option || !activeImageModel) return;

                                        setImageOptionsByModel((current) => ({
                                            ...current,
                                            [activeImageModel.modelId]: {
                                                quality:
                                                    current[activeImageModel.modelId]
                                                        ?.quality ||
                                                    imageQualityValues[0] ||
                                                    activeImageModel.defaultQuality,
                                                size: option.name,
                                            },
                                        }));
                                    }}
                                />
                            </div>
                        )}

                        {(isUploadingFile || attachedFileName || attachedFileError) && (
                            <div className="mb-3 text-[12px] leading-4">
                                {isUploadingFile && (
                                    <div className="text-gray-500">Файл загружается...</div>
                                )}
                                {!isUploadingFile && attachedFileName && (
                                    <div className="rounded-lg border border-gray-100 bg-gray-25 p-2.5">
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <span className="inline-flex size-5 items-center justify-center rounded bg-gray-100">
                                                <Icon
                                                    className={`${attachedFilePreviewMeta.iconClassName} size-3.5`}
                                                    name={attachedFilePreviewMeta.icon}
                                                />
                                            </span>
                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-gray-600">
                                                {attachedFilePreviewMeta.badge}
                                            </span>
                                            <span className="min-w-0 flex-1 truncate">
                                                {attachedFileName}
                                            </span>
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                onClick={() => {
                                                    void handleClearFileContext();
                                                }}
                                                disabled={isUploadingFile || isSending || isSummarizing}
                                            >
                                                Очистить контекст
                                            </button>
                                        </div>
                                        <div className="mt-2 text-[11px] text-gray-500">
                                            В чате активен только один файл. Новый файл заменит текущий.
                                        </div>
                                    </div>
                                )}
                                {!isUploadingFile && attachedFileError && (
                                    <div className="text-red-500">{attachedFileError}</div>
                                )}
                            </div>
                        )}

                        {isFileDragActive && !isUploadingFile && (
                            <div className="mb-3 rounded-lg border border-dashed border-primary-200 bg-primary-50 px-3 py-2 text-[12px] text-primary-300">
                                Перетащи файл сюда, чтобы загрузить
                            </div>
                        )}

                        <div className="relative text-0">
                            <TextareaAutosize
                                ref={textareaRef}
                                className="w-full min-h-[40px] resize-none overflow-y-auto text-body-md leading-5 text-gray-900 outline-none placeholder:text-gray-500"
                                minRows={2}
                                maxRows={5}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholder}
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={handleFileSelected}
                            />
                        </div>

                        <div className="mt-2 flex items-center justify-end gap-2">
                            {generateVideo && <Time />}

                            <div className="flex items-center gap-2 self-end">
                                <Audio />
                                <Voice />

                                <Button
                                    className="w-8 !px-0"
                                    icon={isSending ? "close" : "arrow"}
                                    isPrimary
                                    isXSmall
                                    onClick={isSending ? handleStop : sendMessage}
                                    disabled={
                                        !isSending &&
                                        (!message.trim() ||
                                            isSummarizing ||
                                            isUploadingFile)
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {activeMode !== "image" && (
                        <div className="shrink-0 self-end pb-1 max-md:pb-0">
                            <button
                                type="button"
                                onClick={summarizeAnswers}
                                disabled={isSending || isSummarizing}
                                className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-100 bg-white px-4 text-[12px] font-medium text-gray-700 shadow-[0_0.0625rem_0.125rem_0_rgba(13,13,18,0.06)] transition-colors hover:bg-gray-25 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSummarizing ? "Саммари..." : "Саммари"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <Dialog
                open={summaryOpen}
                onClose={() => setSummaryOpen(false)}
                className="relative z-50"
            >
                <DialogBackdrop
                    className="fixed inset-0 bg-[#1B1B1B]/60 backdrop-blur-[1px]"
                    transition
                />
                <div className="fixed inset-0 flex justify-end overflow-hidden">
                    <DialogPanel
                        className="flex h-full w-full max-w-[46rem] flex-col bg-white shadow-[-1.5rem_0_3rem_rgba(17,12,46,0.12)]"
                        transition
                    >
                        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                            <div className="min-w-0 flex-1">
                                <div className="text-[14px] font-semibold text-gray-900">
                                    {SUMMARY_MODEL_LABEL}
                                </div>
                                <div className="text-[12px] text-gray-500">
                                    Сводка по последним ответам
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleCopySummary}
                                className="inline-flex h-8 items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 text-[12px] font-medium text-gray-700 shadow-[0_0.0625rem_0.125rem_0_rgba(13,13,18,0.06)] transition-colors hover:bg-gray-25 disabled:opacity-50"
                                disabled={!summaryText.trim()}
                            >
                                <Icon name="copy" className="fill-current" />
                                Копировать
                            </button>

                            <button
                                type="button"
                                onClick={() => setSummaryOpen(false)}
                                className="inline-flex size-8 items-center justify-center rounded-lg border border-gray-100 bg-white text-0 shadow-[0_0.0625rem_0.125rem_0_rgba(13,13,18,0.06)] transition-colors hover:bg-gray-25"
                                aria-label="Закрыть саммари"
                            >
                                <Icon name="close" className="fill-gray-500" />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
                            <div className="whitespace-pre-wrap text-[14px] leading-6 text-gray-800">
                                {summaryText || "Здесь появится саммари"}
                            </div>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            <Dialog
                open={modelAccessModalOpen}
                onClose={() => {
                    setModelAccessModalOpen(false);
                }}
                className="relative z-50"
            >
                <DialogBackdrop className="fixed inset-0 bg-[#1B1B1B]/60 backdrop-blur-[1px]" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_1.5rem_3rem_rgba(17,12,46,0.12)]">
                        <div className="text-[16px] font-semibold text-gray-900">
                            Эта модель недоступна на вашем тарифе. Измените тарифный
                            план, чтобы продолжить.
                        </div>
                        <div className="mt-5 flex justify-end">
                            <Button
                                isPrimary
                                onClick={() => {
                                    setModelAccessModalOpen(false);
                                }}
                            >
                                Ок
                            </Button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            <Dialog
                open={sessionExpiredModalOpen}
                onClose={() => {
                    setSessionExpiredModalOpen(true);
                }}
                className="relative z-50"
            >
                <DialogBackdrop className="fixed inset-0 bg-[#1B1B1B]/60 backdrop-blur-[1px]" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_1.5rem_3rem_rgba(17,12,46,0.12)]">
                        <div className="text-[16px] font-semibold text-gray-900">
                            Сессия истекла. Войдите снова.
                        </div>
                        <div className="mt-5 flex justify-end">
                            <Button
                                isPrimary
                                onClick={() => {
                                    setSessionExpiredModalOpen(false);
                                    router.push("/auth/sign-in");
                                }}
                            >
                                Ок
                            </Button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </>
    );
};

export default PanelMessage;
