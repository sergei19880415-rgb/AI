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
import { normalizeUserEmail } from "@/lib/userStorage";
import {
    clearPostAuthReloadFlag,
    hardNavigateAfterAuth,
    saveAuthSessionAndResetChatState,
} from "@/lib/authSession";

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

type TelegramAuthUser = {
    id: number | string;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number | string;
    hash: string;
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
    userId?: string;
    message?: string;
};

const LOGIN_WEBHOOK_URL = "https://tgdomen.ru/webhook/login-auth";
const GOOGLE_AUTH_WEBHOOK_URL = "https://tgdomen.ru/webhook/google-auth";
const TELEGRAM_AUTH_WEBHOOK_URL = "https://tgdomen.ru/webhook/tg-auth";
const TELEGRAM_BOT_USERNAME = "OmniAI_Login_Bot";
const TELEGRAM_WIDGET_SCRIPT_SRC = "https://telegram.org/js/telegram-widget.js";
const GOOGLE_CLIENT_ID =
    "760225057684-bbmmn7vsri3ofgu9pbakj84aqvjtv04b.apps.googleusercontent.com";
const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const RETURN_AFTER_LOGIN_STORAGE_KEY = "ai_return_after_login";

const TelegramPlaneIcon = () => (
    <svg
        className="size-[22px]"
        viewBox="0 0 24 24"
        role="img"
        aria-label="Telegram"
    >
        <circle cx="12" cy="12" r="11" fill="#229ED9" />
        <path
            d="M17.95 7.1 15.9 17.2c-.15.72-.58.9-1.17.56l-3.23-2.45-1.56 1.54c-.17.17-.32.32-.65.32l.23-3.4 6.18-5.73c.27-.24-.06-.37-.41-.13l-7.64 4.94-3.29-1.06c-.71-.23-.73-.73.15-1.08l12.86-5.08c.6-.23 1.12.15.58 1.47Z"
            fill="#fff"
        />
    </svg>
);

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
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
        userId: typeof value.userId === "string" ? value.userId : undefined,
        message:
            typeof value.message === "string" ? value.message : undefined,
    };
};

declare global {
    interface Window {
        onTelegramAuth?: (user: TelegramAuthUser) => Promise<void> | void;
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
                            logo_alignment?: "left" | "center";
                        }
                    ) => void;
                    prompt?: () => void;
                    cancel?: () => void;
                };
            };
        };
    }
}

const getSafePostAuthDestination = (value: string) => {
    const destination = value.trim();

    if (!destination) return "/chat";

    if (destination.startsWith("/chat?")) return "/chat";

    return destination;
};

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
    const googleButtonWrapperRef = useRef<HTMLDivElement | null>(null);
    const telegramWidgetRef = useRef<HTMLDivElement | null>(null);
    const telegramAuthHandlerRef = useRef<
        (user: TelegramAuthUser) => Promise<void> | void
    >(
        () => undefined
    );
    const isGoogleInitializedRef = useRef(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [errorText, setErrorText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isTelegramLoading, setIsTelegramLoading] = useState(false);
    const [isTelegramWidgetReady, setIsTelegramWidgetReady] = useState(false);
    const [isTelegramDomainHintVisible, setIsTelegramDomainHintVisible] =
        useState(false);
    const [isGoogleScriptReady, setIsGoogleScriptReady] = useState(false);
    const [successText, setSuccessText] = useState("");

    useEffect(() => {
        clearPostAuthReloadFlag();

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
        (
            data: LoginResponse,
            userEmail: string,
            shouldRememberEmail: boolean
        ) => {
            const cleanEmail = normalizeUserEmail(userEmail, "");

            if (!cleanEmail) {
                throw new Error("Login email is missing");
            }

            saveAuthSessionAndResetChatState(data, cleanEmail);

            if (shouldRememberEmail) {
                localStorage.setItem("ai_remember_email", cleanEmail);
            } else {
                localStorage.removeItem("ai_remember_email");
            }

            const returnAfterLogin =
                sessionStorage.getItem(RETURN_AFTER_LOGIN_STORAGE_KEY) || "";
            const destination = getSafePostAuthDestination(returnAfterLogin);

            if (returnAfterLogin.trim()) {
                sessionStorage.removeItem(RETURN_AFTER_LOGIN_STORAGE_KEY);
            }

            hardNavigateAfterAuth(destination);
        },
        []
    );

    const handleLogin = async () => {
        const cleanEmail = normalizeUserEmail(email, "");
        const cleanPassword = password.trim();

        if (
            !cleanEmail ||
            !cleanPassword ||
            isLoading ||
            isGoogleLoading ||
            isTelegramLoading
        ) {
            return;
        }

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
                applyLoginState(data, cleanEmail, remember);
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

            if (
                !credential ||
                isLoading ||
                isGoogleLoading ||
                isTelegramLoading
            ) {
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

                applyLoginState(data, googleEmail, remember);
            } catch {
                setErrorText("Не удалось войти через Google");
            } finally {
                setIsGoogleLoading(false);
            }
        },
        [
            applyLoginState,
            isGoogleLoading,
            isLoading,
            isTelegramLoading,
            remember,
        ]
    );

    const handleTelegramAuth = useCallback(
        async (telegramUser: TelegramAuthUser) => {
            if (
                !telegramUser?.id ||
                !telegramUser.auth_date ||
                !telegramUser.hash ||
                isLoading ||
                isGoogleLoading ||
                isTelegramLoading
            ) {
                setErrorText("Не удалось войти через Telegram");
                return;
            }

            setIsTelegramLoading(true);
            setErrorText("");
            setSuccessText("");

            try {
                const response = await fetch(TELEGRAM_AUTH_WEBHOOK_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        auth_data: telegramUser,
                    }),
                });

                const raw = await response.text();

                let parsed: unknown = null;

                try {
                    parsed = JSON.parse(raw);
                } catch {
                    setErrorText("Не удалось войти через Telegram");
                    setIsTelegramLoading(false);
                    return;
                }

                const data = toLoginResponse(parsed);

                if (!response.ok || !data?.success) {
                    setErrorText("Не удалось войти через Telegram");
                    return;
                }

                const telegramEmail = normalizeUserEmail(data.email || "", "");

                if (!telegramEmail) {
                    setErrorText("Не удалось войти через Telegram");
                    return;
                }

                applyLoginState(data, telegramEmail, remember);
            } catch {
                setErrorText("Не удалось войти через Telegram");
            } finally {
                setIsTelegramLoading(false);
            }
        },
        [
            applyLoginState,
            isGoogleLoading,
            isLoading,
            isTelegramLoading,
            remember,
        ]
    );

    useEffect(() => {
        googleCredentialHandlerRef.current = handleGoogleCredential;
    }, [handleGoogleCredential]);

    useEffect(() => {
        telegramAuthHandlerRef.current = handleTelegramAuth;
    }, [handleTelegramAuth]);

    useEffect(() => {
        window.onTelegramAuth = async (user) => {
            await telegramAuthHandlerRef.current(user);
        };

        return () => {
            if (window.onTelegramAuth) {
                delete window.onTelegramAuth;
            }
        };
    }, []);

    useEffect(() => {
        const container = telegramWidgetRef.current;

        if (!container) return;

        container.innerHTML = "";
        setIsTelegramWidgetReady(false);

        const script = document.createElement("script");
        script.src = TELEGRAM_WIDGET_SCRIPT_SRC;
        script.async = true;
        script.setAttribute("data-telegram-login", TELEGRAM_BOT_USERNAME);
        script.setAttribute("data-size", "large");
        script.setAttribute("data-radius", "14");
        script.setAttribute("data-onauth", "onTelegramAuth(user)");
        script.setAttribute("data-request-access", "write");
        script.onload = () => setIsTelegramWidgetReady(true);
        script.onerror = () => setErrorText("Не удалось войти через Telegram");

        container.appendChild(script);

        if (
            window.location.hostname &&
            window.location.hostname !== "omniai.ru" &&
            window.location.hostname !== "www.omniai.ru"
        ) {
            setIsTelegramDomainHintVisible(true);
        }

        return () => {
            script.onload = null;
            script.onerror = null;
            container.innerHTML = "";
        };
    }, []);

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

        const buttonWidth = Math.max(
            googleButtonWrapperRef.current?.offsetWidth ||
                googleButtonContainerRef.current.offsetWidth ||
                360,
            320
        );

        googleButtonContainerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleButtonContainerRef.current, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: buttonWidth,
        });

        googleButtonContainerRef.current
            .querySelectorAll<HTMLElement>("div, iframe")
            .forEach((element) => {
                element.style.width = "100%";
                element.style.maxWidth = "100%";
                element.style.minWidth = "100%";
                element.style.height = "100%";
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
                title="Вход в OmniAI"
                description="Войдите, чтобы открыть чаты, модели и историю"
            />

            <section className="mb-6 space-y-3" aria-label="Быстрый вход">
                <div className="text-center text-body-sm font-medium text-gray-500">
                    Продолжить с помощью
                </div>

                <div className="space-y-3">
                    <div
                        className={`group relative grid h-14 w-full grid-cols-[1.375rem_1fr_1.375rem] items-center overflow-hidden rounded-[0.875rem] border border-gray-100 bg-gray-0 px-5 text-body-md font-semibold text-gray-800 shadow-[0_0.0625rem_0.125rem_0_rgba(13,13,18,0.04)] transition-all hover:-translate-y-0.5 hover:border-gray-200 hover:bg-gray-25 hover:shadow-[0_0.375rem_1rem_rgba(13,13,18,0.06)] active:translate-y-0 active:scale-[0.99] ${
                            isLoading || isGoogleLoading || isTelegramLoading
                                ? "pointer-events-none cursor-wait opacity-70"
                                : "cursor-pointer"
                        }`}
                        role="button"
                        aria-disabled={isLoading || isGoogleLoading || isTelegramLoading}
                        ref={googleButtonWrapperRef}
                    >
                        <Image
                            className="pointer-events-none size-[22px] opacity-100"
                            src="/images/google.svg"
                            width={22}
                            height={22}
                            alt=""
                        />
                        <span className="pointer-events-none text-center">
                            {isGoogleLoading ? "Входим..." : "Войти через Google"}
                        </span>
                        <span aria-hidden="true" />
                        <div
                            className="absolute inset-0 z-10 h-full w-full opacity-[0.01] [&>*]:!h-full [&>*]:!w-full [&_iframe]:!h-full [&_iframe]:!w-full"
                            ref={googleButtonContainerRef}
                            aria-label="Войти через Google"
                        />
                    </div>

                    {!isGoogleScriptReady && (
                        <div className="rounded-xl bg-primary-0 px-3 py-2 text-center text-body-sm text-primary-300">
                            Загружаем вход через Google...
                        </div>
                    )}

                    <div
                        className={`rounded-[0.875rem] border border-gray-100 bg-gray-0 px-5 py-2.5 shadow-[0_0.0625rem_0.125rem_0_rgba(13,13,18,0.04)] transition-all hover:-translate-y-0.5 hover:border-gray-200 hover:bg-gray-25 hover:shadow-[0_0.375rem_1rem_rgba(13,13,18,0.06)] active:translate-y-0 active:scale-[0.99] ${
                            isLoading || isGoogleLoading || isTelegramLoading
                                ? "opacity-70"
                                : ""
                        }`}
                    >
                        <div className="grid min-h-9 grid-cols-[1.375rem_1fr_1.375rem] items-center gap-2">
                            <span className="flex size-[22px] items-center justify-center">
                                <TelegramPlaneIcon />
                            </span>
                            <div className="flex min-w-0 items-center justify-center overflow-hidden rounded-xl">
                                <div
                                    className="flex max-w-full items-center justify-center overflow-hidden [&>*]:!max-w-full [&_iframe]:!max-w-full [&_iframe]:!align-middle"
                                    ref={telegramWidgetRef}
                                    aria-label="Войти через Telegram"
                                />
                            </div>
                            <span aria-hidden="true" />
                        </div>

                        {isTelegramLoading && (
                            <div className="mt-1 text-center text-xs font-medium text-gray-400">
                                Входим через Telegram...
                            </div>
                        )}

                        {!isTelegramWidgetReady && !isTelegramLoading && (
                            <div className="mt-1 text-center text-xs font-medium text-gray-400">
                                Загружаем Telegram...
                            </div>
                        )}
                    </div>

                    {isTelegramDomainHintVisible && (
                        <div className="rounded-xl bg-primary-0 px-3 py-2 text-center text-body-sm text-primary-300">
                            Telegram-вход доступен только на основном домене omniai.ru
                        </div>
                    )}
                </div>
            </section>

            <div className="mb-5 flex items-center gap-4 text-body-sm text-gray-400 before:h-px before:grow before:bg-gray-100 after:h-px after:grow after:bg-gray-100">
                или войти по email
            </div>

            <Field
                className="mb-4"
                classInput="!h-14 !rounded-[0.875rem] !border-gray-100 !px-4"
                label="Email"
                placeholder="Введите email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                required
            />

            <Field
                className="mb-3"
                classInput="!h-14 !rounded-[0.875rem] !border-gray-100 !px-4 !pr-12"
                label="Пароль"
                placeholder="Введите пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                required
            />

            {errorText && (
                <div className="mb-3 rounded-xl bg-error-0 px-3 py-2 text-body-sm text-error-200">
                    {errorText}
                </div>
            )}
            {successText && (
                <div className="mb-3 rounded-xl bg-success-0 px-3 py-2 text-body-sm text-success-200">
                    {successText}
                </div>
            )}

            <div className="mb-5 flex min-h-10 items-center justify-between gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
                <Checkbox
                    className="items-center"
                    classLabel="leading-5"
                    label="Запомнить меня"
                    checked={remember}
                    onChange={() => setRemember(!remember)}
                />
                <Link
                    className="text-body-sm font-medium text-primary-200 transition-colors hover:text-primary-300"
                    href="/auth/forgot-password"
                >
                    Забыли пароль?
                </Link>
            </div>

            <Button
                className="mb-3 !h-14 w-full !rounded-[0.875rem] disabled:opacity-70"
                isPrimary
                type="button"
                onClick={handleLogin}
                disabled={
                    isLoading ||
                    isGoogleLoading ||
                    isTelegramLoading ||
                    !email.trim() ||
                    !password.trim()
                }
            >
                {isLoading ? "Входим..." : "Войти"}
            </Button>

            <div className="flex items-center justify-center gap-2 pt-1 text-body-sm">
                <div className="text-gray-500">Нет аккаунта?</div>
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
