"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
} from "@headlessui/react";
import TextareaAutosize from "react-textarea-autosize";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import ChatFeatures from "./ChatFeatures";
import Audio from "./Audio";
import Voice from "./Voice";
import Time from "./Time";
import CloseLine from "./CloseLine";
import RecreateVideo from "./RecreateVideo";

const WEBHOOK_URL =
    "https://tgdomen.ru/webhook/3bcfce39-4b24-4493-b3a7-cab0030e8a36";

const FALLBACK_MODEL = "gpt-5-nano";
const FALLBACK_EMAIL = "Sergei19880415@gmail.com";
const SUMMARY_MODEL_ID = "summary";
const SUMMARY_MODEL_LABEL = "✨ Саммари";

type ChatMode = "chat" | "search" | "image" | "video";

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    isLoading?: boolean;
    model_id?: string;
    model_display_name?: string;
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

const getUserEmail = () => {
    return (localStorage.getItem("ai_user_email") || "guest").trim();
};

const getSessionsKey = () => {
    return `ai_sessions_${getUserEmail()}`;
};

const getCurrentSessionKey = () => {
    return `ai_current_session_${getUserEmail()}`;
};

const getSelectedModelKey = () => {
    return `ai_selected_model_${getUserEmail()}`;
};

const getSelectedModelsKey = () => {
    return `ai_selected_models_${getUserEmail()}`;
};

const getParallelCountKey = () => {
    return `ai_parallel_count_${getUserEmail()}`;
};

const getActiveModeKey = () => {
    return `ai_active_mode_${getUserEmail()}`;
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
    const searchParams = useSearchParams();
    const sessionIdFromUrl = searchParams.get("id") || "";
    const abortControllersRef = useRef<AbortController[]>([]);
    const summaryAbortControllerRef = useRef<AbortController | null>(null);

    const [message, setMessage] = useState("");
    const [generateVideo, setGenerateVideo] = useState(false);
    const [activeMode, setActiveMode] = useState<ChatMode>("chat");
    const [isSending, setIsSending] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [summaryText, setSummaryText] = useState("");

    useEffect(() => {
        const headerMode = activeMode === "image" ? "image" : "text";

        localStorage.setItem(getActiveModeKey(), headerMode);
        window.dispatchEvent(new Event("ai-active-mode-updated"));
    }, [activeMode]);

    const parseResponseText = (raw: string, status: number): string => {
        const trimmed = raw.trim();

        if (!trimmed) {
            return `Пустое тело ответа. status=${status}`;
        }

        try {
            let data: unknown = JSON.parse(trimmed);

            if (typeof data === "string") {
                try {
                    data = JSON.parse(data) as unknown;
                } catch {
                    return typeof data === "string" ? data : String(data);
                }
            }

            if (Array.isArray(data)) {
                const first = data[0];

                if (typeof first === "string") return first;

                const extracted = extractAnswerText(first);
                if (extracted) return extracted;

                return JSON.stringify(first, null, 2);
            }

            if (isRecord(data)) {
                const extracted = extractAnswerText(data);
                if (extracted) return extracted;

                return JSON.stringify(data, null, 2);
            }

            return String(data);
        } catch {
            return trimmed;
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

    const sendMessage = async () => {
        const text = message.trim();
        if (!text || isSending || isSummarizing) return;

        const currentUser =
            localStorage.getItem("ai_user_email") || FALLBACK_EMAIL;
        const selectedModels = getVisibleModels(
            activeMode === "image" ? "image" : "text"
        );
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

        try {
            await Promise.allSettled(
                selectedModels.map(async (model) => {
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
                                          user_query: text,
                                          model: model.modelId,
                                          task_type: "image",
                                          mode: "image",
                                          image_quality: model.defaultQuality,
                                          image_size: model.defaultSize,
                                          history: [],
                                          user_email: currentUser,
                                      }
                                    : {
                                          user_query: text,
                                          model: model.modelId,
                                          history,
                                          user_email: currentUser,
                                          mode: requestMode,
                                      }
                            ),
                            signal: controller.signal,
                        });

                        const raw = await response.text();

                        const answerText = response.ok
                            ? parseResponseText(raw, response.status)
                            : raw.trim() ||
                              `Ошибка сервера. status=${response.status}`;

                        replaceMessageById(currentSession.id, loadingMessage.id, {
                            id: loadingMessage.id,
                            role: "assistant",
                            content: answerText,
                            model_id: model.modelId,
                            model_display_name: model.displayName,
                        });
                    } catch (error) {
                        if (
                            error instanceof DOMException &&
                            error.name === "AbortError"
                        ) {
                            replaceMessageById(currentSession.id, loadingMessage.id, {
                                id: loadingMessage.id,
                                role: "assistant",
                                content: "Ответ остановлен",
                                model_id: model.modelId,
                                model_display_name: model.displayName,
                            });
                        } else {
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

        const currentUser =
            localStorage.getItem("ai_user_email") || FALLBACK_EMAIL;
        const { currentSession } = getCurrentSession();

        if (!currentSession) {
            window.alert("Сначала открой чат и получи ответы моделей.");
            return;
        }

        const summaryData = buildSummaryData(
            currentSession.messages || [],
            getVisibleModels(activeMode === "image" ? "image" : "text")
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
                    user_query: summaryData.userQuery,
                    answers: summaryData.answers,
                    model: SUMMARY_MODEL_ID,
                    history: [],
                    user_email: currentUser,
                }),
                signal: controller.signal,
            });

            const raw = await response.text();

            const answerText = response.ok
                ? parseResponseText(raw, response.status)
                : raw.trim() || `Ошибка сервера. status=${response.status}`;

            setSummaryText(answerText);
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

    return (
        <>
            <div className="relative z-2 mx-auto w-full max-w-258">
                <div className="flex items-stretch gap-3 rounded-xl border border-gray-50 bg-gray-0 p-3 shadow-[0_3rem_6.25rem_0_rgba(17,12,46,0.15)] max-md:flex-col max-md:items-stretch max-md:gap-2 max-md:p-3">
                    <div className="shrink-0 self-stretch">
                        <ChatFeatures
                            activeMode={activeMode}
                            onSelectChat={() => {
                                setActiveMode("chat");
                                setGenerateVideo(false);
                            }}
                            onSelectSearch={() => {
                                setActiveMode("search");
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
                        />
                    </div>

                    <div className="min-w-0 flex-1 rounded-xl border border-gray-100 bg-white px-4 py-1 shadow-[0_0.0625rem_0.125rem_0_rgba(13,13,18,0.06)]">
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

                        <div className="relative text-0">
                            <TextareaAutosize
                                className="w-full min-h-[40px] resize-none overflow-y-auto text-body-md leading-5 text-gray-900 outline-none placeholder:text-gray-500"
                                minRows={2}
                                maxRows={5}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholder}
                            />
                        </div>

                        <div className="mt-1 flex items-center justify-end gap-2">
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
                                        (!message.trim() || isSummarizing)
                                    }
                                />
                            </div>
                        </div>
                    </div>

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
        </>
    );
};

export default PanelMessage;