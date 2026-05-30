import { getStoredUserEmail, getUserScopedKey } from "@/lib/userStorage";

export type SessionImageOptionState = {
    quality: string;
    size: string;
};

export type SessionUiSettings = {
    activeMode?: string;
    uiMode?: string;
    parallelCount?: number;
    selectedModels?: string[];
    selectedModel?: string;
    imageOptionsByModel?: Record<string, SessionImageOptionState>;
    attachedFileName?: string;
    attachedFileMimeType?: string;
};

export const getUserEmail = () => getStoredUserEmail("guest");

export const getSelectedModelKey = () => {
    return getUserScopedKey("ai_selected_model_");
};

export const getSelectedModelsKey = () => {
    return getUserScopedKey("ai_selected_models_");
};

export const getParallelCountKey = () => {
    return getUserScopedKey("ai_parallel_count_");
};

export const getActiveModeKey = () => {
    return getUserScopedKey("ai_active_mode_");
};

export const getUiModeKey = () => {
    return getUserScopedKey("ai_ui_mode_");
};

const getSessionUiSettingsKey = () => {
    return getUserScopedKey("ai_chat_ui_settings_");
};

export const readAllSessionUiSettings = (): Record<string, SessionUiSettings> => {
    if (typeof window === "undefined") return {};

    try {
        const raw = localStorage.getItem(getSessionUiSettingsKey());
        if (!raw) return {};

        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
};

export const readSessionUiSettings = (
    sessionId?: string | null
): SessionUiSettings | null => {
    const cleanSessionId = String(sessionId || "").trim();
    if (!cleanSessionId) return null;

    const all = readAllSessionUiSettings();
    const value = all[cleanSessionId];

    return value && typeof value === "object" ? value : null;
};

export const writeSessionUiSettings = (
    sessionId: string | null | undefined,
    patch: Partial<SessionUiSettings>
) => {
    if (typeof window === "undefined") return;

    const cleanSessionId = String(sessionId || "").trim();
    if (!cleanSessionId) return;

    const all = readAllSessionUiSettings();
    const current = all[cleanSessionId] || {};

    all[cleanSessionId] = {
        ...current,
        ...patch,
        imageOptionsByModel: {
            ...(current.imageOptionsByModel || {}),
            ...(patch.imageOptionsByModel || {}),
        },
    };

    localStorage.setItem(getSessionUiSettingsKey(), JSON.stringify(all));
};

export const removeSessionUiSettings = (sessionId?: string | null) => {
    if (typeof window === "undefined") return;

    const cleanSessionId = String(sessionId || "").trim();
    if (!cleanSessionId) return;

    const all = readAllSessionUiSettings();
    delete all[cleanSessionId];
    localStorage.setItem(getSessionUiSettingsKey(), JSON.stringify(all));
};

export const clearSessionAttachedFileContext = (sessionId?: string | null) => {
    writeSessionUiSettings(sessionId, {
        attachedFileName: "",
        attachedFileMimeType: "",
    });
};

export const readLegacyUiSettings = (): SessionUiSettings => {
    let selectedModels: string[] = [];

    try {
        const raw = localStorage.getItem(getSelectedModelsKey());
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                selectedModels = parsed
                    .map((item) => String(item || "").trim())
                    .filter(Boolean);
            }
        }
    } catch {
        // ignore
    }

    const selectedModel = (localStorage.getItem(getSelectedModelKey()) || "")
        .trim();

    if (!selectedModels.length && selectedModel) {
        selectedModels = [selectedModel];
    }

    return {
        activeMode: (localStorage.getItem(getActiveModeKey()) || "chat").trim(),
        uiMode: (localStorage.getItem(getUiModeKey()) || "chat").trim(),
        parallelCount: Number(localStorage.getItem(getParallelCountKey()) || 1),
        selectedModel,
        selectedModels,
    };
};

export const applySessionUiSettingsToLegacyKeys = (
    sessionId?: string | null
): SessionUiSettings => {
    const sessionSettings = readSessionUiSettings(sessionId);
    const fallback = readLegacyUiSettings();
    const resolved: SessionUiSettings = {
        ...fallback,
        ...(sessionSettings || {}),
    };

    if (resolved.activeMode) {
        localStorage.setItem(getActiveModeKey(), resolved.activeMode);
    }

    if (resolved.uiMode) {
        localStorage.setItem(getUiModeKey(), resolved.uiMode);
    }

    if (resolved.parallelCount) {
        localStorage.setItem(getParallelCountKey(), String(resolved.parallelCount));
    }

    const selectedModels = Array.isArray(resolved.selectedModels)
        ? resolved.selectedModels.filter(Boolean)
        : [];

    localStorage.setItem(getSelectedModelsKey(), JSON.stringify(selectedModels));

    const selectedModel = resolved.selectedModel || selectedModels[0] || "";

    if (selectedModel) {
        localStorage.setItem(getSelectedModelKey(), selectedModel);
    } else {
        localStorage.removeItem(getSelectedModelKey());
    }

    return {
        ...resolved,
        selectedModels,
        selectedModel,
    };
};
