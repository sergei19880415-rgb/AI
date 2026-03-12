"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import TextareaAutosize from "react-textarea-autosize";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import PreviewImage from "./PreviewImage";
import PreviewFile from "./PreviewFile";
import ChatFeatures from "./ChatFeatures";
import Attach from "./Attach";
import Language from "./Language";
import Audio from "./Audio";
import Voice from "./Voice";
import Time from "./Time";
import CloseLine from "./CloseLine";
import RecreateVideo from "./RecreateVideo";

const WEBHOOK_URL =
    "https://tgdomen.ru/webhook/3bcfce39-4b24-4493-b3a7-cab0030e8a36";

const FALLBACK_MODEL = "gpt-5-nano";
const FALLBACK_EMAIL = "Sergei19880415@gmail.com";

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

const getCurrentModelInfo = (): { modelId: string; displayName: string } => {
    const catalog = getModelsCatalog();
    const allowedModels = getAllowedModels();
    const savedSelected = localStorage.getItem(getSelectedModelKey()) || "";

    if (savedSelected && allowedModels.includes(savedSelected)) {
        const found = catalog.find((item) => item.model_id === savedSelected);

        return {
            modelId: savedSelected,
            displayName: (found?.display_name || savedSelected).trim(),
        };
    }

    const fallback = allowedModels[0] || FALLBACK_MODEL;
    const fallbackFromCatalog = catalog.find((item) => item.model_id === fallback);

    if (fallback) {
        localStorage.setItem(getSelectedModelKey(), fallback);
    }

    return {
        modelId: fallback,
        displayName: (fallbackFromCatalog?.display_name || fallback).trim(),
    };
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

const PanelMessage = () => {
    const searchParams = useSearchParams();
    const sessionIdFromUrl = searchParams.get("id") || "";
    const abortControllerRef = useRef<AbortController | null>(null);

    const [message, setMessage] = useState("");
    const [attachImage, setAttachImage] = useState(false);
    const [attachFile, setAttachFile] = useState(false);
    const [generateVideo, setGenerateVideo] = useState(false);
    const [isSending, setIsSending] = useState(false);

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

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    const sendMessage = async () => {
        const text = message.trim();
        if (!text || isSending) return;

        const currentUser =
            localStorage.getItem("ai_user_email") || FALLBACK_EMAIL;

        const currentModelInfo = getCurrentModelInfo();

        const sessions = readSessions();

        let currentSession =
            sessions.find((item) => item.id === sessionIdFromUrl) ||
            sessions.find(
                (item) =>
                    item.id === localStorage.getItem(getCurrentSessionKey())
            );

        if (!currentSession) {
            currentSession = {
                id: crypto.randomUUID(),
                title: "Новый чат",
                messages: [],
                updatedAt: Date.now(),
            };
            saveSessions([currentSession, ...sessions]);
            localStorage.setItem(getCurrentSessionKey(), currentSession.id);
            window.location.href = `/chat?id=${currentSession.id}`;
            return;
        }

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: text,
        };

        const loadingMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Печатает...",
            isLoading: true,
            model_id: currentModelInfo.modelId,
            model_display_name: currentModelInfo.displayName,
        };

        const nextMessages = [
            ...(currentSession.messages || []),
            userMessage,
            loadingMessage,
        ];

        const nextSessions = sessions.map((item) =>
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

        try {
            const history = nextMessages
                .filter((item) => !item.isLoading)
                .map((item) => ({
                    role: item.role,
                    content: item.content,
                }))
                .slice(-20);

            const controller = new AbortController();
            abortControllerRef.current = controller;

            const response = await fetch(WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_query: text,
                    model: currentModelInfo.modelId,
                    history,
                    user_email: currentUser,
                }),
                signal: controller.signal,
            });

            const raw = await response.text();

            let answerText = "";

            if (response.ok) {
                answerText = parseResponseText(raw, response.status);
            } else {
                answerText =
                    raw.trim() || `Ошибка сервера. status=${response.status}`;
            }

            const refreshedSessions = readSessions();
            const finalSessions = refreshedSessions.map((item) => {
                if (item.id !== currentSession!.id) return item;

                return {
                    ...item,
                    messages: item.messages.map((msg) =>
                        msg.id === loadingMessage.id
                            ? {
                                  id: msg.id,
                                  role: "assistant" as const,
                                  content: answerText,
                                  model_id: currentModelInfo.modelId,
                                  model_display_name:
                                      currentModelInfo.displayName,
                              }
                            : msg
                    ),
                    updatedAt: Date.now(),
                };
            });

            saveSessions(finalSessions);
        } catch (error) {
            const refreshedSessions = readSessions();

            if (
                error instanceof DOMException &&
                error.name === "AbortError"
            ) {
                const finalSessions = refreshedSessions.map((item) => {
                    if (item.id !== currentSession!.id) return item;

                    return {
                        ...item,
                        messages: item.messages.map((msg) =>
                            msg.id === loadingMessage.id
                                ? {
                                      id: msg.id,
                                      role: "assistant" as const,
                                      content: "Ответ остановлен",
                                      model_id: currentModelInfo.modelId,
                                      model_display_name:
                                          currentModelInfo.displayName,
                                  }
                                : msg
                        ),
                        updatedAt: Date.now(),
                    };
                });

                saveSessions(finalSessions);
            } else {
                const errorText =
                    error instanceof Error ? error.message : "Ошибка сети";

                const finalSessions = refreshedSessions.map((item) => {
                    if (item.id !== currentSession!.id) return item;

                    return {
                        ...item,
                        messages: item.messages.map((msg) =>
                            msg.id === loadingMessage.id
                                ? {
                                      id: msg.id,
                                      role: "assistant" as const,
                                      content: `Ошибка сети: ${errorText}`,
                                      model_id: currentModelInfo.modelId,
                                      model_display_name:
                                          currentModelInfo.displayName,
                                  }
                                : msg
                        ),
                        updatedAt: Date.now(),
                    };
                });

                saveSessions(finalSessions);
            }
        } finally {
            abortControllerRef.current = null;
            setIsSending(false);
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

    return (
        <div className="relative z-2 mx-auto w-full max-w-258 p-5 bg-gray-0 rounded-xl border border-gray-50 shadow-[0_3rem_6.25rem_0_rgba(17,12,46,0.15)] max-md:p-4">
            {generateVideo && (
                <CloseLine
                    title="Recreate Video"
                    onClose={() => setGenerateVideo(false)}
                />
            )}

            <div className="relative z-2 p-5 bg-gray-0 rounded-xl border border-gray-50 shadow-[0_3rem_6.25rem_0_rgba(17,12,46,0.15)] max-md:p-4">
                {attachImage && (
                    <PreviewImage onClose={() => setAttachImage(false)} />
                )}

                {attachFile && (
                    <PreviewFile onClose={() => setAttachFile(false)} />
                )}

                {generateVideo && <RecreateVideo />}

                <div className="relative pl-8 text-0">
                    <Icon
                        className="absolute top-1 left-0 fill-primary-200"
                        name="chat-ai-fill"
                    />

                    <TextareaAutosize
                        className="w-full min-h-[24px] text-body-md leading-6 text-gray-900 outline-none resize-none placeholder:text-gray-500 overflow-y-auto"
                        minRows={1}
                        maxRows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Напиши вопрос..."
                    />
                </div>

                <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center gap-2 mr-auto">
                        <ChatFeatures
                            onGenerateVideo={() => setGenerateVideo(true)}
                        />
                        {generateVideo && <Time />}
                        <Attach
                            onAttachImage={() => setAttachImage(true)}
                            onAttachFile={() => setAttachFile(true)}
                        />
                        <Language />
                    </div>

                    <Audio />
                    <Voice />

                    <Button
                        className="w-8 !px-0"
                        icon={isSending ? "close" : "arrow"}
                        isPrimary
                        isXSmall
                        onClick={isSending ? handleStop : sendMessage}
                        disabled={!isSending && !message.trim()}
                    />
                </div>
            </div>
        </div>
    );
};

export default PanelMessage;