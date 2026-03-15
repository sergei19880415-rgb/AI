"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Head from "@/components/Login/Head";
import Button from "@/components/Button";
import Image from "@/components/Image";
import Field from "@/components/Field";
import Checkbox from "@/components/Checkbox";

type Props = {
    onContinueWithEmail: () => void;
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

type LoginResponse = {
    success?: boolean;
    firstName?: string;
    lastName?: string;
    planType?: string;
    allowedModels?: string;
    maxParallelModels?: number | string;
    modelsCatalog?: ModelCatalogItem[];
    message?: string;
};

const LOGIN_WEBHOOK_URL = "https://tgdomen.ru/webhook/login-auth";

const getSelectedModelKey = (userEmail: string) => {
    return `ai_selected_model_${userEmail.trim()}`;
};

const getParallelCountKey = (userEmail: string) => {
    return `ai_parallel_count_${userEmail.trim()}`;
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
        message:
            typeof value.message === "string" ? value.message : undefined,
    };
};

const Start = ({ onContinueWithEmail }: Props) => {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [errorText, setErrorText] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const savedRememberEmail = localStorage.getItem("ai_remember_email");
        if (savedRememberEmail) {
            setEmail(savedRememberEmail);
            setRemember(true);
        }
    }, []);

    const handleLogin = async () => {
        const cleanEmail = email.trim();
        const cleanPassword = password.trim();

        if (!cleanEmail || !cleanPassword || isLoading) return;

        setIsLoading(true);
        setErrorText("");

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
                localStorage.setItem("ai_user_email", cleanEmail);

                localStorage.setItem(
                    "ai_user_first_name",
                    (data.firstName || "").trim()
                );

                localStorage.setItem(
                    "ai_user_name",
                    `${data.firstName || ""} ${data.lastName || ""}`.trim()
                );

                localStorage.setItem(
                    "ai_plan_type",
                    data.planType || "Базовый"
                );

                localStorage.setItem(
                    "ai_allowed_models",
                    data.allowedModels || ""
                );

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
                    savedSelectedModel &&
                    allowedModelIds.includes(savedSelectedModel)
                        ? savedSelectedModel
                        : allowedModelIds[0] ||
                          (data.allowedModels || "")
                              .split(",")
                              .map((item: string) => item.trim())
                              .filter(Boolean)[0] ||
                          "";

                if (defaultModelId) {
                    localStorage.setItem(
                        currentSelectedModelKey,
                        defaultModelId
                    );
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

                if (remember) {
                    localStorage.setItem("ai_remember_email", cleanEmail);
                } else {
                    localStorage.removeItem("ai_remember_email");
                }

                router.push("/chat");
                return;
            }

            setErrorText(data.message || "Неверный логин или пароль");
        } catch {
            setErrorText("Ошибка сети или CORS");
        } finally {
            setIsLoading(false);
        }
    };

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
            <Head
                title="Вход в AI-агрегатор"
                description="Войди, чтобы открыть чат и свои доступные модели."
            />

            <Button className="w-full mb-3" isSecondary type="button">
                <Image
                    className="w-5 opacity-100"
                    src="/images/google.svg"
                    width={20}
                    height={20}
                    alt="Google"
                />
                Войти через Google
            </Button>

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
                disabled={isLoading || !email.trim() || !password.trim()}
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