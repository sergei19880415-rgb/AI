"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import TextInputDialog from "@/components/TextInputDialog";
import { removeSessionUiSettings } from "@/lib/chatSessionUi";

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

type ChatSession = {
    id: string;
    title: string;
    messages: ChatMessage[];
    updatedAt: number;
    folder?: string;
    isPinned?: boolean;
};

const getUserEmail = () => {
    return (localStorage.getItem("ai_user_email") || "guest").trim();
};

const getSessionsKey = () => {
    return `ai_sessions_${getUserEmail()}`;
};

const getProjectsKey = () => {
    return `ai_projects_${getUserEmail()}`;
};

const readSessions = (): ChatSession[] => {
    try {
        const raw = localStorage.getItem(getSessionsKey());
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed;
    } catch {
        return [];
    }
};

const saveSessions = (sessions: ChatSession[]) => {
    localStorage.setItem(getSessionsKey(), JSON.stringify(sessions));
    window.dispatchEvent(new Event("ai-chat-sessions-updated"));
    window.dispatchEvent(new Event("ai-chat-updated"));
};

const readProjects = (): string[] => {
    try {
        const raw = localStorage.getItem(getProjectsKey());
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed
            .map((item) => String(item || "").trim())
            .filter(Boolean);
    } catch {
        return [];
    }
};

const saveProjects = (projects: string[]) => {
    const uniqueProjects = [
        ...new Set(projects.map((item) => item.trim()).filter(Boolean)),
    ];
    localStorage.setItem(getProjectsKey(), JSON.stringify(uniqueProjects));
    window.dispatchEvent(new Event("ai-projects-updated"));
    window.dispatchEvent(new Event("ai-chat-sessions-updated"));
    window.dispatchEvent(new Event("ai-chat-updated"));
};

const sortSessions = (sessions: ChatSession[]) => {
    return [...sessions].sort((a, b) => {
        const pinA = a.isPinned ? 1 : 0;
        const pinB = b.isPinned ? 1 : 0;

        if (pinA !== pinB) {
            return pinB - pinA;
        }

        return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
};

const RecentChats = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeId = searchParams.get("id") || "";

    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [openedMenuId, setOpenedMenuId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
    const [projectSessionId, setProjectSessionId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const loadSessions = () => {
            setSessions(sortSessions(readSessions()));
        };

        loadSessions();

        window.addEventListener("ai-chat-sessions-updated", loadSessions);
        window.addEventListener("ai-chat-updated", loadSessions);

        return () => {
            window.removeEventListener("ai-chat-sessions-updated", loadSessions);
            window.removeEventListener("ai-chat-updated", loadSessions);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!menuRef.current) return;

            if (!menuRef.current.contains(event.target as Node)) {
                setOpenedMenuId(null);
                setConfirmDeleteId(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const visibleSessions = useMemo(() => {
        return sessions.filter((item) => !item.folder?.trim());
    }, [sessions]);

    const groupedData = useMemo(() => {
        const pinned = visibleSessions.filter((item) => item.isPinned);
        const regular = visibleSessions.filter((item) => !item.isPinned);

        return {
            pinned: sortSessions(pinned),
            regular: sortSessions(regular),
        };
    }, [visibleSessions]);

    const renameChat = (sessionId: string, nextTitle: string) => {
        const nextSessions = sessions.map((item) =>
            item.id === sessionId
                ? {
                      ...item,
                      title: nextTitle,
                      updatedAt: Date.now(),
                  }
                : item
        );

        saveSessions(sortSessions(nextSessions));
        setOpenedMenuId(null);
    };

    const moveToProject = (sessionId: string, nextProject: string) => {
        const existingProjects = readProjects();
        const cleanProject = nextProject.trim();

        const nextSessions = sessions.map((item) =>
            item.id === sessionId
                ? {
                      ...item,
                      folder: cleanProject || undefined,
                      updatedAt: Date.now(),
                  }
                : item
        );

        saveSessions(sortSessions(nextSessions));

        if (cleanProject) {
            saveProjects([...existingProjects, cleanProject]);
        }

        setOpenedMenuId(null);
    };

    const togglePin = (sessionId: string) => {
        const nextSessions = sessions.map((item) =>
            item.id === sessionId
                ? {
                      ...item,
                      isPinned: !item.isPinned,
                      updatedAt: Date.now(),
                  }
                : item
        );

        saveSessions(sortSessions(nextSessions));
        setOpenedMenuId(null);
    };

    const deleteChat = (sessionId: string) => {
        const nextSessions = sessions.filter((item) => item.id !== sessionId);
        saveSessions(sortSessions(nextSessions));
        removeSessionUiSettings(sessionId);

        const currentSessionKey = `ai_current_session_${getUserEmail()}`;
        const savedCurrentId = localStorage.getItem(currentSessionKey) || "";

        if (savedCurrentId === sessionId) {
            if (nextSessions.length > 0) {
                localStorage.setItem(currentSessionKey, nextSessions[0].id);
                window.location.href = `/chat?id=${nextSessions[0].id}`;
            } else {
                localStorage.removeItem(currentSessionKey);
                window.location.href = "/chat";
            }
        }

        setConfirmDeleteId(null);
        setOpenedMenuId(null);
    };

    const renderChatRow = (item: ChatSession) => {
        const isActive = pathname.startsWith("/chat") && item.id === activeId;

        return (
            <div
                key={item.id}
                className={`group relative flex items-center gap-1 rounded-lg border transition-colors ${
                    isActive
                        ? "border-primary-200 bg-primary-0/60"
                        : "border-transparent hover:bg-gray-50"
                }`}
            >
                <Link
                    href={`/chat?id=${item.id}`}
                    className="min-w-0 flex-1 px-3 py-1.5"
                >
                    <div className="flex items-center gap-2">
                        {item.isPinned && (
                            <Icon
                                className={`