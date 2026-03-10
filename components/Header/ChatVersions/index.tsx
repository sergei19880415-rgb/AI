"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "@/components/Image";
import Icon from "@/components/Icon";

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

const getSelectedModelKey = () => {
    return `ai_selected_model_${getUserEmail()}`;
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

const ChatVersions = () => {
    const rootRef = useRef<HTMLDivElement | null>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<"providers" | "models">("providers");
    const [selectedProvider, setSelectedProvider] = useState("");
    const [modelsCatalog, setModelsCatalog] = useState<ModelCatalogItem[]>([]);
    const [selectedModelId, setSelectedModelId] = useState("");

    const loadState = () => {
        const catalog = getModelsCatalog();
        const selectedKey = getSelectedModelKey();
        const savedSelected = localStorage.getItem(selectedKey) || "";

        setModelsCatalog(catalog);

        const hasSavedModel = catalog.some(
            (item) => item.model_id === savedSelected
        );

        if (hasSavedModel) {
            setSelectedModelId(savedSelected);
            return;
        }

        const fallback = catalog[0]?.model_id || "";
        setSelectedModelId(fallback);

        if (fallback) {
            localStorage.setItem(selectedKey, fallback);
        }
    };

    useEffect(() => {
        loadState();

        const handleModelsUpdate = () => {
            loadState();
        };

        window.addEventListener("ai-models-catalog-updated", handleModelsUpdate);
        window.addEventListener("ai-selected-model-updated", handleModelsUpdate);

        return () => {
            window.removeEventListener(
                "ai-models-catalog-updated",
                handleModelsUpdate
            );
            window.removeEventListener(
                "ai-selected-model-updated",
                handleModelsUpdate
            );
        };
    }, []);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (!rootRef.current) return;

            if (!rootRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setStep("providers");
                setSelectedProvider("");
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    const groupedProviders = useMemo(() => {
        return groupModelsByProvider(modelsCatalog);
    }, [modelsCatalog]);

    const currentModel = useMemo(() => {
        return (
            modelsCatalog.find((item) => item.model_id === selectedModelId) ||
            modelsCatalog[0] ||
            null
        );
    }, [modelsCatalog, selectedModelId]);

    const currentProviderModels = useMemo(() => {
        const group = groupedProviders.find(
            (item) => item.provider === selectedProvider
        );
        return group ? group.items : [];
    }, [groupedProviders, selectedProvider]);

    const openMenu = () => {
        if (!modelsCatalog.length) return;

        setIsOpen((prev) => !prev);
        setStep("providers");
        setSelectedProvider("");
    };

    const chooseProvider = (provider: string) => {
        setSelectedProvider(provider);
        setStep("models");
    };

    const chooseModel = (modelId: string) => {
        setSelectedModelId(modelId);
        localStorage.setItem(getSelectedModelKey(), modelId);
        window.dispatchEvent(new Event("ai-selected-model-updated"));
        setIsOpen(false);
        setStep("providers");
        setSelectedProvider("");
    };

    return (
        <div className="relative" ref={rootRef}>
            <button
                type="button"
                onClick={openMenu}
                className="flex h-10 min-w-[180px] items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 shadow-[0_0.0625rem_0.125rem_0_rgba(13,13,18,0.06)] transition-colors hover:bg-gray-25"
            >
                <div className="relative shrink-0">
                    <Image
                        className="w-6 opacity-100"
                        src="/images/logo-circle.png"
                        width={24}
                        height={24}
                        alt=""
                    />
                </div>

                <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-body-sm font-medium text-primary-300">
                        {currentModel?.display_name || "Выбери модель"}
                    </div>
                    <div className="truncate text-[12px] leading-4 text-gray-500">
                        {currentModel?.provider || "Нет доступных моделей"}
                    </div>
                </div>

                <Icon
                    className={`shrink-0 fill-gray-500 transition-transform ${
                        isOpen ? "rotate-180" : ""
                    }`}
                    name="chevron"
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] z-30 w-[340px] rounded-2xl border border-gray-100 bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
                    {step === "providers" && (
                        <div>
                            <div className="px-3 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                                Компании
                            </div>

                            <div className="flex flex-col gap-1">
                                {groupedProviders.map((group) => (
                                    <button
                                        key={group.provider}
                                        type="button"
                                        onClick={() => chooseProvider(group.provider)}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-gray-50"
                                    >
                                        <div className="relative shrink-0">
                                            <Image
                                                className="w-6 opacity-100"
                                                src="/images/logo-circle.png"
                                                width={24}
                                                height={24}
                                                alt=""
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-body-sm font-medium text-primary-300">
                                                {group.provider}
                                            </div>
                                            <div className="truncate text-[12px] leading-4 text-gray-500">
                                                {group.items.length} моделей
                                            </div>
                                        </div>

                                        <Icon
                                            className="shrink-0 -rotate-90 fill-gray-500"
                                            name="chevron"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === "models" && (
                        <div>
                            <button
                                type="button"
                                onClick={() => {
                                    setStep("providers");
                                    setSelectedProvider("");
                                }}
                                className="mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors hover:bg-gray-50"
                            >
                                <Icon
                                    className="shrink-0 rotate-90 fill-gray-500"
                                    name="chevron"
                                />
                                <span className="text-[12px] font-medium text-gray-500">
                                    Назад
                                </span>
                            </button>

                            <div className="px-3 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                                {selectedProvider}
                            </div>

                            <div className="flex flex-col gap-1">
                                {currentProviderModels.map((item) => {
                                    const isSelected =
                                        item.model_id === currentModel?.model_id;

                                    return (
                                        <button
                                            key={item.model_id}
                                            type="button"
                                            onClick={() =>
                                                chooseModel(item.model_id)
                                            }
                                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-gray-50 ${
                                                isSelected ? "bg-gray-50" : ""
                                            }`}
                                        >
                                            <div className="relative shrink-0">
                                                <Image
                                                    className="w-6 opacity-100"
                                                    src="/images/logo-circle.png"
                                                    width={24}
                                                    height={24}
                                                    alt=""
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-body-sm font-medium text-primary-300">
                                                    {item.display_name || item.model_id}
                                                </div>
                                                <div className="truncate text-[12px] leading-4 text-gray-500">
                                                    {item.provider || "Other"}
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
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatVersions;