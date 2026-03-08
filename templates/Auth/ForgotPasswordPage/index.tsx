"use client";

import React, { useState } from "react";
import Layout from "@/components/Login/Layout";
import VerifyCode from "@/components/Login/VerifyCode";
import Success from "@/components/Login/Success";
import Start from "./Start";
import ConfirmCode from "./ConfirmCode";

const ForgotPasswordPage = () => {
    const [step, setStep] = useState<
        "start" | "verify" | "confirm" | "success"
    >("start");

    const handleContinueWithEmail = () => {
        setStep("verify");
    };

    const handleVerifyCode = () => {
        setStep("confirm");
    };

    const handleContinue = () => {
        setStep("success");
    };

    return (
        <Layout>
            {step === "start" && (
                <Start onContinueWithEmail={handleContinueWithEmail} />
            )}
            {step === "verify" && (
                <VerifyCode
                    title="Verify your email address"
                    onContinue={handleVerifyCode}
                />
            )}
            {step === "confirm" && <ConfirmCode onContinue={handleContinue} />}
            {step === "success" && (
                <Success
                    title="Password Reset Complete!"
                    description="Your password has been reset successfully. You can now login with your new password."
                    isResetPassword
                />
            )}
        </Layout>
    );
};

export default ForgotPasswordPage;
