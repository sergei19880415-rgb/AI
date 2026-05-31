"use client";

import { useCallback, useEffect, useRef } from "react";
import { syncCloudChatsToLocalStorage } from "@/lib/cloudChatHistory";

const hasSessionToken = () => {
    return Boolean(localStorage.getItem("ai_session_token"));
};

const CloudChatHistorySync = () => {
    const syncInProgressRef = useRef(false);

    const refreshCloudChats = useCallback(async (force = false) => {
        if (!hasSessionToken()) return;
        if (syncInProgressRef.current) return;

        syncInProgressRef.current = true;

        try {
            await syncCloudChatsToLocalStorage({
                force,
                source: force ? "startup" : "focus",
            });
        } finally {
            syncInProgressRef.current = false;
        }
    }, []);

    useEffect(() => {
        void refreshCloudChats(true);

        const handleFocus = () => {
            void refreshCloudChats(false);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void refreshCloudChats(false);
            }
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [refreshCloudChats]);

    return null;
};

export default CloudChatHistorySync;
