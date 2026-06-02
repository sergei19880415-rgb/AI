import {
    clearCurrentOmniAiChatState,
    getUserScopedKey,
    migrateUserScopedStorage,
    normalizeUserEmail,
    setStoredUserEmail,
} from "@/lib/userStorage";

export type AuthModelCatalogItem = {
    model_id: string;
    display_name?: string;
    provider?: string;
    group_order?: number;
    model_order?: number;
    input_price_per_1m?: number | null;
    output_price_per_1m?: number | null;
    is_active?: boolean;
};

export type AuthSessionPayload = {
    firstName?: string;
    lastName?: string;
    planType?: string;
    allowedModels?: string;
    maxParallelModels?: number | string;
    modelsCatalog?: AuthModelCatalogItem[];
    sessionToken?: string;
    sessionExpiresAt?: string;
};

export const POST_AUTH_RELOAD_FLAG_KEY = "omniai_auth_reload_done";

const getSelectedModelKey = (userEmail: string) => {
    return getUserScopedKey("ai_selected_model_", userEmail);
};

const getParallelCountKey = (userEmail: string) => {
    return getUserScopedKey("ai_parallel_count_", userEmail);
};

const normalizePositiveInt = (value: unknown, fallback: number) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 1) return fallback;
    return Math.floor(num);
};

const getAllowedParallelOptions = (maxParallelModels: number) => {
    return [1, 2, 4, 6].filter((item) => item <= maxParallelModels);
};

export const clearPostAuthReloadFlag = () => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(POST_AUTH_RELOAD_FLAG_KEY);
};

export const preparePostAuthAppReload = () => {
    if (typeof window === "undefined") return false;

    if (sessionStorage.getItem(POST_AUTH_RELOAD_FLAG_KEY) === "1") {
        return false;
    }

    sessionStorage.setItem(POST_AUTH_RELOAD_FLAG_KEY, "1");
    return true;
};

export const saveAuthSessionAndResetChatState = (
    data: AuthSessionPayload,
    userEmail: string
) => {
    const cleanEmail = normalizeUserEmail(userEmail, "");

    if (!cleanEmail) {
        throw new Error("Login email is missing");
    }

    const resolvedFirstName = (data.firstName || "").trim();
    const resolvedLastName = (data.lastName || "").trim();
    const resolvedFullName = `${resolvedFirstName} ${resolvedLastName}`.trim();

    setStoredUserEmail(cleanEmail);
    migrateUserScopedStorage(cleanEmail);

    localStorage.setItem("ai_session_token", data.sessionToken || "");
    localStorage.setItem("ai_session_expires_at", data.sessionExpiresAt || "");
    localStorage.setItem("ai_user_first_name", resolvedFirstName);
    localStorage.setItem("ai_user_name", resolvedFullName);
    localStorage.setItem("ai_plan_type", data.planType || "Базовый");
    localStorage.setItem("ai_allowed_models", data.allowedModels || "");

    const modelsCatalog: AuthModelCatalogItem[] = Array.isArray(
        data.modelsCatalog
    )
        ? data.modelsCatalog
        : [];

    localStorage.setItem("ai_models_catalog", JSON.stringify(modelsCatalog));

    const maxParallelModels = normalizePositiveInt(data.maxParallelModels, 1);
    localStorage.setItem("ai_max_parallel_models", String(maxParallelModels));

    clearCurrentOmniAiChatState(cleanEmail);

    const currentSelectedModelKey = getSelectedModelKey(cleanEmail);
    const savedSelectedModel = localStorage.getItem(currentSelectedModelKey) || "";

    const allowedModelIds = modelsCatalog
        .map((item) => String(item?.model_id || "").trim())
        .filter(Boolean);

    const defaultModelId =
        savedSelectedModel && allowedModelIds.includes(savedSelectedModel)
            ? savedSelectedModel
            : allowedModelIds[0] ||
              (data.allowedModels || "")
                  .split(",")
                  .map((item: string) => item.trim())
                  .filter(Boolean)[0] ||
              "";

    if (defaultModelId) {
        localStorage.setItem(currentSelectedModelKey, defaultModelId);
    } else {
        localStorage.removeItem(currentSelectedModelKey);
    }

    const currentParallelCountKey = getParallelCountKey(cleanEmail);
    const savedParallelCountRaw = localStorage.getItem(currentParallelCountKey) || "";
    const savedParallelCount = normalizePositiveInt(savedParallelCountRaw, 1);
    const allowedParallelOptions = getAllowedParallelOptions(maxParallelModels);
    const defaultParallelCount = allowedParallelOptions.includes(savedParallelCount)
        ? savedParallelCount
        : 1;

    localStorage.setItem(currentParallelCountKey, String(defaultParallelCount));

    window.dispatchEvent(new Event("ai-user-profile-updated"));
    window.dispatchEvent(new Event("ai-models-catalog-updated"));
    window.dispatchEvent(new Event("ai-selected-model-updated"));
    window.dispatchEvent(new Event("ai-parallel-settings-updated"));
};

export const hardNavigateAfterAuth = (destination = "/chat") => {
    if (typeof window === "undefined") return;

    if (!preparePostAuthAppReload()) {
        window.location.assign(destination);
        return;
    }

    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (currentUrl === destination) {
        window.location.reload();
        return;
    }

    window.location.assign(destination);
};
