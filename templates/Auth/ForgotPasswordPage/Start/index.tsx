import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import Head from "@/components/Login/Head";
import Button from "@/components/Button";
import Field from "@/components/Field";

type Props = {
    onCodeRequested: (email: string, message: string) => void;
};

type PasswordResetResponse = {
    success?: boolean;
    message?: string;
};

const REQUEST_PASSWORD_RESET_URL =
    "https://tgdomen.ru/webhook/request-password-reset";

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

const Start = ({ onCodeRequested }: Props) => {
    const [email, setEmail] = useState("");
    const [errorText, setErrorText] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleRequestCode = async () => {
        const cleanEmail = email.trim();

        if (!cleanEmail || isLoading) return;

        setIsLoading(true);
        setErrorText("");

        try {
            const response = await fetch(REQUEST_PASSWORD_RESET_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: cleanEmail,
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
                setErrorText(data?.message || "Не удалось отправить код");
                setIsLoading(false);
                return;
            }

            onCodeRequested(
                cleanEmail,
                data.message ||
                    "Если аккаунт с таким email существует, мы отправили код восстановления."
            );
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
            void handleRequestCode();
        }
    };

    return (
        <>
            <Head
                title="Восстановление пароля"
                description="Введите email, и мы отправим код для восстановления пароля."
            />
            <Field
                className="mb-4"
                label="Email"
                placeholder="Введите email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                onClick={handleRequestCode}
                disabled={isLoading || !email.trim()}
            >
                {isLoading ? "Отправка..." : "Получить код"}
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

export default Start;
