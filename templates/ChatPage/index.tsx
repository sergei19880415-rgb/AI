"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/Layout";
import Message from "@/components/Message";
import Answer from "@/components/Answer";

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    model_id?: string;
    model_display_name?: string;
};

type ChatSession = {
    id: string;
    title: string;
    messages: ChatMessage[];
    updatedAt: number;
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

const ChatPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionIdFromUrl = searchParams.get("id");
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        const loadMessages = () => {
            const session = ensureSession(sessionIdFromUrl);
            setMessages(session.messages || []);

            if (sessionIdFromUrl !== session.id) {
                router.replace(`/chat?id=${session.id}`);
            }
        };

        loadMessages();

        window.addEventListener("ai-chat-updated", loadMessages);

        return () => {
            window.removeEventListener("ai-chat-updated", loadMessages);
        };
    }, [router, sessionIdFromUrl]);

    return (
        <Layout classWrapper="wrapper flex flex-col gap-6">
            {messages.length === 0 ? (
                <div className="mt-10 text-center text-gray-500">
                    Напиши вопрос ниже, и здесь появится диалог
                </div>
            ) : (
                messages.map((item) => (
                    <React.Fragment key={item.id}>
                        {item.role === "user" ? (
                            <Message>{item.content}</Message>
                        ) : (
                            <Answer modelLabel={item.model_display_name}>
                                {item.content}
                            </Answer>
                        )}
                    </React.Fragment>
                ))
            )}
        </Layout>
    );
};

export default ChatPage;