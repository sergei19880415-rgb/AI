"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type KeyboardEvent,
} from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import Head from "@/components/Login/Head";
import Button from "@/components/Button";
import Image from "@/components/Image";
import Field from "@/components/Field";
import Checkbox from "@/components/Checkbox";
import {
    getUserScopedKey,
    migrateUserScopedStorage,
    normalizeUserEmail,
    setStoredUserEmail,
} from "@/lib/userStorage";
import { syncCloudChatsToLocalStorage } from "@/lib/cloudChatHistory";

type Props = {
    onRequireEmailVerification: (email: string, message?: string) => void;
};

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

type GoogleCredentialResponse = {
    credential?: string;
    select_by?: string;
};

type LoginResponse = {
    success?: boolean;
    emailVerificationRequired?: boolean;
    email?: string;
    firstName?: string;
    lastName?: string;
    planType?: string;
    allowedModels?: string;
    maxParallelModels?: number | string;
    modelsCatalog?: ModelCatalogItem[];
    sessionToken?: string;
    sessionExpiresAt?: string;
    message?: string;
};

const LOGIN_WEBHOOK_URL = "https://tgdomen.ru/webhook/login-auth";
const GOOGLE_AUTH_WEBHOOK_URL = "https://tgdomen.ru/webhook/google-auth";
const GOOGLE_CLIENT_ID =
    "760225057684-bbmmn7vsri3ofgu9pbakj84aqvjtv04b.apps.googleusercontent.com";
const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const RETURN_AFTER_LOGIN_STORAGE_KEY = "ai_return_after_login";

const getSelectedModelKey = (userEmail: string) => {
    return getUserScopedKey("ai_selected_model_", userEmail);
};

const getParallelCountKey = (userEmail: string) => {
    return getUserScopedKey("ai_parallel_count_", userEmail);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const normalizePositiveInt = (value: unknown, fallback: number) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 1) return fallback;
    return Math.floor(num);
};

const getAllowedParallelOptions = (maxParallelModels: number) => {
    return [1, 2, 4, 6].filter((item) => item <= maxParallelModels);
};

const toLoginResponse = (value: unknown): LoginResponse | null => {
    if (!isRecord(value)) return null;

    return {
        success:
            typeof value.success === "boolean" ? value.success : undefined,
        emailVerificationRequired:
            typeof value.emailVerificationRequired === "boolean"
                ? value.emailVerificationRequired
                : undefined,
        email: typeof value.email === "string" ? value.email : undefined,
        firstName:
            typeof value.firstName === "string" ? value.firstName : undefined,
        lastName:
            typeof value.lastName === "string" ? value.lastName : undefined,
        planType:
            typeof value.planType === "string" ? value.planType : undefined,
        allowedModels:
            typeof value.allowedModels === "string"
                ? value.allowedModels
                : undefined,
        maxParallelModels:
            typeof value.maxParallelModels === "number" ||
            typeof value.maxParallelModels === "string"
                ? value.maxParallelModels
                : undefined,
        modelsCatalog: Array.isArray(value.modelsCatalog)
            ? (value.modelsCatalog as ModelCatalogItem[])
            : undefined,
        sessionToken:
            typeof value.sessionToken === "string"
                ? value.sessionToken
                : undefined,
        sessionExpiresAt:
            typeof value.sessionExpiresAt === "string"
                ? value.sessionExpiresAt
                : undefined,
        message:
            typeof value.message === "string" ? value.message : undefined,
    };
};

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: GoogleCredentialResponse) => void;
                    }) => void;
                    renderButton: (
                        parent: HTMLElement,
                        options: {
                            theme?: "outline" | "filled_blue" | "filled_black";
                            size?: "large" | "medium" | "small";
                            text?:
                                | "signin_with"
                                | "signup_with"
                                | "continue_with"
                                | "signin";
                            shape?: "rectangular" | "pill" | "circle" | "square";
                            width?: string | number;
                        }
                    ) => void;
                    cancel?: () => void;
                };
            };
        };
    }
}

const getEmailFromGoogleCredential = (credential: string) => {
    const [, payload] = credential.split(".");
    if (!payload) return "";

    try {
        const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
        const decodedPayload = atob(
            normalizedPayload.padEnd(
                normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
                "="
            )
        );
        const parsed = JSON.parse(decodedPayload) as unknown;

        if (!isRecord(parsed) || typeof parsed.email !== "string") return "";

        return normalizeUserEmail(parsed.email, "");
    } catch {
        return "";
    }
};

const Start = ({ onRequireEmailVerification }: Props) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const googleCredentialHandlerRef = useRef<
        (response: GoogleCredentialResponse) => void
    >(() => undefined);
    const googleButtonContainerRef = useRef<HTMLDivElement | null>(null);
    const isGoogleInitializedRef = useRef(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [errorText, setErrorText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isGoogleScriptReady, setIsGoogleScriptReady] = useState(false);
    const [successText, setSuccessText] = useState("");

    useEffect(() => {
        const savedRememberEmail = localStorage.getItem("ai_remember_email");
        if (savedRememberEmail) {
            setEmail(savedRememberEmail);
            setRemember(true);
        }

        if (searchParams.get("verified") === "1") {
            setSuccessText("Email подтверждён. Теперь можно войти.");
            router.replace("/auth/sign-in");
            return;
        }

        if (searchParams.get("reset") === "1") {
            setSuccessText("Пароль обновлён. Теперь можно войти.");
            router.replace("/auth/sign-in");
            return;
        }

        if (searchParams.get("deleted") === "1") {
            setSuccessText("Профиль удалён");
            router.replace("/auth/sign-in");
        }
    }, [router, searchParams]);

    const applyLoginState = useCallback(
        async (
            data: LoginResponse,
            userEmail: string,
            shouldRememberEmail: boolean
        ) => {
            const cleanEmail = normalizeUserEmail(userEmail, "");

            if (!cleanEmail) {
                throw new Error("Login email is missing");
            }

            setStoredUserEmail(cleanEmail);
            migrateUserScopedStorage(cleanEmail);
            localStorage.setItem("ai_session_token", data.sessionToken || "");
            localStorage.setItem(
                "ai_session_expires_at",
                data.sessionExpiresAt || ""
            );

            localStorage.setItem(
                "ai_user_first_name",
                (data.firstName || "").trim()
            );

            localStorage.setItem(
                "ai_user_name",
                `${data.firstName || ""} ${data.lastName || ""}`.trim()
            );

            localStorage.setItem("ai_plan_type", data.planType || "Базовый");
            localStorage.setItem("ai_allowed_models", data.allowedModels || "");

            const modelsCatalog: ModelCatalogItem[] = Array.isArray(
                data.modelsCatalog
            )
                ? data.modelsCatalog
                : [];

            localStorage.setItem(
                "ai_models_catalog",
                JSON.stringify(modelsCatalog)
            );

            const currentSelectedModelKey = getSelectedModelKey(cleanEmail);
            const savedSelectedModel =
                localStorage.getItem(currentSelectedModelKey) || "";

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

            const maxParallelModels = normalizePositiveInt(
                data.maxParallelModels,
                1
            );

            localStorage.setItem(
                "ai_max_parallel_models",
                String(maxParallelModels)
            );

            const currentParallelCountKey = getParallelCountKey(cleanEmail);
            const savedParallelCountRaw =
                localStorage.getItem(currentParallelCountKey) || "";
            const savedParallelCount = normalizePositiveInt(
                savedParallelCountRaw,
                1
            );

            const allowedParallelOptions =
                getAllowedParallelOptions(maxParallelModels);

            const defaultParallelCount = allowedParallelOptions.includes(
                savedParallelCount
            )
                ? savedParallelCount
                : 1;

            localStorage.setItem(
                currentParallelCountKey,
                String(defaultParallelCount)
            );

            window.dispatchEvent(new Event("ai-models-catalog-updated"));
            window.dispatchEvent(new Event("ai-selected-model-updated"));
            window.dispatchEvent(new Event("ai-parallel-settings-updated"));

            await syncCloudChatsToLocalStorage();

            if (shouldRememberEmail) {
                localStorage.setItem("ai_remember_email", cleanEmail);
            } else {
                localStorage.removeItem("ai_remember_email");
            }

            const returnAfterLogin =
                sessionStorage.getItem(RETURN_AFTER_LOGIN_STORAGE_KEY) || "";

            if (returnAfterLogin.trim()) {
                sessionStorage.removeItem(RETURN_AFTER_LOGIN_STORAGE_KEY);
                router.push(returnAfterLogin);
                return;
            }

            router.push("/chat");
        },
        [router]
    );

    const handleLogin = async () => {
        const cleanEmail = normalizeUserEmail(email, "");
        const cleanPassword = password.trim();

        if (!cleanEmail || !cleanPassword || isLoading || isGoogleLoading) return;

        setIsLoading(true);
        setErrorText("");
        setSuccessText("");

        try {
            const response = await fetch(LOGIN_WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: cleanEmail,
                    password: cleanPassword,
                }),
            });

            const raw = await response.text();

            let parsed: unknown = null;

            try {
                parsed = JSON.parse(raw);
            } catch {
                setErrorText("Сервер вернул непонятный ответ");
                setIsLoading(false);
                return;
            }

            const data = toLoginResponse(parsed);

            if (!data) {
                setErrorText("Сервер вернул непонятный ответ");
                setIsLoading(false);
                return;
            }

            if (data.success) {
                await applyLoginState(data, cleanEmail, remember);
                return;
            }

            if (data.emailVerificationRequired) {
                onRequireEmailVerification(
                    cleanEmail,
                    data.message ||
                        "Подтвердите email. Код уже отправлен на вашу почту."
                );
                return;
            }

            setErrorText(data.message || "Неверный логин или пароль");
        } catch {
            setErrorText("Ошибка сети или CORS");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleCredential = useCallback(
        async (googleResponse: GoogleCredentialResponse) => {
            const credential = googleResponse.credential || "";

            if (!credential || isLoading || isGoogleLoading) {
                setErrorText("Не удалось войти через Google");
                return;
            }

            setIsGoogleLoading(true);
            setErrorText("");
            setSuccessText("");

            try {
                const response = await fetch(GOOGLE_AUTH_WEBHOOK_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        credential,
                    }),
                });

                const raw = await response.text();

                let parsed: unknown = null;

                try {
                    parsed = JSON.parse(raw);
                } catch {
                    setErrorText("Не удалось войти через Google");
                    setIsGoogleLoading(false);
                    return;
                }

                const data = toLoginResponse(parsed);

                if (!response.ok || !data?.success) {
                    setErrorText("Не удалось войти через Google");
                    return;
                }

                const googleEmail = normalizeUserEmail(
                    data.email || getEmailFromGoogleCredential(credential),
                    ""
                );

                if (!googleEmail) {
                    setErrorText("Не удалось войти через Google");
                    return;
                }

                await applyLoginState(data, googleEmail, remember);
            } catch {
                setErrorText("Не удалось войти через Google");
            } finally {
                setIsGoogleLoading(false);
            }
        },
        [applyLoginState, isGoogleLoading, isLoading, remember]
    );

    useEffect(() => {
        googleCredentialHandlerRef.current = handleGoogleCredential;
    }, [handleGoogleCredential]);

    useEffect(() => {
        if (
            !isGoogleScriptReady ||
            !window.google ||
            !googleButtonContainerRef.current ||
            isGoogleInitializedRef.current
        ) {
            return;
        }

        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (googleResponse) => {
                googleCredentialHandlerRef.current(googleResponse);
            },
        });

        googleButtonContainerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleButtonContainerRef.current, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            width: 400,
        });

        isGoogleInitializedRef.current = true;
    }, [isGoogleScriptReady]);

    const handleKeyDown = (
        e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleLogin();
        }
    };

    return (
        <>
            <Script
                src={GOOGLE_IDENTITY_SCRIPT_SRC}
                strategy="afterInteractive"
                onLoad={() => setIsGoogleScriptReady(true)}
                onReady={() => setIsGoogleScriptReady(true)}
                onError={() => setErrorText("Не удалось загрузить вход через Google")}
            />

            <Head
                title="Вход в AI-агрегатор"
                description="Войди, чтобы открыть чат и свои доступные модели."
            />

            <div className="mb-3">
                <div
                    className={`flex w-full justify-center ${
                        isLoading || isGoogleLoading
                            ? "pointer-events-none opacity-60"
                            : ""
                    }`}
                    ref={googleButtonContainerRef}
                />
                {!isGoogleScriptReady && (
                    <div className="mt-2 rounded-xl bg-primary-25 px-3 py-2 text-center text-sm text-primary-300">
                        Загружаем вход через Google...
                    </div>
                )}
                {isGoogleLoading && (
                    <div className="mt-2 rounded-xl bg-primary-25 px-3 py-2 text-center text-sm text-primary-300">
                        Выполняем вход через Google...
                    </div>
                )}
            </div>

            <Button className="w-full" isSecondary type="button">
                <Image
                    className="w-5 opacity-100"
                    src="/images/apple.svg"
                    width={20}
                    height={20}
                    alt="Apple"
                />
                Войти через Apple
            </Button>

            <div className="flex items-center gap-6 my-4 text-body-sm text-gray-400 before:grow before:h-0.25 before:bg-gray-50 after:grow after:h-0.25 after:bg-gray-50">
                Или войти по email
            </div>

            <Field
                className="mb-3"
                label="Email"
                placeholder="Введите email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                required
            />

            <Field
                className="mb-2"
                label="Пароль"
                placeholder="Введите пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                required
            />

            {errorText && (
                <div className="mb-3 text-sm text-red-600">{errorText}</div>
            )}
            {successText && (
                <div className="mb-3 text-sm text-green-700">{successText}</div>
            )}

            <div className="flex justify-between items-center h-10 mb-4">
                <Checkbox
                    label="Запомнить меня"
                    checked={remember}
                    onChange={() => setRemember(!remember)}
                />
                <Link
                    className="font-medium text-primary-200 transition-colors hover:text-primary-300"
                    href="/auth/forgot-password"
                >
                    Забыли пароль?
                </Link>
            </div>

            <Button
                className="w-full mb-2"
                isPrimary
                type="button"
                onClick={handleLogin}
                disabled={
                    isLoading ||
                    isGoogleLoading ||
                    !email.trim() ||
                    !password.trim()
                }
            >
                {isLoading ? "Проверка..." : "Войти"}
            </Button>

            <div className="flex justify-center items-center gap-2 h-14 text-body-sm">
                <div className="text-gray-600">Нет аккаунта?</div>
                <Link
                    className="font-medium text-primary-200 transition-colors hover:text-primary-300"
                    href="/auth/sign-up"
                >
                    Регистрация
                </Link>
            </div>
        </>
    );
};
export default Start;
