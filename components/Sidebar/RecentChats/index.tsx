"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";

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

    const renameChat = (sessionId: string) => {
        const current = sessions.find((item) => item.id === sessionId);
        if (!current) return;

        const nextTitle = window.prompt("Новое название чата", current.title);

        if (nextTitle === null) return;

        const cleanTitle = nextTitle.trim();
        if (!cleanTitle) return;

        const nextSessions = sessions.map((item) =>
            item.id === sessionId
                ? {
                      ...item,
                      title: cleanTitle,
                      updatedAt: Date.now(),
                  }
                : item
        );

        saveSessions(sortSessions(nextSessions));
        setOpenedMenuId(null);
    };

    const moveToProject = (sessionId: string) => {
        const current = sessions.find((item) => item.id === sessionId);
        if (!current) return;

        const existingProjects = readProjects();
        const currentProject = current.folder || "";
        const hint = existingProjects.length
            ? `Существующие проекты: ${existingProjects.join(", ")}`
            : "Введите имя проекта";

        const nextProject = window.prompt(
            `${hint}\n\nИмя проекта. Оставь пустым, чтобы убрать из проекта`,
            currentProject
        );

        if (nextProject === null) return;

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
        const current = sessions.find((item) => item.id === sessionId);
        if (!current) return;

        const isConfirmed = window.confirm(`Удалить чат "${current.title}"?`);

        if (!isConfirmed) return;

        const nextSessions = sessions.filter((item) => item.id !== sessionId);
        saveSessions(sortSessions(nextSessions));

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

        setOpenedMenuId(null);
    };

    const renderChatRow = (item: ChatSession) => {
        const isActive = pathname.startsWith("/chat") && item.id === activeId;

        return (
            <div
                key={item.id}
                className={`group relative flex items-center gap-1 rounded-xl border transition-colors ${
                    isActive
                        ? "border-[#E9D5FF] bg-[#F8F3FF] shadow-[inset_3px_0_0_0_#8B5CF6]"
                        : "border-transparent hover:bg-gray-50"
                }`}
            >
                <Link
                    href={`/chat?id=${item.id}`}
                    className="min-w-0 flex-1 px-3 py-2"
                >
                    <div className="flex items-center gap-2">
                        {item.isPinned && (
                            <Icon
                                className={`shrink-0 ${
                                    isActive ? "fill-primary-300" : "fill-gray-400"
                                }`}
                                name="box-fill"
                            />
                        )}

                        <div className="min-w-0 flex-1">
                            <div
                                className={`truncate text-body-sm ${
                                    isActive
                                        ? "font-medium text-gray-900"
                                        : "text-gray-700"
                                }`}
                            >
                                {item.title || "Новый чат"}
                            </div>
                        </div>
                    </div>
                </Link>

                <div
                    className="relative pr-2"
                    ref={openedMenuId === item.id ? menuRef : null}
                >
                    <button
                        type="button"
                        className={`flex size-8 items-center justify-center rounded-lg transition ${
                            isActive
                                ? "text-gray-600 hover:bg-[#EFE4FF] hover:text-gray-900"
                                : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        }`}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenedMenuId((prev) =>
                                prev === item.id ? null : item.id
                            );
                        }}
                    >
                        <Icon name="dots" className="fill-current" />
                    </button>

                    {openedMenuId === item.id && (
                        <div className="absolute right-0 top-9 z-20 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
                            <button
                                type="button"
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => renameChat(item.id)}
                            >
                                <Icon name="pencil" className="fill-gray-500" />
                                <span>Переименовать</span>
                            </button>

                            <button
                                type="button"
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => moveToProject(item.id)}
                            >
                                <Icon name="box" className="fill-gray-500" />
                                <span>Перенести в проект</span>
                            </button>

                            <button
                                type="button"
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => togglePin(item.id)}
                            >
                                <Icon name="box-fill" className="fill-gray-500" />
                                <span>
                                    {item.isPinned ? "Открепить чат" : "Закрепить чат"}
                                </span>
                            </button>

                            <div className="my-1 h-px bg-gray-100" />

                            <button
                                type="button"
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                                onClick={() => deleteChat(item.id)}
                            >
                                <Icon name="trash" className="fill-red-500" />
                                <span>Удалить</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="px-3 py-3">
            <div className="mb-1.5 pl-2 text-[11px] font-medium tracking-wide text-gray-400">
                Ваши чаты
            </div>

            <div className="flex flex-col gap-1">
                {visibleSessions.length === 0 && (
                    <div className="px-3 py-2 text-body-sm text-gray-400">
                        Пока нет чатов
                    </div>
                )}

                {groupedData.pinned.length > 0 && (
                    <div className="mb-1">
                        <div className="px-2 pb-1 text-[11px] font-medium tracking-wide text-gray-400">
                            Закреплённые
                        </div>
                        <div className="flex flex-col gap-0.5">
                            {groupedData.pinned.map(renderChatRow)}
                        </div>
                    </div>
                )}

                {groupedData.regular.length > 0 && (
                    <div className="mb-1">
                        {groupedData.pinned.length > 0 && (
                            <div className="px-2 pb-1 text-[11px] font-medium tracking-wide text-gray-400">
                                Остальные
                            </div>
                        )}
                        <div className="flex flex-col gap-0.5">
                            {groupedData.regular.map(renderChatRow)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentChats;