"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "@/components/Image";
import Icon from "@/components/Icon";

type ModelMode = "text" | "image";

type ModelCatalogItem = {
    model_id: string;
    display_name?: string;
    provider?: string;
    group_order?: number;
    model_order?: number;
    input_price_per_1m?: number | null;
    output_price_per_1m?: number | null;
    is_active?: boolean;
    mode_type?: ModelMode | string;
};

const WINDOW_OPTIONS = [1, 2, 4, 6] as const;

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

    if (prov.includes("perplexity") || id.includes("sonar")) {
        return "/images/models/perplexity.svg";
    }

    return "/images/logo-circle.png";
};

const getUserEmail = () => {
    return (localStorage.getItem("ai_user_email") || "guest").trim();
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

const getActiveModeKey = () => {
    return `ai_active_mode_${getUserEmail()}`;
};

const normalizePositiveInt = (value: unknown, fallback: number) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 1) return fallback;
    return Math.floor(num);
};

const normalizeModeType = (value: unknown): ModelMode => {
    return String(value || "text").trim().toLowerCase() === "image"
        ? "image"
        : "text";
};

const getHeaderMode = (): ModelMode => {
    const raw = (localStorage.getItem(getActiveModeKey()) || "text")
        .trim()
        .toLowerCase();

    return raw === "image" ? "image" : "text";
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

const getAllowedWindowCounts = (
    maxParallelModels: number,
    visibleModelsCount: number
) => {
    const effectiveMax = Math.max(
        1,
        Math.min(maxParallelModels, Math.max(visibleModelsCount, 1))
    );

    const counts = WINDOW_OPTIONS.filter((value) => value <= effectiveMax);

    return counts.length ? counts : [1];
};

const getSafeParallelCount = (
    savedValue: unknown,
    maxParallelModels: number,
    visibleModelsCount: number
) => {
    const allowedCounts = getAllowedWindowCounts(
        maxParallelModels,
        visibleModelsCount
    );

    const saved = normalizePositiveInt(savedValue, allowedCounts[0]);

    if (allowedCounts.includes(saved as (typeof WINDOW_OPTIONS)[number])) {
        return saved;
    }

    const lowerOrEqual = [...allowedCounts]
        .reverse()
        .find((item) => item <= saved);

    return lowerOrEqual || allowedCounts[0];
};

const normalizeSelectedModels = (
    catalog: ModelCatalogItem[],
    selected: string[],
    neededCount: number
) => {
    const availableIds = catalog
        .map((item) => String(item.model_id || "").trim())
        .filter(Boolean);

    const uniqueSelected: string[] = [];

    for (const item of selected) {
        const modelId = String(item || "").trim();
        if (!modelId) continue;
        if (!availableIds.includes(modelId)) continue;
        if (uniqueSelected.includes(modelId)) continue;
        uniqueSelected.push(modelId);
    }

    for (const modelId of availableIds) {
        if (uniqueSelected.length >= neededCount) break;
        if (!uniqueSelected.includes(modelId)) {
            uniqueSelected.push(modelId);
        }
    }

    return uniqueSelected.slice(0, neededCount);
};

const groupModelsByProvider = (models: ModelCatalogItem[]) => {
    const map = new Map<string, ModelCatalogItem[]>();

    const sorted = [...models].sort((a, b) => {
        const groupA = Number(a.group_order ?? 9999);
        const groupB = Number(b.group_order ?? 9999);

        if (groupA !== groupB) return groupA - groupB;

        const providerA = String(a.provider || "Other");
        const providerB = String(b.provider || "Other");

        if (providerA !== providerB) {
            return providerA.localeCompare(providerB);
        }

        const modelA = Number(a.model_order ?? 9999);
        const modelB = Number(b.model_order ?? 9999);

        return modelA - modelB;
    });

    for (const item of sorted) {
        const provider = String(item.provider || "Other").trim() || "Other";

        if (!map.has(provider)) {
            map.set(provider, []);
        }

        map.get(provider)!.push(item);
    }

    return Array.from(map.entries()).map(([provider, items]) => ({
        provider,
        items,
    }));
};

const WindowPattern = ({
    count,
    active,
}: {
    count: number;
    active: boolean;
}) => {
    const columns = count === 1 ? 1 : count === 2 ? 2 : count === 4 ? 2 : 3;

    const items = Array.from({ length: count }, (_, index) => index);

    return (
        <div
            className="grid gap-[2px]"
            style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
        >
            {items.map((item) => (
                <span
                    key={item}
                    className={`block h-[6px] w-[6px] rounded-[2px] ${
                        active ? "bg-primary-300" : "bg-gray-300"
                    }`}
                />
            ))}
        </div>
    );
};

const ChatVersions = () => {
    const rootRef = useRef<HTMLDivElement | null>(null);

    const [modelsCatalog, setModelsCatalog] = useState<ModelCatalogItem[]>([]);
    const [activeMode, setActiveMode] = useState<ModelMode>("text");
    const [maxParallelModels, setMaxParallelModels] = useState(1);
    const [parallelCount, setParallelCount] = useState(1);
    const [selectedModels, setSelectedModels] = useState<string[]>([]);
    const [openSlotIndex, setOpenSlotIndex] = useState<number | null>(null);

    const visibleCatalog = useMemo(() => {
        return modelsCatalog.filter(
            (item) => normalizeModeType(item.mode_type) === activeMode
        );
    }, [modelsCatalog, activeMode]);

    const groupedProviders = useMemo(() => {
        return groupModelsByProvider(visibleCatalog);
    }, [visibleCatalog]);

    const allowedWindowCounts = useMemo(() => {
        return getAllowedWindowCounts(maxParallelModels, visibleCatalog.length);
    }, [maxParallelModels, visibleCatalog.length]);

    const currentSlots = useMemo(() => {
        return Array.from({ length: parallelCount }, (_, index) => {
            const modelId = selectedModels[index] || "";
            const modelInfo =
                visibleCatalog.find((item) => item.model_id === modelId) || null;

            return {
                slotIndex: index,
                modelId,
                modelInfo,
            };
        });
    }, [visibleCatalog, parallelCount, selectedModels]);

    const persistSelectionState = (
        nextParallelCount: number,
        nextSelectedModels: string[],
        shouldEmitEvents = true,
        forcedMode?: ModelMode,
        forcedCatalog?: ModelCatalogItem[]
    ) => {
        const nextMode = forcedMode || activeMode;
        const fullCatalog = forcedCatalog || modelsCatalog;

        const nextVisibleCatalog = fullCatalog.filter(
            (item) => normalizeModeType(item.mode_type) === nextMode
        );

        const normalizedParallelCount = getSafeParallelCount(
            nextParallelCount,
            maxParallelModels,
            nextVisibleCatalog.length
        );

        const normalizedSelectedModels = normalizeSelectedModels(
            nextVisibleCatalog,
            nextSelectedModels,
            normalizedParallelCount
        );

        localStorage.setItem(
            getParallelCountKey(),
            String(normalizedParallelCount)
        );
        localStorage.setItem(
            getSelectedModelsKey(),
            JSON.stringify(normalizedSelectedModels)
        );

        if (normalizedSelectedModels[0]) {
            localStorage.setItem(
                getSelectedModelKey(),
                normalizedSelectedModels[0]
            );
        } else {
            localStorage.removeItem(getSelectedModelKey());
        }

        if (shouldEmitEvents) {
            window.dispatchEvent(new Event("ai-parallel-settings-updated"));
            window.dispatchEvent(new Event("ai-selected-models-updated"));
            window.dispatchEvent(new Event("ai-selected-model-updated"));
        }

        return {
            normalizedParallelCount,
            normalizedSelectedModels,
        };
    };

    const loadState = () => {
        const catalog = getModelsCatalog();
        const nextMode = getHeaderMode();
        const maxParallel = normalizePositiveInt(
            localStorage.getItem("ai_max_parallel_models"),
            1
        );

        const visibleForMode = catalog.filter(
            (item) => normalizeModeType(item.mode_type) === nextMode
        );

        const savedParallelCount = getSafeParallelCount(
            localStorage.getItem(getParallelCountKey()),
            maxParallel,
            visibleForMode.length
        );

        let selectedFromStorage: string[] = [];

        try {
            const rawSelectedModels = localStorage.getItem(getSelectedModelsKey());
            if (rawSelectedModels) {
                const parsed = JSON.parse(rawSelectedModels);
                if (Array.isArray(parsed)) {
                    selectedFromStorage = parsed.map((item) =>
                        String(item || "").trim()
                    );
                }
            }
        } catch {
            //
        }

        if (selectedFromStorage.length === 0) {
            const singleSelected = (
                localStorage.getItem(getSelectedModelKey()) || ""
            ).trim();

            if (singleSelected) {
                selectedFromStorage = [singleSelected];
            }
        }

        const normalizedSelected = normalizeSelectedModels(
            visibleForMode,
            selectedFromStorage,
            savedParallelCount
        );

        setModelsCatalog(catalog);
        setActiveMode(nextMode);
        setMaxParallelModels(maxParallel);
        setParallelCount(savedParallelCount);
        setSelectedModels(normalizedSelected);
        setOpenSlotIndex(null);

        localStorage.setItem(getParallelCountKey(), String(savedParallelCount));
        localStorage.setItem(
            getSelectedModelsKey(),
            JSON.stringify(normalizedSelected)
        );

        if (normalizedSelected[0]) {
            localStorage.setItem(getSelectedModelKey(), normalizedSelected[0]);
        } else {
            localStorage.removeItem(getSelectedModelKey());
        }
    };

    useEffect(() => {
        loadState();

        const handleUpdate = () => {
            loadState();
        };

        window.addEventListener("ai-models-catalog-updated", handleUpdate);
        window.addEventListener("ai-selected-model-updated", handleUpdate);
        window.addEventListener("ai-selected-models-updated", handleUpdate);
        window.addEventListener("ai-parallel-settings-updated", handleUpdate);
        window.addEventListener("ai-active-mode-updated", handleUpdate);

        return () => {
            window.removeEventListener("ai-models-catalog-updated", handleUpdate);
            window.removeEventListener("ai-selected-model-updated", handleUpdate);
            window.removeEventListener("ai-selected-models-updated", handleUpdate);
            window.removeEventListener(
                "ai-parallel-settings-updated",
                handleUpdate
            );
            window.removeEventListener("ai-active-mode-updated", handleUpdate);
        };
    }, []);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (!rootRef.current) return;

            if (!rootRef.current.contains(event.target as Node)) {
                setOpenSlotIndex(null);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    const handleParallelCountChange = (count: number) => {
        const { normalizedParallelCount, normalizedSelectedModels } =
            persistSelectionState(count, selectedModels);

        setParallelCount(normalizedParallelCount);
        setSelectedModels(normalizedSelectedModels);
        setOpenSlotIndex(null);
    };

    const handleChooseModel = (slotIndex: number, modelId: string) => {
        const nextSelectedModels = Array.from(
            { length: parallelCount },
            (_, index) => selectedModels[index] || ""
        );

        const alreadyUsedInOtherSlot = nextSelectedModels.findIndex(
            (item, index) => index !== slotIndex && item === modelId
        );

        if (alreadyUsedInOtherSlot !== -1) {
            return;
        }

        nextSelectedModels[slotIndex] = modelId;

        const { normalizedSelectedModels } = persistSelectionState(
            parallelCount,
            nextSelectedModels
        );

        setSelectedModels(normalizedSelectedModels);
        setOpenSlotIndex(null);
    };

    const isModelDisabledInSlot = (slotIndex: number, modelId: string) => {
        return selectedModels.some(
            (item, index) => index !== slotIndex && item === modelId
        );
    };

    const emptyTitle =
        activeMode === "image"
            ? "Нет доступных image-моделей"
            : "Нет доступных текстовых моделей";

    const emptyProvider =
        activeMode === "image" ? "Режим картинок" : "Режим текста";

    return (
        <div ref={rootRef} className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-1 shadow-[0_0.0625rem_0.125rem_0_rgba(13,13,18,0.06)]">
                {allowedWindowCounts.map((count) => {
                    const isActive = parallelCount === count;

                    return (
                        <button
                            key={count}
                            type="button"
                            onClick={() => handleParallelCountChange(count)}
                            className={`flex h-9 min-w-[40px] items-center justify-center gap-2 rounded-lg px-2 transition-colors ${
                                isActive
                                    ? "bg-primary-0 text-primary-300"
                                    : "text-gray-500 hover:bg-gray-50"
                            }`}
                            title={`${count} окон`}
                        >
                            <WindowPattern count={count} active={isActive} />
                            <span className="text-[13px] font-medium">
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {currentSlots.map(({ slotIndex, modelId, modelInfo }) => (
                <div key={`${activeMode}-${slotIndex}`} className="relative">
                    <button
                        type="button"
                        onClick={() =>
                            setOpenSlotIndex((prev) =>
                                prev === slotIndex ? null : slotIndex
                            )
                        }
                        className="flex h-10 min-w-[170px] max-w-[220px] items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 shadow-[0_0.0625rem_0.125rem_0_rgba(13,13,18,0.06)] transition-colors hover:bg-gray-25"
                    >
                        <div className="relative shrink-0">
                            <Image
                                className="h-5 w-5 rounded-full object-contain"
                                src={getModelLogoSrc(
                                    modelInfo?.model_id,
                                    modelInfo?.provider
                                )}
                                width={20}
                                height={20}
                                alt={modelInfo?.display_name || "Модель"}
                            />
                        </div>

                        <div className="min-w-0 flex-1 text-left leading-none">
                            <div className="truncate text-[13px] font-medium leading-4 text-primary-300">
                                {modelInfo?.display_name ||
                                    modelId ||
                                    emptyTitle}
                            </div>
                            <div className="truncate text-[10px] leading-[11px] text-gray-500">
                                {modelInfo?.provider || emptyProvider}
                            </div>
                        </div>

                        <Icon
                            className={`shrink-0 fill-gray-500 transition-transform ${
                                openSlotIndex === slotIndex ? "rotate-180" : ""
                            }`}
                            name="chevron"
                        />
                    </button>

                    {openSlotIndex === slotIndex && (
                        <div className="absolute left-0 top-[calc(100%+10px)] z-30 max-h-[420px] w-[320px] overflow-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
                            {groupedProviders.length === 0 ? (
                                <div className="px-3 py-4 text-sm text-gray-500">
                                    {emptyTitle}
                                </div>
                            ) : (
                                groupedProviders.map((group) => (
                                    <div
                                        key={group.provider}
                                        className="mb-2 last:mb-0"
                                    >
                                        <div className="px-3 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                                            {group.provider}
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            {group.items.map((item) => {
                                                const isSelected =
                                                    item.model_id === modelId;
                                                const isDisabled =
                                                    isModelDisabledInSlot(
                                                        slotIndex,
                                                        item.model_id
                                                    );

                                                return (
                                                    <button
                                                        key={item.model_id}
                                                        type="button"
                                                        onClick={() =>
                                                            !isDisabled &&
                                                            handleChooseModel(
                                                                slotIndex,
                                                                item.model_id
                                                            )
                                                        }
                                                        disabled={isDisabled}
                                                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                                                            isDisabled
                                                                ? "cursor-not-allowed opacity-40"
                                                                : "hover:bg-gray-50"
                                                        } ${
                                                            isSelected
                                                                ? "bg-gray-50"
                                                                : ""
                                                        }`}
                                                    >
                                                        <div className="relative shrink-0">
                                                            <Image
                                                                className="h-6 w-6 rounded-full object-contain"
                                                                src={getModelLogoSrc(
                                                                    item.model_id,
                                                                    item.provider
                                                                )}
                                                                width={24}
                                                                height={24}
                                                                alt={
                                                                    item.display_name ||
                                                                    item.model_id
                                                                }
                                                            />
                                                        </div>

                                                        <div className="min-w-0 flex-1 leading-none">
                                                            <div className="truncate text-body-sm font-medium leading-4 text-primary-300">
                                                                {item.display_name ||
                                                                    item.model_id}
                                                            </div>
                                                            <div className="truncate text-[12px] leading-[13px] text-gray-500">
                                                                {item.provider ||
                                                                    "Other"}
                                                            </div>
                                                        </div>

                                                        {isSelected && (
                                                            <div className="rounded-full bg-primary-0 px-2 py-1 text-[11px] font-medium text-primary-300">
                                                                Выбрано
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ChatVersions;