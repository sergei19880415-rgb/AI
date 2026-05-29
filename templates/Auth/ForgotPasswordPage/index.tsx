"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Login/Layout";
import Start from "./Start";
import ConfirmCode from "./ConfirmCode";

const RESET_SUCCESS_MESSAGE = "Пароль обновлён. Теперь можно войти.";

const ForgotPasswordPage = () => {
    const router = useRouter();
    const [step, setStep] = useState<"start" | "confirm">("start");
    const [email, setEmail] = useState("");
    const [requestMessage, setRequestMessage] = useState("");

    const handleCodeRequested = (requestedEmail: string, message: string) => {
        setEmail(requestedEmail);
        setRequestMessage(message);
        setStep("confirm");
    };

    const handlePasswordChanged = () => {
        try {
            localStorage.setItem("ai_remember_email", email.trim());
        } catch {
            // localStorage can be unavailable in private mode; reset flow should still finish.
        }

        router.push("/auth/sign-in?reset=1");
    };

    return (
        <Layout>
            {step === "start" && (
                <Start onCodeRequested={handleCodeRequested} />
            )}
            {step === "confirm" && (
                <ConfirmCode
                    email={email}
                    requestMessage={requestMessage}
                    successMessage={RESET_SUCCESS_MESSAGE}
                    onPasswordChanged={handlePasswordChanged}
                />
            )}
        </Layout>
    );
};

export default ForgotPasswordPage;
