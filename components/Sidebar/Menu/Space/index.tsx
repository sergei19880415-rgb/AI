"use client";

import { useMemo, useState } from "react";
import Field from "@/components/Field";
import Image from "@/components/Image";
import Button from "@/components/Button";

type Props = {
    onClose?: () => void;
};

type ProjectMeta = {
    name: string;
    image: string;
};

const categories = [
    {
        title: "Книга",
        image: "/images/book.svg",
    },
    {
        title: "Здоровье",
        image: "/images/health.svg",
    },
    {
        title: "Исследование",
        image: "/images/research.svg",
    },
    {
        title: "Путешествие",
        image: "/images/trip.svg",
    },
    {
        title: "Тексты",
        image: "/images/writing.svg",
    },
    {
        title: "Финансы",
        image: "/images/dollar-circle.svg",
    },
];

const getUserEmail = () => {
    return (localStorage.getItem("ai_user_email") || "guest").trim();
};

const getProjectsKey = () => {
    return `ai_projects_${getUserEmail()}`;
};

const getProjectsMetaKey = () => {
    return `ai_projects_meta_${getUserEmail()}`;
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
};

const Space = ({ onClose }: Props) => {
    const [name, setName] = useState("");
    const [categoryIndex, setCategoryIndex] = useState(0);
    const [error, setError] = useState("");

    const selectedCategory = useMemo(
        () => categories[categoryIndex] || categories[0],
        [categoryIndex]
    );

    const createProject = () => {
        const cleanName = name.trim();

        if (!cleanName) {
            setError("Введи название проекта");
            return;
        }

        const currentProjects = readProjects();

        const alreadyExists = currentProjects.some(
            (item) => item.toLowerCase() === cleanName.toLowerCase()
        );

        if (alreadyExists) {
            setError("Такой проект уже есть");
            return;
        }

        saveProjects([...currentProjects, cleanName]);

        const currentMeta = readProjectsMeta();
        saveProjectsMeta([
            ...currentMeta,
            {
                name: cleanName,
                image: selectedCategory.image,
            },
        ]);

        window.dispatchEvent(new Event("ai-projects-updated"));
        window.dispatchEvent(new Event("ai-chat-sessions-updated"));
        window.dispatchEvent(new Event("ai-chat-updated"));

        setName("");
        setCategoryIndex(0);
        setError("");

        if (onClose) {
            onClose();
        }
    };

    return (
        <>
            <div className="mb-8 pr-8 text-[32px] leading-8 font-semibold">
                Создать проект
            </div>

            <Field
                className="mb-4"
                label="Название проекта"
                placeholder="Введите название проекта"
                value={name}
                onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError("");
                }}
                required
            />

            <div className="flex gap-2 -mx-6 mb-4 px-6 overflow-x-auto scrollbar-none">
                {categories.map((item, index) => (
                    <div
                        className={`flex items-center gap-2 shrink-0 h-10 px-4 rounded-full border text-body-sm text-gray-700 cursor-pointer transition-colors ${
                            categoryIndex === index
                                ? "border-[#C33AB8]"
                                : "border-gray-50"
                        }`}
                        key={index}
                        onClick={() => setCategoryIndex(index)}
                    >
                        <Image
                            className="shrink-0 w-4"
                            src={item.image}
                            width={16}
                            height={16}
                            alt={item.title}
                        />
                        {item.title}
                    </div>
                ))}
            </div>

            {error && (
                <div className="mb-3 text-[12px] text-red-500">{error}</div>
            )}

            <Button
                className="w-full"
                isPrimary
                isSmall
                onClick={createProject}
            >
                Создать проект
            </Button>
        </>
    );
};

export default Space;