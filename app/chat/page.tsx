"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatPage from "@/templates/ChatPage";
import { getStoredUserEmail } from "@/lib/userStorage";

export default function Page() {
    const router = useRouter();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const cleanEmail = getStoredUserEmail("");

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