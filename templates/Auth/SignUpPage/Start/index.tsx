"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Head from "@/components/Login/Head";
import Button from "@/components/Button";
import Field from "@/components/Field";
import Checkbox from "@/components/Checkbox";

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

type RegisterResponse = {
    success?: boolean;
    message?: string;
};

const REGISTER_WEBHOOK_URL = "https://tgdomen.ru/webhook/register-auth";
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

const toRegisterResponse = (value: unknown): RegisterResponse | null => {
    if (!isRecord(value)) return null;

    return {
        success:
            typeof value.success === "boolean" ? value.success : undefined,
        message:
            typeof value.message === "string" ? value.message : undefined,
    };
};

const applyLoginState = (
    data: LoginResponse,
    cleanEmail: string,
    fallbackFirstName = ""
) => {
    const resolvedFirstName = (
        data.firstName ||
        fallbackFirstName ||
        localStorage.getItem("ai_user_first_name") ||
        ""
    ).trim();

    const resolvedLastName = (data.lastName || "").trim();
    const resolvedFullName = `${resolvedFirstName} ${resolvedLastName}`.trim();

    localStorage.setItem("ai_user_email", cleanEmail);
    localStorage.setItem("ai_user_first_name", resolvedFirstName);
    localStorage.setItem("ai_user_name", resolvedFullName);

    localStorage.setItem(
        "ai_plan_type",
        data.planType || "Базовый"
    );

    localStorage.setItem(
        "ai_allowed_models",
        data.allowedModels || ""
    );

    const modelsCatalog: ModelCatalogItem[] = Array.isArray(data.modelsCatalog)
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
};

const Start = () => {
    const router = useRouter();

    const [firstName, setFirstName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [errorText, setErrorText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showTermsError, setShowTermsError] = useState(false);

    const handleSignUp = async () => {
        const cleanFirstName = firstName.trim();
        const cleanEmail = email.trim();
        const cleanPassword = password.trim();
        const cleanConfirmPassword = confirmPassword.trim();

        if (
            !cleanFirstName ||
            !cleanEmail ||
            !cleanPassword ||
            !cleanConfirmPassword ||
            isLoading
        ) {
            return;
        }

        if (!agreeTerms) {
            setShowTermsError(true);
            setErrorText(
                "Подтверди согласие с Условиями и Политикой конфиденциальности"
            );
            return;
        }

        setShowTermsError(false);

        if (cleanPassword.length < 6) {
            setErrorText("Пароль должен быть не короче 6 символов");
            return;
        }

        if (cleanPassword !== cleanConfirmPassword) {
            setErrorText("Пароли не совпадают");
            return;
        }

        setIsLoading(true);
        setErrorText("");

        try {
            const registerResponse = await fetch(REGISTER_WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    firstName: cleanFirstName,
                    email: cleanEmail,
                    password: cleanPassword,
                }),
            });

            const registerRaw = await registerResponse.text();

            let registerParsed: unknown = null;

            try {
                registerParsed = JSON.parse(registerRaw);
            } catch {
                setErrorText("Сервер регистрации вернул непонятный ответ");
                setIsLoading(false);
                return;
            }

            const registerData = toRegisterResponse(registerParsed);

            if (!registerResponse.ok || !registerData?.success) {
                setErrorText(
                    registerData?.message || "Не удалось создать аккаунт"
                );
                setIsLoading(false);
                return;
            }

            localStorage.setItem("ai_user_first_name", cleanFirstName);
            localStorage.setItem("ai_user_name", cleanFirstName);

            const loginResponse = await fetch(LOGIN_WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: cleanEmail,
                    password: cleanPassword,
                }),
            });

            const loginRaw = await loginResponse.text();

            let loginParsed: unknown = null;

            try {
                loginParsed = JSON.parse(loginRaw);
            } catch {
                localStorage.setItem("ai_remember_email", cleanEmail);
                router.push("/auth/sign-in");
                return;
            }

            const loginData = toLoginResponse(loginParsed);

            if (!loginResponse.ok || !loginData?.success) {
                localStorage.setItem("ai_remember_email", cleanEmail);
                router.push("/auth/sign-in");
                return;
            }

            applyLoginState(loginData, cleanEmail, cleanFirstName);
            localStorage.setItem("ai_remember_email", cleanEmail);

            router.push("/chat");
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
            void handleSignUp();
        }
    };

    const handleTermsChange = (value: boolean) => {
        setAgreeTerms(value);
        if (value) {
            setShowTermsError(false);
        }
    };

    return (
        <>
            <Head
                title="Создай аккаунт в MAX AI"
                description="Зарегистрируйся и начни пользоваться AI-агрегатором."
            />

            <Field
                className="mb-3"
                label="Имя"
                placeholder="Введите имя"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onKeyDown={handleKeyDown}
                required
            />

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
                className="mb-3"
                label="Пароль"
                placeholder="Введите пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                required
            />

            <Field
                className="mb-4"
                label="Подтвердите пароль"
                placeholder="Повторите пароль"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                required
            />

            {errorText && (
                <div className="mb-3 text-sm text-red-600">{errorText}</div>
            )}

            <div
                className={`mb-4 rounded-xl border p-3 transition-colors ${
                    showTermsError
                        ? "border-red-500 bg-red-50"
                        : "border-gray-100 bg-gray-0"
                }`}
            >
                <Checkbox
                    className="items-start"
                    classTick={showTermsError ? "!border-red-500" : ""}
                    classLabel={showTermsError ? "!text-red-600" : ""}
                    label="Я согласен с Условиями и Политикой конфиденциальности"
                    checked={agreeTerms}
                    onChange={handleTermsChange}
                />
            </div>

            <Button
                className="w-full mb-2"
                isPrimary
                type="button"
                onClick={handleSignUp}
                disabled={
                    isLoading ||
                    !firstName.trim() ||
                    !email.trim() ||
                    !password.trim() ||
                    !confirmPassword.trim()
                }
            >
                {isLoading ? "Создание аккаунта..." : "Зарегистрироваться"}
            </Button>

            <div className="flex justify-center items-center gap-2 h-14 text-body-sm">
                <div className="text-gray-600">Уже есть аккаунт?</div>
                <Link
                    className="font-medium text-primary-200 transition-colors hover:text-primary-300"
                    href="/auth/sign-in"
                >
                    Войти
                </Link>
            </div>
        </>
    );
};

export default Start;
