"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AnimateHeight from "react-animate-height";
import Image from "@/components/Image";
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

type ProjectMeta = {
    name: string;
    image: string;
};

type ProjectGroup = {
    title: string;
    image: string;
    chats: ChatSession[];
};

const fallbackProjectIcons = [
    "/images/hap.svg",
    "/images/dollar-circle.svg",
    "/images/folder.svg",
    "/images/logo.svg",
];

const getUserEmail = () => {
    return (localStorage.getItem("ai_user_email") || "guest").trim();
};

const getSessionsKey = () => {
    return `ai_sessions_${getUserEmail()}`;
};

const getProjectsKey = () => {
    return `ai_projects_${getUserEmail()}`;
};

const getProjectsMetaKey = () => {
    return `ai_projects_meta_${getUserEmail()}`;
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

const readProjects = (): string[] => {
    try {
        const raw = localStorage.getItem(getProjectsKey());
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return [
            ...new Set(
                parsed.map((item) => String(item || "").trim()).filter(Boolean)
            ),
        ];
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

const readProjectsMeta = (): ProjectMeta[] => {
    try {
        const raw = localStorage.getItem(getProjectsMetaKey());
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed
            .map((item) => ({
                name: String(item?.name || "").trim(),
                image: String(item?.image || "").trim(),
            }))
            .filter((item) => item.name && item.image);
    } catch {
        return [];
    }
};

const saveProjectsMeta = (items: ProjectMeta[]) => {
    const uniqueMap = new Map<string, ProjectMeta>();

    items.forEach((item) => {
        const key = item.name.trim().toLowerCase();
        if (!key) return;

        uniqueMap.set(key, {
            name: item.name.trim(),
            image: item.image.trim(),
        });
    });

    localStorage.setItem(
        getProjectsMetaKey(),
        JSON.stringify(Array.from(uniqueMap.values()))
    );

    window.dispatchEvent(new Event("ai-projects-updated"));
    window.dispatchEvent(new Event("ai-chat-sessions-updated"));
    window.dispatchEvent(new Event("ai-chat-updated"));
};

const Space = () => {
    const searchParams = useSearchParams();
    const activeChatId = searchParams.get("id") || "";

    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [projects, setProjects] = useState<string[]>([]);
    const [projectsMeta, setProjectsMeta] = useState<ProjectMeta[]>([]);
    const [openedProject, setOpenedProject] = useState<string | null>(null);
    const [openedMenuId, setOpenedMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const loadData = () => {
            setSessions(readSessions());
            setProjects(readProjects());
            setProjectsMeta(readProjectsMeta());
        };

        loadData();

        window.addEventListener("ai-chat-sessions-updated", loadData);
        window.addEventListener("ai-chat-updated", loadData);
        window.addEventListener("ai-projects-updated", loadData);

        return () => {
            window.removeEventListener("ai-chat-sessions-updated", loadData);
            window.removeEventListener("ai-chat-updated", loadData);
            window.removeEventListener("ai-projects-updated", loadData);
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

    const projectGroups = useMemo<ProjectGroup[]>(() => {
        const sessionFolders = sessions
            .map((item) => item.folder?.trim() || "")
            .filter(Boolean);

        const allProjects = [...new Set([...projects, ...sessionFolders])];

        return allProjects
            .sort((a, b) => a.localeCompare(b, "ru"))
            .map((projectName, index) => {
                const meta = projectsMeta.find(
                    (item) =>
                        item.name.toLowerCase() === projectName.toLowerCase()
                );

                return {
                    title: projectName,
                    image:
                        meta?.image ||
                        fallbackProjectIcons[index % fallbackProjectIcons.length],
                    chats: sessions
                        .filter(
                            (item) => (item.folder || "").trim() === projectName
                        )
                        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
                };
            });
    }, [projects, projectsMeta, sessions]);

    useEffect(() => {
        if (!projectGroups.length) {
            setOpenedProject(null);
            return;
        }

        const projectWithActiveChat = projectGroups.find((project) =>
            project.chats.some((chat) => chat.id === activeChatId)
        );

        if (projectWithActiveChat) {
            setOpenedProject(projectWithActiveChat.title);
            return;
        }

        if (
            !openedProject ||
            !projectGroups.some((item) => item.title === openedProject)
        ) {
            setOpenedProject(projectGroups[0].title);
        }
    }, [projectGroups, activeChatId, openedProject]);

    const openCreateProjectModal = () => {
        window.dispatchEvent(new Event("ai-open-project-create-modal"));
    };

    const renameProject = (projectName: string) => {
        const nextName = window.prompt("Новое название проекта", projectName);

        if (nextName === null) return;

        const cleanName = nextName.trim();
        if (!cleanName || cleanName === projectName) {
            setOpenedMenuId(null);
            return;
        }

        const currentProjects = readProjects();

        if (
            currentProjects.some(
                (item) =>
                    item.toLowerCase() === cleanName.toLowerCase() &&
                    item.toLowerCase() !== projectName.toLowerCase()
            )
        ) {
            window.alert("Такой проект уже есть");
            return;
        }

        const nextProjects = currentProjects.map((item) =>
            item === projectName ? cleanName : item
        );

        const nextSessions = readSessions().map((item) =>
            (item.folder || "").trim() === projectName
                ? {
                      ...item,
                      folder: cleanName,
                      updatedAt: Date.now(),
                  }
                : item
        );

        const nextMeta = readProjectsMeta().map((item) =>
            item.name === projectName
                ? {
                      ...item,
                      name: cleanName,
                  }
                : item
        );

        saveProjects(nextProjects);
        saveSessions(nextSessions);
        saveProjectsMeta(nextMeta);

        setOpenedProject(cleanName);
        setOpenedMenuId(null);
    };

    const deleteProject = (projectName: string) => {
        const chatsInProject = sessions.filter(
            (item) => (item.folder || "").trim() === projectName
        );

        const isConfirmed = window.confirm(
            chatsInProject.length > 0
                ? `Удалить проект "${projectName}" и убрать из него ${chatsInProject.length} чат(ов)?`
                : `Удалить проект "${projectName}"?`
        );

        if (!isConfirmed) return;

        const nextProjects = readProjects().filter((item) => item !== projectName);

        const nextSessions = readSessions().map((item) =>
            (item.folder || "").trim() === projectName
                ? {
                      ...item,
                      folder: undefined,
                      updatedAt: Date.now(),
                  }
                : item
        );

        const nextMeta = readProjectsMeta().filter(
            (item) => item.name !== projectName
        );

        saveProjects(nextProjects);
        saveSessions(nextSessions);
        saveProjectsMeta(nextMeta);

        setOpenedMenuId(null);
    };

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

        saveSessions(nextSessions);
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

        saveSessions(nextSessions);

        if (cleanProject) {
            saveProjects([...existingProjects, cleanProject]);
            setOpenedProject(cleanProject);
        }

        setOpenedMenuId(null);
    };

    const removeFromProject = (sessionId: string) => {
        const nextSessions = sessions.map((item) =>
            item.id === sessionId
                ? {
                      ...item,
                      folder: undefined,
                      updatedAt: Date.now(),
                  }
                : item
        );

        saveSessions(nextSessions);
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

        saveSessions(nextSessions);
        setOpenedMenuId(null);
    };

    const deleteChat = (sessionId: string) => {
        const current = sessions.find((item) => item.id === sessionId);
        if (!current) return;

        const isConfirmed = window.confirm(`Удалить чат "${current.title}"?`);
        if (!isConfirmed) return;

        const nextSessions = sessions.filter((item) => item.id !== sessionId);
        saveSessions(nextSessions);

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

    const renderProjectChatRow = (chat: ChatSession) => {
        const isActive = chat.id === activeChatId;

        return (
            <div
                key={chat.id}
                className={`group relative flex items-center gap-1 rounded-xl border transition-colors ${
                    isActive
                        ? "border-[#E9D5FF] bg-[#F8F3FF] shadow-[inset_3px_0_0_0_#8B5CF6]"
                        : "border-transparent hover:bg-gray-50"
                }`}
            >
                <Link
                    href={`/chat?id=${chat.id}`}
                    className="min-w-0 flex-1 pl-9 pr-2 py-2"
                >
                    <div className="relative flex items-center">
                        <span className="absolute -left-4 top-1/2 h-3.5 -translate-y-1/2 border-l border-dashed border-gray-200" />

                        {chat.isPinned && (
                            <Icon
                                className={`mr-2 shrink-0 ${
                                    isActive ? "fill-primary-300" : "fill-gray-400"
                                }`}
                                name="box-fill"
                            />
                        )}

                        <span
                            className={`truncate text-body-sm ${
                                isActive
                                    ? "font-medium text-gray-900"
                                    : "text-gray-700"
                            }`}
                        >
                            {chat.title || "Новый чат"}
                        </span>
                    </div>
                </Link>

                <div
                    className="relative pr-1.5"
                    ref={openedMenuId === `chat-${chat.id}` ? menuRef : null}
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
                                prev === `chat-${chat.id}` ? null : `chat-${chat.id}`
                            );
                        }}
                    >
                        <Icon name="dots" className="fill-current" />
                    </button>

                    {openedMenuId === `chat-${chat.id}` && (
                        <div className="absolute right-0 top-8 z-20 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
                            <button
                                type="button"
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => renameChat(chat.id)}
                            >
                                <Icon name="pencil" className="fill-gray-500" />
                                <span>Переименовать</span>
                            </button>

                            <button
                                type="button"
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => moveToProject(chat.id)}
                            >
                                <Icon name="box" className="fill-gray-500" />
                                <span>Перенести в проект</span>
                            </button>

                            <button
                                type="button"
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => togglePin(chat.id)}
                            >
                                <Icon name="box-fill" className="fill-gray-500" />
                                <span>
                                    {chat.isPinned ? "Открепить чат" : "Закрепить чат"}
                                </span>
                            </button>

                            <button
                                type="button"
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => removeFromProject(chat.id)}
                            >
                                <Icon name="close" className="fill-gray-500" />
                                <span>Удалить из проекта</span>
                            </button>

                            <div className="my-1 h-px bg-gray-100" />

                            <button
                                type="button"
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                                onClick={() => deleteChat(chat.id)}
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
        <div className="border-b border-gray-100 px-3 py-3">
            <div className="mb-1.5 pl-2 text-[11px] font-medium tracking-wide text-gray-400">
                Проекты
            </div>

            <button
                type="button"
                className="group mb-1.5 flex h-9 w-full items-center gap-2 rounded-lg px-3 text-body-sm text-gray-500 transition-colors hover:text-gray-900"
                onClick={openCreateProjectModal}
            >
                <Icon
                    className="fill-gray-500 transition-colors group-hover:fill-gray-900"
                    name="folders"
                />
                Новый проект
            </button>

            {projectGroups.length > 0 && (
                <div className="flex flex-col gap-1">
                    {projectGroups.map((project) => {
                        const isOpen = openedProject === project.title;
                        const hasActiveChat = project.chats.some(
                            (chat) => chat.id === activeChatId
                        );

                        return (
                            <div key={project.title}>
                                <div
                                    className="group flex items-center gap-2"
                                    ref={
                                        openedMenuId === `project-${project.title}`
                                            ? menuRef
                                            : null
                                    }
                                >
                                    <button
                                        type="button"
                                        className={`group flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl px-3 text-left text-body-sm transition-colors ${
                                            hasActiveChat
                                                ? "bg-[#F8F3FF] text-gray-900"
                                                : "text-gray-700 hover:bg-gray-50"
                                        }`}
                                        onClick={() =>
                                            setOpenedProject((prev) =>
                                                prev === project.title
                                                    ? null
                                                    : project.title
                                            )
                                        }
                                    >
                                        <Image
                                            className="w-4 shrink-0 opacity-100"
                                            src={project.image}
                                            width={16}
                                            height={16}
                                            alt={project.title}
                                        />

                                        <span
                                            className={`truncate ${
                                                hasActiveChat ? "font-medium" : ""
                                            }`}
                                        >
                                            {project.title}
                                        </span>

                                        <span
                                            className={`ml-auto text-[11px] ${
                                                hasActiveChat
                                                    ? "text-primary-300"
                                                    : "text-gray-400"
                                            }`}
                                        >
                                            {project.chats.length}
                                        </span>

                                        <Icon
                                            className={`shrink-0 transition-all ${
                                                hasActiveChat
                                                    ? "fill-primary-300"
                                                    : "fill-gray-500"
                                            } ${isOpen ? "rotate-180" : ""}`}
                                            name="chevron"
                                        />
                                    </button>

                                    <div className="relative pr-1">
                                        <button
                                            type="button"
                                            className={`flex size-8 items-center justify-center rounded-lg transition ${
                                                hasActiveChat
                                                    ? "text-gray-600 hover:bg-[#EFE4FF] hover:text-gray-900"
                                                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                            }`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setOpenedMenuId((prev) =>
                                                    prev === `project-${project.title}`
                                                        ? null
                                                        : `project-${project.title}`
                                                );
                                            }}
                                        >
                                            <Icon name="dots" className="fill-current" />
                                        </button>

                                        {openedMenuId === `project-${project.title}` && (
                                            <div className="absolute right-0 top-8 z-20 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
                                                <button
                                                    type="button"
                                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                    onClick={() => renameProject(project.title)}
                                                >
                                                    <Icon name="pencil" className="fill-gray-500" />
                                                    <span>Переименовать</span>
                                                </button>

                                                <div className="my-1 h-px bg-gray-100" />

                                                <button
                                                    type="button"
                                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                                                    onClick={() => deleteProject(project.title)}
                                                >
                                                    <Icon name="trash" className="fill-red-500" />
                                                    <span>Удалить проект</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <AnimateHeight duration={300} height={isOpen ? "auto" : 0}>
                                    <div className="relative flex flex-col gap-0.5 pt-0.5">
                                        {project.chats.map(renderProjectChatRow)}
                                    </div>
                                </AnimateHeight>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Space;