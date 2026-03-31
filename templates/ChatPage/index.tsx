"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/Layout";
import Message from "@/components/Message";
import Answer from "@/components/Answer";
import Image from "@/components/Image";
import {
    applySessionUiSettingsToLegacyKeys,
    getParallelCountKey,
    getSelectedModelKey,
    getSelectedModelsKey,
    getUiModeKey,
} from "@/lib/chatUiSettings";

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

type ModelCatalogItem = {
    model_id: string;
    display_name?: string;
    provider?: string;
    group_order?: number;
    model_order?: number;
    input_price_per_1m?: number | null;
    output_price_per_1m?: number | null;
    is_active?: boolean;
};

type UiMode = "chat" | "image" | "video";

const getModelLogoSrc = (modelId?: string, provider?: string): string => {
    const id = String(modelId || "").trim().toLowerCase();
    const prov = String(provider || "").trim().toLowerCase();

    if (
        prov.includes("openai") ||
        id.includes("gpt") ||
        id.includes("o1") ||
        id.includes("o3") ||
        id.includes("o4")
    ) {
        return "/images/models/openai.svg";
    }

    if (prov.includes("anthropic") || id.includes("claude")) {
        return "/images/models/claude-color.svg";
    }

    if (prov.includes("google") || id.includes("gemini")) {
        return "/images/models/gemini-color.svg";
    }

    if (prov.includes("xai") || prov.includes("x.ai") || id.includes("grok")) {
        return "/images/models/grok.svg";
    }

    if (prov.includes("perplexity") || id.includes("perplexity")) {
        return "/images/models/perplexity.svg";
    }

    return "/images/logo-circle.png";
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

const normalizePositiveInt = (value: unknown, fallback: number) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 1) return fallback;
    return Math.floor(num);
};

const readSessions = (): ChatSession[] => {
    try {
        const raw = localStorage.getItem(getSessionsKey());
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const saveSessions = (sessions: ChatSession[]) => {
    localStorage.setItem(getSessionsKey(), JSON.stringify(sessions));
    window.dispatchEvent(new Event("ai-chat-sessions-updated"));
    window.dispatchEvent(new Event("ai-chat-updated"));
};

const ensureSession = (requestedId?: string | null) => {
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

        return newSession;
    }

    if (requestedId) {
        const found = sessions.find((item) => item.id === requestedId);
        if (found) {
            localStorage.setItem(getCurrentSessionKey(), found.id);
            return found;
        }
    }

    const savedCurrentId = localStorage.getItem(getCurrentSessionKey()) || "";
    const current =
        sessions.find((item) => item.id === savedCurrentId) || sessions[0];

    localStorage.setItem(getCurrentSessionKey(), current.id);
    return current;
};

const getModelsCatalog = (): ModelCatalogItem[] => {
    try {
        const raw = localStorage.getItem("ai_models_catalog");
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const readSelectedModels = (): string[] => {
    try {
        const raw = localStorage.getItem(getSelectedModelsKey());
        if (raw) {
            const parsed = JSON.parse(raw);
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

const getVisibleModelIds = (): string[] => {
    const parallelCount = normalizePositiveInt(
        localStorage.getItem(getParallelCountKey()),
        1
    );

    const selected = readSelectedModels();
    const uniqueSelected = [...new Set(selected)];

    if (uniqueSelected.length > 0) {
        return uniqueSelected.slice(0, parallelCount);
    }

    const single = (localStorage.getItem(getSelectedModelKey()) || "").trim();
    return single ? [single] : [];
};

const getGridClassName = (count: number) => {
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 xl:grid-cols-2";
    if (count <= 4) return "grid-cols-1 lg:grid-cols-2";
    return "grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3";
};

const getUiMode = (): UiMode => {
    const raw = (localStorage.getItem(getUiModeKey()) || "chat")
        .trim()
        .toLowerCase();

    if (raw === "image") return "image";
    if (raw === "video") return "video";
    return "chat";
};

const ChatPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionIdFromUrl = searchParams.get("id");

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessionTitle, setSessionTitle] = useState("Новый чат");
    const [uiMode, setUiMode] = useState<UiMode>("chat");
    const [parallelCount, setParallelCount] = useState(1);
    const [visibleModelIds, setVisibleModelIds] = useState<string[]>([]);
    const [modelsCatalog, setModelsCatalog] = useState<ModelCatalogItem[]>([]);

    useEffect(() => {
        const loadState = () => {
            const session = ensureSession(sessionIdFromUrl);
            applySessionUiSettingsToLegacyKeys(session.id);
            setMessages(session.messages || []);
            setSessionTitle(session.title || "Новый чат");
            setUiMode(getUiMode());
            setParallelCount(
                normalizePositiveInt(localStorage.getItem(getParallelCountKey()), 1)
            );
            setVisibleModelIds(getVisibleModelIds());
            setModelsCatalog(getModelsCatalog());

            if (sessionIdFromUrl !== session.id) {
                router.replace(`/chat?id=${session.id}`);
            }
        };

        loadState();

        window.addEventListener("ai-chat-updated", loadState);
        window.addEventListener("ai-selected-model-updated", loadState);
        window.addEventListener("ai-selected-models-updated", loadState);
        window.addEventListener("ai-parallel-settings-updated", loadState);
        window.addEventListener("ai-models-catalog-updated", loadState);
        window.addEventListener("ai-active-mode-updated", loadState);

        return () => {
            window.removeEventListener("ai-chat-updated", loadState);
            window.removeEventListener("ai-selected-model-updated", loadState);
            window.removeEventListener("ai-selected-models-updated", loadState);
            window.removeEventListener(
                "ai-parallel-settings-updated",
                loadState
            );
            window.removeEventListener("ai-models-catalog-updated", loadState);
            window.removeEventListener("ai-active-mode-updated", loadState);
        };
    }, [router, sessionIdFromUrl]);

    const modelInfoMap = useMemo(() => {
        const map = new Map<string, ModelCatalogItem>();

        for (const item of modelsCatalog) {
            const modelId = String(item.model_id || "").trim();
            if (modelId) {
                map.set(modelId, item);
            }
        }

        return map;
    }, [modelsCatalog]);

    const modelWindows = useMemo(() => {
        if (visibleModelIds.length > 0) {
            return visibleModelIds.map((modelId, index) => {
                const info = modelInfoMap.get(modelId);

                return {
                    modelId,
                    displayName:
                        info?.display_name?.trim() ||
                        modelId ||
                        `Модель ${index + 1}`,
                    provider: info?.provider?.trim() || "AI",
                };
            });
        }

        return [
            {
                modelId: "",
                displayName: "Выбери модель",
                provider: "AI",
            },
        ];
    }, [modelInfoMap, visibleModelIds]);

    const messageTurns = useMemo(() => {
        const turns: Array<{
            user: ChatMessage;
            assistants: ChatMessage[];
        }> = [];
        let currentTurn: { user: ChatMessage; assistants: ChatMessage[] } | null =
            null;

        for (const item of messages) {
            if (item.role === "user") {
                currentTurn = {
                    user: item,
                    assistants: [],
                };
                turns.push(currentTurn);
                continue;
            }

            if (!currentTurn) {
                continue;
            }

            currentTurn.assistants.push(item);
        }

        return turns;
    }, [messages]);

    const windowCount =
        uiMode === "video"
            ? 1
            : uiMode === "image"
            ? 1
            : Math.max(modelWindows.length, parallelCount, 1);

    const getWindowMessages = (modelId: string) => {
        if (!modelId) {
            return messageTurns.flatMap((turn) => [turn.user, ...turn.assistants]);
        }

        return messageTurns.flatMap((turn) => {
            const turnAssistants = turn.assistants.filter(
                (assistant) => assistant.model_id === modelId
            );

            if (turnAssistants.length === 0) {
                return [];
            }

            return [turn.user, ...turnAssistants];
        });
    };

    const latestAssistantMessage = [...messages]
        .reverse()
        .find((item) => item.role === "assistant");

    const imageWindowModelId = latestAssistantMessage?.model_id || "";
    const imageWindowModelInfo = imageWindowModelId
        ? modelInfoMap.get(imageWindowModelId)
        : undefined;
    const imageWindowDisplayName =
        latestAssistantMessage?.model_display_name ||
        imageWindowModelInfo?.display_name ||
        "Генерация изображения";
    const imageWindowProvider =
        imageWindowModelInfo?.provider?.trim() || "AI";

    const chatWindows = Array.from({ length: windowCount }, (_, index) => {
        return (
            modelWindows[index] || {
                modelId: "",
                displayName: `Окно ${index + 1}`,
                provider: "AI",
            }
        );
    });

    const renderEmptyWorkspace = (label: string) => (
        <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-25/60 px-4 text-center">
            <div className="text-[13px] font-medium text-gray-700">{label}</div>
            <div className="mt-1 text-[12px] text-gray-500">
                Результат появится в этом окне
            </div>
        </div>
    );

    const renameCurrentChat = (nextTitle: string) => {
        const session = ensureSession(sessionIdFromUrl);

        const sessions = readSessions().map((item) =>
            item.id === session.id
                ? {
                      ...item,
                      title: nextTitle,
                      updatedAt: Date.now(),
                  }
                : item
        );

        saveSessions(sessions);
        setSessionTitle(nextTitle);
    };

    return (
        <Layout
            title={sessionTitle}
            onRenameTitle={renameCurrentChat}
            classWrapper="flex h-full min-h-0 flex-col overflow-hidden px-3 pb-2 pt-2 md:px-4 md:pb-3 md:pt-3"
        >
            <div className="flex min-h-0 flex-1 flex-col">
                <div
                    className={`grid h-full min-h-0 auto-rows-fr gap-3 ${getGridClassName(
                        windowCount
                    )}`}
                >
                    {uiMode === "chat" &&
                        chatWindows.map((windowItem, windowIndex) => {
                            const windowMessages = getWindowMessages(
                                windowItem.modelId
                            );

                            return (
                                <div
                                    key={`${windowItem.modelId || "empty"}-${windowIndex}`}
                                    className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white"
                                >
                                    <div className="border-b border-gray-100 px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="relative shrink-0">
                                                <Image
                                                    className="h-4 w-4 rounded-full object-contain"
                                                    src={getModelLogoSrc(
                                                        windowItem.modelId,
                                                        windowItem.provider
                                                    )}
                                                    width={16}
                                                    height={16}
                                                    alt={
                                                        windowItem.displayName ||
                                                        "Модель"
                                                    }
                                                />
                                            </div>

                                            <div className="min-w-0 leading-none">
                                                <div className="truncate text-[13px] font-medium leading-4 text-primary-300">
                                                    {windowItem.displayName}
                                                </div>
                                                <div className="truncate text-[10px] leading-[11px] text-gray-500">
                                                    {windowItem.provider}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="min-h-0 flex-1 overflow-auto p-3">
                                        <div className="flex flex-col gap-3">
                                            {windowMessages.length === 0 ? (
                                                renderEmptyWorkspace(
                                                    "Здесь появится ответ этой модели"
                                                )
                                            ) : (
                                                windowMessages.map((item) => (
                                                    <React.Fragment key={item.id}>
                                                        {item.role === "user" ? (
                                                            <Message
                                                                attachedFileName={
                                                                    item.attached_file_name
                                                                }
                                                                attachedFileMimeType={
                                                                    item.attached_file_mime_type
                                                                }
                                                            >
                                                                {item.content}
                                                            </Message>
                                                        ) : (
                                                            <Answer
                                                                messageId={item.id}
                                                                modelId={
                                                                    item.model_id ||
                                                                    windowItem.modelId
                                                                }
                                                                modelProvider={
                                                                    modelInfoMap.get(
                                                                        item.model_id ||
                                                                            windowItem.modelId
                                                                    )?.provider ||
                                                                    windowItem.provider
                                                                }
                                                                modelLabel={
                                                                    item.model_display_name ||
                                                                    modelInfoMap.get(
                                                                        item.model_id ||
                                                                            windowItem.modelId
                                                                    )?.display_name ||
                                                                    windowItem.displayName
                                                                }
                                                            >
                                                                {item.content}
                                                            </Answer>
                                                        )}
                                                    </React.Fragment>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                    {uiMode === "image" && (
                        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white">
                            <div className="border-b border-gray-100 px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <div className="relative shrink-0">
                                        <Image
                                            className="h-4 w-4 rounded-full object-contain"
                                            src={getModelLogoSrc(
                                                imageWindowModelId,
                                                imageWindowProvider
                                            )}
                                            width={16}
                                            height={16}
                                            alt={imageWindowDisplayName}
                                        />
                                    </div>

                                    <div className="min-w-0 leading-none">
                                        <div className="truncate text-[13px] font-medium leading-4 text-primary-300">
                                            {imageWindowDisplayName}
                                        </div>
                                        <div className="truncate text-[10px] leading-[11px] text-gray-500">
                                            {imageWindowProvider}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="min-h-0 flex-1 overflow-auto p-3">
                                <div className="flex flex-col gap-3">
                                    {messages.length === 0 ? (
                                        renderEmptyWorkspace(
                                            "Здесь появится сгенерированное изображение"
                                        )
                                    ) : (
                                        messages.map((item) => {
                                            const itemModelId =
                                                item.model_id || imageWindowModelId;
                                            const itemModelInfo = itemModelId
                                                ? modelInfoMap.get(itemModelId)
                                                : undefined;

                                            return (
                                                <React.Fragment key={item.id}>
                                                    {item.role === "user" ? (
                                                        <Message
                                                            attachedFileName={
                                                                item.attached_file_name
                                                            }
                                                            attachedFileMimeType={
                                                                item.attached_file_mime_type
                                                            }
                                                        >
                                                            {item.content}
                                                        </Message>
                                                    ) : (
                                                        <Answer
                                                            messageId={item.id}
                                                            modelId={itemModelId}
                                                            modelProvider={
                                                                itemModelInfo?.provider ||
                                                                imageWindowProvider
                                                            }
                                                            modelLabel={
                                                                item.model_display_name ||
                                                                itemModelInfo?.display_name ||
                                                                imageWindowDisplayName
                                                            }
                                                        >
                                                            {item.content}
                                                        </Answer>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {uiMode === "video" && (
                        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-3">
                            {renderEmptyWorkspace("Окно предпросмотра видео")}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default ChatPage;
