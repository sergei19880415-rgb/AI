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
                    title="Verify your Zyra AI account"
                    onContinue={handleVerifyCode}
                />
            )}
            {step === "success" && (
                <Success
                    title="Login Successful!"
                    description="Welcome back to Zyra let’s continue your journey."
                />
            )}
        </Layout>
    );
};

export default SignInPage;
