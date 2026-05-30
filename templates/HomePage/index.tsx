"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import Image from "@/components/Image";
import { getUserScopedKey } from "@/lib/userStorage";

type UiMode = "chat" | "image" | "video";

type ModelCatalogItem = {
    model_id: string;
    display_name?: string;
    provider?: string;
};

const getSelectedModelKey = () => getUserScopedKey("ai_selected_model_");
const getSelectedModelsKey = () => getUserScopedKey("ai_selected_models_");
const getParallelCountKey = () => getUserScopedKey("ai_parallel_count_");
const getUiModeKey = () => getUserScopedKey("ai_ui_mode_");

const normalizePositiveInt = (value: unknown, fallback: number) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 1) return fallback;
    return Math.floor(num);
};

const getGridClassName = (count: number) => {
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 xl:grid-cols-2";
    if (count <= 4) return "grid-cols-1 lg:grid-cols-2";
    return "grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3";
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

const HomePage = () => {
    const [parallelCount, setParallelCount] = useState(1);
    const [uiMode, setUiMode] = useState<UiMode>("chat");
    const [modelsCatalog, setModelsCatalog] = useState<ModelCatalogItem[]>([]);
    const [visibleModelIds, setVisibleModelIds] = useState<string[]>([]);

    useEffect(() => {
        const loadState = () => {
            const nextParallel = normalizePositiveInt(
                localStorage.getItem(getParallelCountKey()),
                1
            );
            setParallelCount(nextParallel);

            const rawMode = (localStorage.getItem(getUiModeKey()) || "chat")
                .trim()
                .toLowerCase();
            setUiMode(rawMode === "image" ? "image" : rawMode === "video" ? "video" : "chat");

            try {
                const rawCatalog = localStorage.getItem("ai_models_catalog");
                const parsedCatalog = rawCatalog ? JSON.parse(rawCatalog) : [];
                setModelsCatalog(Array.isArray(parsedCatalog) ? parsedCatalog : []);
            } catch {
                setModelsCatalog([]);
            }

            let selectedModels: string[] = [];

            try {
                const rawSelected = localStorage.getItem(getSelectedModelsKey());
                if (rawSelected) {
                    const parsedSelected = JSON.parse(rawSelected);
                    if (Array.isArray(parsedSelected)) {
                        selectedModels = parsedSelected
                            .map((item) => String(item || "").trim())
                            .filter(Boolean);
                    }
                }
            } catch {
                // ignore
            }

            if (selectedModels.length === 0) {
                const singleModel = (localStorage.getItem(getSelectedModelKey()) || "").trim();
                if (singleModel) {
                    selectedModels = [singleModel];
                }
            }

            setVisibleModelIds([...new Set(selectedModels)].slice(0, nextParallel));
        };

        loadState();

        window.addEventListener("ai-selected-model-updated", loadState);
        window.addEventListener("ai-selected-models-updated", loadState);
        window.addEventListener("ai-parallel-settings-updated", loadState);
        window.addEventListener("ai-models-catalog-updated", loadState);
        window.addEventListener("ai-active-mode-updated", loadState);

        return () => {
            window.removeEventListener("ai-selected-model-updated", loadState);
            window.removeEventListener("ai-selected-models-updated", loadState);
            window.removeEventListener("ai-parallel-settings-updated", loadState);
            window.removeEventListener("ai-models-catalog-updated", loadState);
            window.removeEventListener("ai-active-mode-updated", loadState);
        };
    }, []);

    const modelInfoMap = useMemo(() => {
        const map = new Map<string, ModelCatalogItem>();
        for (const item of modelsCatalog) {
            const id = String(item.model_id || "").trim();
            if (id) map.set(id, item);
        }
        return map;
    }, [modelsCatalog]);

    const windowCount =
        uiMode === "video"
            ? 1
            : uiMode === "image"
              ? Math.min(Math.max(parallelCount, 1), 2)
              : Math.max(parallelCount, 1);

    const chatWindows = Array.from({ length: windowCount }, (_, index) => {
        const modelId = visibleModelIds[index] || "";
        const info = modelId ? modelInfoMap.get(modelId) : null;

        return {
            modelId,
            displayName:
                info?.display_name?.trim() || modelId || `Окно ${index + 1}`,
            provider: info?.provider?.trim() || "AI",
        };
    });

    const renderEmptyWorkspace = (label: string) => (
        <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-25/60 px-4 text-center">
            <div className="text-[13px] font-medium text-gray-700">{label}</div>
            <div className="mt-1 text-[12px] text-gray-500">Окно готово к работе</div>
        </div>
    );

    return (
        <Layout classWrapper="flex h-full min-h-0 flex-col overflow-hidden px-3 pb-2 pt-2 md:px-4 md:pb-3 md:pt-3">
            <div className="flex min-h-0 flex-1 flex-col">
                <div className={`grid h-full min-h-0 auto-rows-fr gap-3 ${getGridClassName(windowCount)}`}>
                    {uiMode === "chat" &&
                        chatWindows.map((windowItem, index) => (
                            <div
                                key={`${windowItem.modelId || "empty"}-${index}`}
                                className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white"
                            >
                                <div className="border-b border-gray-100 px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <Image
                                            className="h-4 w-4 rounded-full object-contain"
                                            src={getModelLogoSrc(windowItem.modelId, windowItem.provider)}
                                            width={16}
                                            height={16}
                                            alt={windowItem.displayName || "Модель"}
                                        />
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
                                    {renderEmptyWorkspace("Пустое окно чата")}
                                </div>
                            </div>
                        ))}

                    {uiMode === "image" &&
                        Array.from({ length: windowCount }, (_, index) => (
                            <div
                                key={`image-window-${index}`}
                                className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-3"
                            >
                                {renderEmptyWorkspace(`Пустое окно изображения ${index + 1}`)}
                            </div>
                        ))}

                    {uiMode === "video" && (
                        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-3">
                            {renderEmptyWorkspace("Пустое окно видео")}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default HomePage;
