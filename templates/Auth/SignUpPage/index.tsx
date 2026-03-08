"use client";

import React, { useState } from "react";
import Layout from "@/components/Login/Layout";
import VerifyCode from "@/components/Login/VerifyCode";
import Success from "@/components/Login/Success";
import Start from "./Start";
import About from "./About";

const SignInPage = () => {
    const [step, setStep] = useState<"start" | "verify" | "about" | "success">(
        "start"
    );

    const handleSignUp = () => {
        setStep("verify");
    };

    const handleVerifyCode = () => {
        setStep("about");
    };
    const handleAbout = () => {
        setStep("success");
    };

    return (
        <Layout>
            {step === "start" && <Start onSignUp={handleSignUp} />}
            {step === "verify" && (
                <VerifyCode
                    title="Verify your email address"
                    onContinue={handleVerifyCode}
                />
            )}
            {step === "about" && <About onContinue={handleAbout} />}
            {step === "success" && (
                <Success
                    title="Registration Complete!"
                    description="Let’s get started with your first AI chat."
                />
            )}
        </Layout>
    );
};

export default SignInPage;
