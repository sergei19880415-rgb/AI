"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Head from "@/components/Login/Head";
import Button from "@/components/Button";
import Field from "@/components/Field";
import Checkbox from "@/components/Checkbox";
import EmailVerificationForm from "@/components/Login/EmailVerificationForm";
import { normalizeUserEmail } from "@/lib/userStorage";
import {
    clearPostAuthReloadFlag,
    hardNavigateAfterAuth,
    saveAuthSessionAndResetChatState,
} from "@/lib/authSession";

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
    sessionToken?: string;
    sessionExpiresAt?: string;
    message?: string;
};

type RegisterResponse = {
    success?: boolean;
    emailVerificationRequired?: boolean;
    message?: string;
};

type VerifyEmailResponse = {
    success?: boolean;
    message?: string;
};

const REGISTER_WEBHOOK_URL = "https://tgdomen.ru/webhook/register-auth";
const LOGIN_WEBHOOK_URL = "https://tgdomen.ru/webhook/login-auth";
const VERIFY_EMAIL_WEBHOOK_URL = "https://tgdomen.ru/webhook/verify-email";

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
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

const toRegisterResponse = (value: unknown): RegisterResponse | null => {
    if (!isRecord(value)) return null;

    return {
        success:
            typeof value.success === "boolean" ? value.success : undefined,
        emailVerificationRequired:
            typeof value.emailVerificationRequired === "boolean"
                ? value.emailVerificationRequired
                : undefined,
        message:
            typeof value.message === "string" ? value.message : undefined,
    };
};

const toVerifyEmailResponse = (value: unknown): VerifyEmailResponse | null => {
    if (!isRecord(value)) return null;

    return {
        success:
            typeof value.success === "boolean" ? value.success : undefined,
        message:
            typeof value.message === "string" ? value.message : undefined,
    };
};

const applyLoginState = (data: LoginResponse, cleanEmail: string) => {
    saveAuthSessionAndResetChatState(data, cleanEmail);
};

const Start = () => {
    const router = useRouter();

    useEffect(() => {
        clearPostAuthReloadFlag();
    }, []);

    const [firstName, setFirstName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [errorText, setErrorText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showTermsError, setShowTermsError] = useState(false);
    const [pendingEmail, setPendingEmail] = useState("");
    const [pendingPassword, setPendingPassword] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [isVerifyLoading, setIsVerifyLoading] = useState(false);
    const [verifySuccessText, setVerifySuccessText] = useState("");

    const handleSignUp = async () => {
        const cleanFirstName = firstName.trim();
        const cleanEmail = normalizeUserEmail(email, "");
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

            if (registerData.emailVerificationRequired) {
                setPendingEmail(cleanEmail);
                setPendingPassword(cleanPassword);
                setVerificationCode("");
                setVerifySuccessText("");
                setErrorText("");
                return;
            }

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

            applyLoginState(loginData, cleanEmail);
            localStorage.setItem("ai_remember_email", cleanEmail);
            hardNavigateAfterAuth("/chat");
        } catch {
            setErrorText("Ошибка сети или CORS");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyEmail = async () => {
        const cleanPendingEmail = normalizeUserEmail(pendingEmail, "");
        const cleanPendingPassword = pendingPassword.trim();
        const cleanCode = verificationCode.trim();

        if (!cleanPendingEmail || !cleanCode || isVerifyLoading) return;

        setIsVerifyLoading(true);
        setErrorText("");
        setVerifySuccessText("");

        try {
            const response = await fetch(VERIFY_EMAIL_WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: cleanPendingEmail,
                    code: cleanCode,
                }),
            });

            const raw = await response.text();

            let parsed: unknown = null;

            try {
                parsed = JSON.parse(raw);
            } catch {
                setErrorText("Сервер подтверждения вернул непонятный ответ");
                setIsVerifyLoading(false);
                return;
            }

            const data = toVerifyEmailResponse(parsed);

            if (!response.ok || !data?.success) {
                setErrorText(data?.message || "Не удалось подтвердить email");
                setIsVerifyLoading(false);
                return;
            }

            const successMessage =
                data.message || "Email подтверждён. Теперь можно войти.";

            setVerifySuccessText(successMessage);
            localStorage.setItem("ai_remember_email", cleanPendingEmail);

            if (!cleanPendingPassword) {
                setVerifySuccessText("Email подтверждён. Войдите в аккаунт.");
                setPendingPassword("");
                router.push("/auth/sign-in");
                return;
            }

            const loginResponse = await fetch(LOGIN_WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: cleanPendingEmail,
                    password: cleanPendingPassword,
                }),
            });

            const loginRaw = await loginResponse.text();

            let loginParsed: unknown = null;

            try {
                loginParsed = JSON.parse(loginRaw);
            } catch {
                setVerifySuccessText("Email подтверждён. Войдите в аккаунт.");
                setPendingPassword("");
                router.push("/auth/sign-in");
                return;
            }

            const loginData = toLoginResponse(loginParsed);

            if (!loginResponse.ok || !loginData?.success) {
                setVerifySuccessText("Email подтверждён. Войдите в аккаунт.");
                setPendingPassword("");
                router.push("/auth/sign-in");
                return;
            }

            applyLoginState(loginData, cleanPendingEmail);
            setPendingPassword("");
            hardNavigateAfterAuth("/chat");
        } catch {
            setErrorText("Ошибка сети или CORS");
        } finally {
            setIsVerifyLoading(false);
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

    if (pendingEmail) {
        return (
            <EmailVerificationForm
                code={verificationCode}
                onCodeChange={setVerificationCode}
                onSubmit={handleVerifyEmail}
                isLoading={isVerifyLoading}
                errorText={errorText}
                successText={verifySuccessText}
            />
        );
    }

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
