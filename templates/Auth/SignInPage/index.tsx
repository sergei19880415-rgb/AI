"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Login/Layout";
import EmailVerificationForm from "@/components/Login/EmailVerificationForm";
import Start from "./Start";

type VerifyEmailResponse = {
    success?: boolean;
    message?: string;
};

const VERIFY_EMAIL_WEBHOOK_URL = "https://tgdomen.ru/webhook/verify-email";

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
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

const SignInPage = () => {
    const router = useRouter();
    const [step, setStep] = useState<"start" | "verify">("start");
    const [pendingEmail, setPendingEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [verifyErrorText, setVerifyErrorText] = useState("");
    const [verifyInfoText, setVerifyInfoText] = useState("");
    const [isVerifyLoading, setIsVerifyLoading] = useState(false);

    const handleRequireEmailVerification = (
        email: string,
        message?: string
    ) => {
        setPendingEmail(email.trim());
        setVerificationCode("");
        setVerifyErrorText("");
        setVerifyInfoText(
            message || "Подтвердите email. Код уже отправлен на вашу почту."
        );
        setStep("verify");
    };

    const handleVerifyEmail = async () => {
        const cleanPendingEmail = pendingEmail.trim();
        const cleanCode = verificationCode.trim();

        if (!cleanPendingEmail || !cleanCode || isVerifyLoading) return;

        setIsVerifyLoading(true);
        setVerifyErrorText("");

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
                setVerifyErrorText("Сервер подтверждения вернул непонятный ответ");
                setIsVerifyLoading(false);
                return;
            }

            const data = toVerifyEmailResponse(parsed);

            if (!response.ok || !data?.success) {
                setVerifyErrorText(data?.message || "Не удалось подтвердить email");
                setIsVerifyLoading(false);
                return;
            }

            localStorage.setItem("ai_remember_email", cleanPendingEmail);
            router.push("/auth/sign-in?verified=1");
        } catch {
            setVerifyErrorText("Ошибка сети или CORS");
        } finally {
            setIsVerifyLoading(false);
        }
    };

    const handleBackToSignIn = () => {
        setStep("start");
        setVerificationCode("");
        setVerifyErrorText("");
        setVerifyInfoText("");
    };

    return (
        <Layout>
            {step === "start" && (
                <Start
                    onRequireEmailVerification={handleRequireEmailVerification}
                />
            )}
            {step === "verify" && (
                <EmailVerificationForm
                    code={verificationCode}
                    onCodeChange={setVerificationCode}
                    onSubmit={handleVerifyEmail}
                    isLoading={isVerifyLoading}
                    errorText={verifyErrorText}
                    infoText={verifyInfoText}
                    onBackToSignIn={handleBackToSignIn}
                />
            )}
        </Layout>
    );
};

export default SignInPage;
