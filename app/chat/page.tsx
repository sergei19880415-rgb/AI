"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatPage from "@/templates/ChatPage";

export default function Page() {
    const router = useRouter();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const savedEmail = localStorage.getItem("ai_user_email") || "";
        const cleanEmail = savedEmail.trim();

        if (!cleanEmail) {
            router.replace("/auth/sign-in");
            setIsCheckingAuth(false);
            return;
        }

        setIsAuthorized(true);
        setIsCheckingAuth(false);
    }, [router]);

    if (isCheckingAuth || !isAuthorized) {
        return null;
    }

    return <ChatPage />;
}