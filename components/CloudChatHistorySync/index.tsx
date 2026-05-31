"use client";

import { useCallback, useEffect, useRef } from "react";
import { syncCloudChatsToLocalStorage } from "@/lib/chatHistoryCloud";

const hasSessionToken = () => {
    return Boolean(localStorage.getItem("ai_session_token"));
};

const CloudChatHistorySync = () => {
    const syncInProgressRef = useRef(false);
    const lastSyncAtRef = useRef(0);

    const refreshCloudChats = useCallback(async (force = false) => {
        if (!hasSessionToken()) return;
        if (syncInProgressRef.current) return;

        const now = Date.now();
        if (!force && now - lastSyncAtRef.current < 10000) return;

        syncInProgressRef.current = true;
        lastSyncAtRef.current = now;

        try {
            await syncCloudChatsToLocalStorage();
        } finally {
            syncInProgressRef.current = false;
        }
    }, []);

    useEffect(() => {
        void refreshCloudChats(true);

        const handleFocus = () => {
            void refreshCloudChats(true);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void refreshCloudChats(true);
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
