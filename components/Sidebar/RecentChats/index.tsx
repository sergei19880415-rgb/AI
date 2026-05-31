"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import TextInputDialog from "@/components/TextInputDialog";
import { deleteChatEverywhere } from "@/lib/deleteChatEverywhere";
import { getUserScopedKey } from "@/lib/userStorage";

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


const getSessionsKey = () => {
    return getUserScopedKey("ai_sessions_");
};

const getProjectsKey = () => {
    return getUserScopedKey("ai_projects_");
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
    const [existingProjects, setExistingProjects] = useState<string[]>([]);
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
        const loadProjects = () => {
            setExistingProjects(readProjects());
        };

        loadProjects();

        window.addEventListener("ai-projects-updated", loadProjects);

        return () => {
            window.removeEventListener("ai-projects-updated", loadProjects);
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

    const moveToProject = (sessionId: string, nextProject: string) => {
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
        const result = deleteChatEverywhere(sessionId);

        if (result.wasCurrentSession) {
            window.location.href = result.nextCurrentSessionId
                ? `/chat?id=${result.nextCurrentSessionId}`
                : "/chat";
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
                                className={`shrink-0 ${
                                    isActive ? "fill-primary-300" : "fill-gray-400"
                                }`}
                                name="box-fill"
                            />
                        )}

                        <div className="min-w-0 flex-1">
                            <div
                                className={`truncate text-[13px] ${
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
                            setConfirmDeleteId(null);
                        }}
                    >
                        <Icon name="dots" className="fill-current" />
                    </button>

                    {openedMenuId === item.id && (
                        <div className="absolute right-0 top-9 z-20 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
                            <button
                                type="button"
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => {
                                    setRenameSessionId(item.id);
                                    setOpenedMenuId(null);
                                }}
                            >
                                <Icon name="pencil" className="fill-gray-500" />
                                <span>Переименовать</span>
                            </button>

                            <button
                                type="button"
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => {
                                    setProjectSessionId(item.id);
                                    setOpenedMenuId(null);
                                }}
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
                                onClick={() => setConfirmDeleteId(item.id)}
                            >
                                <Icon name="trash" className="fill-red-500" />
                                <span>Удалить</span>
                            </button>
                        </div>
                    )}

                    {confirmDeleteId === item.id && (
                        <div className="absolute right-0 top-9 z-30 w-[250px] rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
                            <div className="text-sm font-medium text-gray-900">
                                Удалить чат?
                            </div>
                            <div className="mt-1 text-[12px] leading-5 text-gray-500">
                                Чат “{item.title || "Новый чат"}” будет удален из списка.
                            </div>
                            <div className="mt-3 flex gap-2">
                                <button
                                    type="button"
                                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    onClick={() => setConfirmDeleteId(null)}
                                >
                                    Отмена
                                </button>
                                <button
                                    type="button"
                                    className="flex-1 rounded-xl bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
                                    onClick={() => deleteChat(item.id)}
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renameSession = sessions.find((item) => item.id === renameSessionId);
    const projectSession = sessions.find((item) => item.id === projectSessionId);

    return (
        <>
            <div className="px-3 py-2">
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

            <TextInputDialog
                open={!!renameSession}
                onClose={() => setRenameSessionId(null)}
                title="Переименовать чат"
                label="Новое название"
                placeholder="Введите название чата"
                initialValue={renameSession?.title || ""}
                confirmLabel="Сохранить"
                onConfirm={(value) => {
                    if (!renameSession) return;
                    renameChat(renameSession.id, value);
                }}
            />

            <TextInputDialog
                open={!!projectSession}
                onClose={() => setProjectSessionId(null)}
                title="Перенести чат в проект"
                label={
                    existingProjects.length
                        ? `Существующие проекты: ${existingProjects.join(", ")}`
                        : "Введи имя проекта"
                }
                placeholder="Например, Важное"
                initialValue={projectSession?.folder || ""}
                confirmLabel="Сохранить"
                allowEmpty
                onConfirm={(value) => {
                    if (!projectSession) return;
                    moveToProject(projectSession.id, value);
                }}
            />
        </>
    );
};

export default RecentChats;
