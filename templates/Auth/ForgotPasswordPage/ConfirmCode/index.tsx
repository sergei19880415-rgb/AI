import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import Head from "@/components/Login/Head";
import Button from "@/components/Button";
import Field from "@/components/Field";

type Props = {
    email: string;
    requestMessage: string;
    successMessage: string;
    onPasswordChanged: () => void;
};

type PasswordResetResponse = {
    success?: boolean;
    message?: string;
};

const CONFIRM_PASSWORD_RESET_URL =
    "https://tgdomen.ru/webhook/confirm-password-reset";

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const toPasswordResetResponse = (value: unknown): PasswordResetResponse | null => {
    if (!isRecord(value)) return null;

    return {
        success:
            typeof value.success === "boolean" ? value.success : undefined,
        message:
            typeof value.message === "string" ? value.message : undefined,
    };
};

const ConfirmCode = ({
    email,
    requestMessage,
    successMessage,
    onPasswordChanged,
}: Props) => {
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorText, setErrorText] = useState("");
    const [successText, setSuccessText] = useState(requestMessage);
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirmReset = async () => {
        const cleanEmail = email.trim();
        const cleanCode = code.trim();
        const cleanPassword = password.trim();
        const cleanConfirmPassword = confirmPassword.trim();

        if (!cleanEmail || !cleanCode || isLoading) return;

        if (!cleanPassword) {
            setErrorText("Введите новый пароль");
            return;
        }

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
        setSuccessText("");

        try {
            const response = await fetch(CONFIRM_PASSWORD_RESET_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: cleanEmail,
                    code: cleanCode,
                    newPassword: cleanPassword,
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

            const data = toPasswordResetResponse(parsed);

            if (!response.ok || !data?.success) {
                setErrorText(
                    data?.message ||
                        "Неверный или просроченный код восстановления."
                );
                setIsLoading(false);
                return;
            }

            setSuccessText(data.message || successMessage);
            onPasswordChanged();
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
            void handleConfirmReset();
        }
    };

    return (
        <>
            <Head
                title="Смена пароля"
                description={
                    <>
                        Введите код восстановления для
                        <span className="block text-gray-800">
                            {email.trim()}
                        </span>
                    </>
                }
            />

            {successText && (
                <div className="mb-3 text-sm text-green-700">
                    {successText}
                </div>
            )}

            <Field
                className="mb-3"
                label="Код восстановления"
                placeholder="Введите код"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                required
            />
            <Field
                className="mb-3"
                label="Новый пароль"
                placeholder="Введите новый пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                required
            />
            <Field
                className="mb-4"
                label="Повторите новый пароль"
                placeholder="Повторите новый пароль"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                required
            />

            {errorText && (
                <div className="mb-3 text-sm text-red-600">{errorText}</div>
            )}

            <Button
                className="w-full mb-2"
                isPrimary
                type="button"
                onClick={handleConfirmReset}
                disabled={
                    isLoading ||
                    !code.trim() ||
                    !password.trim() ||
                    !confirmPassword.trim()
                }
            >
                {isLoading ? "Смена пароля..." : "Сменить пароль"}
            </Button>

            <div className="flex justify-center items-center gap-2 h-14 text-body-sm">
                <Link
                    className="font-medium text-primary-200 transition-colors hover:text-primary-300"
                    href="/auth/sign-in"
                >
                    Назад ко входу
                </Link>
            </div>
        </>
    );
};

export default ConfirmCode;
