"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/Layout";
import Message from "@/components/Message";
import Answer from "@/components/Answer";
import Image from "@/components/Image";

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

const getSelectedModelKey = () => {
    return `ai_selected_model_${getUserEmail()}`;
};

const getSelectedModelsKey = () => {
    return `ai_selected_models_${getUserEmail()}`;
};

const getParallelCountKey = () => {
    return `ai_parallel_count_${getUserEmail()}`;
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
        //
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

const ChatPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionIdFromUrl = searchParams.get("id");

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [visibleModelIds, setVisibleModelIds] = useState<string[]>([]);
    const [modelsCatalog, setModelsCatalog] = useState<ModelCatalogItem[]>([]);

    useEffect(() => {
        const loadState = () => {
            const session = ensureSession(sessionIdFromUrl);
            setMessages(session.messages || []);
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

        return () => {
            window.removeEventListener("ai-chat-updated", loadState);
            window.removeEventListener("ai-selected-model-updated", loadState);
            window.removeEventListener("ai-selected-models-updated", loadState);
            window.removeEventListener(
                "ai-parallel-settings-updated",
                loadState
            );
            window.removeEventListener("ai-models-catalog-updated", loadState);
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

    const getWindowMessages = (modelId: string, windowIndex: number) => {
        return messages.filter((item) => {
            if (item.role === "user") return true;

            if (!modelId) {
                return windowIndex === 0;
            }

            if (item.model_id) {
                return item.model_id === modelId;
            }

            return windowIndex === 0;
        });
    };

    return (
        <Layout classWrapper="flex h-full min-h-0 flex-col overflow-hidden px-3 pb-2 pt-2 md:px-4 md:pb-3 md:pt-3">
            {messages.length === 0 ? (
                <div className="flex min-h-0 flex-1 items-center justify-center text-center text-[14px] text-gray-500 md:text-[15px]">
                    Напиши вопрос ниже, и здесь появится диалог
                </div>
            ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                    <div
                        className={`grid h-full min-h-0 auto-rows-fr gap-3 ${getGridClassName(
                            modelWindows.length
                        )}`}
                    >
                        {modelWindows.map((windowItem, windowIndex) => {
                            const windowMessages = getWindowMessages(
                                windowItem.modelId,
                                windowIndex
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
                                                <div className="text-[12px] text-gray-400">
                                                    Здесь появится ответ этой
                                                    модели
                                                </div>
                                            ) : (
                                                windowMessages.map((item) => (
                                                    <React.Fragment
                                                        key={item.id}
                                                    >
                                                        {item.role === "user" ? (
                                                            <Message>
                                                                {item.content}
                                                            </Message>
                                                        ) : (
                                                            <Answer>
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
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default ChatPage;