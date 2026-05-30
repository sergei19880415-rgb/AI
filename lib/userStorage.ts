const USER_EMAIL_STORAGE_KEY = "ai_user_email";

const USER_SCOPED_PREFIXES = [
    "ai_sessions_",
    "ai_current_session_",
    "ai_projects_",
    "ai_projects_meta_",
    "ai_selected_model_",
    "ai_selected_models_",
    "ai_parallel_count_",
    "ai_active_mode_",
    "ai_ui_mode_",
    "ai_chat_ui_settings_",
] as const;

type UserScopedPrefix = (typeof USER_SCOPED_PREFIXES)[number];

const isBrowser = () => typeof window !== "undefined";

const parseJson = (value: string | null): unknown => {
    if (!value) return null;

    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const normalizeProjectName = (value: unknown) => {
    return String(value || "").trim();
};

const stringify = (value: unknown) => JSON.stringify(value);

const mergeArraysById = (oldRaw: string | null, currentRaw: string | null) => {
    const oldItems = parseJson(oldRaw);
    const currentItems = parseJson(currentRaw);
    const map = new Map<string, unknown>();

    const addItems = (items: unknown) => {
        if (!Array.isArray(items)) return;

        items.forEach((item) => {
            if (!isRecord(item)) return;

            const id = String(item.id || "").trim();
            if (!id) return;

            const existing = map.get(id);
            if (isRecord(existing)) {
                const existingUpdatedAt = Number(existing.updatedAt || 0);
                const nextUpdatedAt = Number(item.updatedAt || 0);

                map.set(id, nextUpdatedAt >= existingUpdatedAt ? item : existing);
                return;
            }

            map.set(id, item);
        });
    };

    addItems(oldItems);
    addItems(currentItems);

    return stringify(Array.from(map.values()));
};

const mergeUniqueArrays = (oldRaw: string | null, currentRaw: string | null) => {
    const values = [...(Array.isArray(parseJson(oldRaw)) ? (parseJson(oldRaw) as unknown[]) : []),
        ...(Array.isArray(parseJson(currentRaw)) ? (parseJson(currentRaw) as unknown[]) : [])]
        .map((item) => String(item || "").trim())
        .filter(Boolean);

    return stringify(Array.from(new Set(values)));
};

const mergeObjects = (oldValue: unknown, currentValue: unknown): Record<string, unknown> => {
    const merged: Record<string, unknown> = {
        ...(isRecord(oldValue) ? oldValue : {}),
        ...(isRecord(currentValue) ? currentValue : {}),
    };

    Object.entries(oldValue && isRecord(oldValue) ? oldValue : {}).forEach(
        ([key, value]) => {
            const current = isRecord(currentValue) ? currentValue[key] : undefined;

            if (isRecord(value) && isRecord(current)) {
                merged[key] = mergeObjects(value, current);
            }
        }
    );

    return merged;
};

const mergeProjectMeta = (oldRaw: string | null, currentRaw: string | null) => {
    const oldValue = parseJson(oldRaw);
    const currentValue = parseJson(currentRaw);

    if (Array.isArray(oldValue) || Array.isArray(currentValue)) {
        const map = new Map<string, unknown>();

        const addItems = (items: unknown) => {
            if (!Array.isArray(items)) return;

            items.forEach((item) => {
                if (!isRecord(item)) return;

                const name = normalizeProjectName(item.name);
                if (!name) return;

                map.set(name.toLowerCase(), {
                    ...item,
                    name,
                    image: String(item.image || "").trim(),
                });
            });
        };

        addItems(oldValue);
        addItems(currentValue);

        return stringify(Array.from(map.values()));
    }

    return stringify(mergeObjects(oldValue, currentValue));
};

const mergeJsonObjects = (oldRaw: string | null, currentRaw: string | null) => {
    return stringify(mergeObjects(parseJson(oldRaw), parseJson(currentRaw)));
};

const mergeUserScopedValue = (
    prefix: UserScopedPrefix,
    oldRaw: string | null,
    currentRaw: string | null
) => {
    if (prefix === "ai_sessions_") {
        return mergeArraysById(oldRaw, currentRaw);
    }

    if (prefix === "ai_current_session_") {
        return currentRaw || oldRaw || "";
    }

    if (prefix === "ai_projects_") {
        return mergeUniqueArrays(oldRaw, currentRaw);
    }

    if (prefix === "ai_projects_meta_") {
        return mergeProjectMeta(oldRaw, currentRaw);
    }

    if (prefix === "ai_chat_ui_settings_") {
        return mergeJsonObjects(oldRaw, currentRaw);
    }

    return currentRaw || oldRaw || "";
};

export const normalizeUserEmail = (value: unknown, fallback = "guest") => {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized || fallback;
};

export const getStoredUserEmail = (fallback = "guest") => {
    if (!isBrowser()) return fallback;
    return normalizeUserEmail(localStorage.getItem(USER_EMAIL_STORAGE_KEY), fallback);
};

export const getUserScopedKey = (prefix: string, email?: string | null) => {
    const scopedEmail = email === undefined
        ? getStoredUserEmail("guest")
        : normalizeUserEmail(email, "guest");

    return `${prefix}${scopedEmail}`;
};

export const setStoredUserEmail = (value: unknown, fallback = "") => {
    if (!isBrowser()) return normalizeUserEmail(value, fallback);

    const normalized = normalizeUserEmail(value, fallback);

    if (normalized) {
        localStorage.setItem(USER_EMAIL_STORAGE_KEY, normalized);
    } else {
        localStorage.removeItem(USER_EMAIL_STORAGE_KEY);
    }

    return normalized;
};

export const migrateUserScopedStorage = (email?: string | null) => {
    if (!isBrowser()) return;

    const normalizedEmail = email === undefined
        ? getStoredUserEmail("")
        : normalizeUserEmail(email, "");

    if (!normalizedEmail) return;

    const storedEmail = localStorage.getItem(USER_EMAIL_STORAGE_KEY);
    if (storedEmail !== null) {
        setStoredUserEmail(storedEmail);
    }

    USER_SCOPED_PREFIXES.forEach((prefix) => {
        const targetKey = getUserScopedKey(prefix, normalizedEmail);
        const keysToMigrate: string[] = [];

        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (!key?.startsWith(prefix) || key === targetKey) continue;

            const rawEmail = key.slice(prefix.length);
            if (normalizeUserEmail(rawEmail, "") === normalizedEmail) {
                keysToMigrate.push(key);
            }
        }

        keysToMigrate.forEach((sourceKey) => {
            const sourceValue = localStorage.getItem(sourceKey);
            const currentValue = localStorage.getItem(targetKey);
            const mergedValue = mergeUserScopedValue(prefix, sourceValue, currentValue);

            if (mergedValue) {
                localStorage.setItem(targetKey, mergedValue);
            }

            localStorage.removeItem(sourceKey);
        });
    });
};
