"use client";

import { type KeyboardEvent } from "react";
import Link from "next/link";
import Head from "@/components/Login/Head";
import Button from "@/components/Button";
import Field from "@/components/Field";

type Props = {
    code: string;
    onCodeChange: (value: string) => void;
    onSubmit: () => void;
    isLoading?: boolean;
    errorText?: string;
    infoText?: string;
    successText?: string;
    onBackToSignIn?: () => void;
};

const EmailVerificationForm = ({
    code,
    onCodeChange,
    onSubmit,
    isLoading,
    errorText,
    infoText,
    successText,
    onBackToSignIn,
}: Props) => {
    const handleKeyDown = (
        e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <>
            <Head
                title="Подтвердите email"
                description="Мы отправили код на вашу почту. Введите его ниже."
            />

            <Field
                className="mb-4"
                label="Код подтверждения"
                placeholder="Введите код"
                type="text"
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                onKeyDown={handleKeyDown}
                required
            />

            {infoText && <div className="mb-3 text-sm text-blue-600">{infoText}</div>}
            {errorText && <div className="mb-3 text-sm text-red-600">{errorText}</div>}
            {successText && (
                <div className="mb-3 text-sm text-green-700">{successText}</div>
            )}

            <Button
                className="w-full mb-2"
                isPrimary
                type="button"
                onClick={onSubmit}
                disabled={isLoading || !code.trim()}
            >
                {isLoading ? "Проверка..." : "Подтвердить"}
            </Button>

            <div className="flex justify-center items-center gap-2 h-14 text-body-sm">
                {onBackToSignIn ? (
                    <button
                        className="font-medium text-primary-200 transition-colors hover:text-primary-300"
                        type="button"
                        onClick={onBackToSignIn}
                    >
                        Вернуться ко входу
                    </button>
                ) : (
                    <Link
                        className="font-medium text-primary-200 transition-colors hover:text-primary-300"
                        href="/auth/sign-in"
                    >
                        Вернуться ко входу
                    </Link>
                )}
            </div>
        </>
    );
};

export default EmailVerificationForm;
