"use client";

import React, { useState } from "react";
import Layout from "@/components/Login/Layout";
import VerifyCode from "@/components/Login/VerifyCode";
import Success from "@/components/Login/Success";
import Start from "./Start";

const SignInPage = () => {
    const [step, setStep] = useState<"start" | "verify" | "success">("start");

    const handleContinueWithEmail = () => {
        setStep("verify");
    };

    const handleVerifyCode = () => {
        setStep("success");
    };

    return (
        <Layout>
            {step === "start" && (
                <Start onContinueWithEmail={handleContinueWithEmail} />
            )}
            {step === "verify" && (
                <VerifyCode
                    title="Подтвердите вход в MAX AI"
                    onContinue={handleVerifyCode}
                />
            )}
            {step === "success" && (
                <Success
                    title="Вход выполнен"
                    description="С возвращением! Продолжим работу в MAX AI."
                />
            )}
        </Layout>
    );
};

export default SignInPage;