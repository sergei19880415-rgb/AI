"use client";

import { useCallback, useEffect, useRef } from "react";
import { syncCloudChatsToLocalStorage } from "@/lib/cloudChatHistory";

const CLOUD_SYNC_INTERVAL_MS = 20000;
const CLOUD_SYNC_THROTTLE_MS = 15000;

const hasValidLocalAuth = () => {
    const token = localStorage.getItem("ai_session_token")?.trim() || "";
    const email = localStorage.getItem("ai_user_email")?.trim() || "";

    return Boolean(token && email);
};

const CloudChatHistorySync = () => {
    const syncInProgressRef = useRef(false);
    const lastSyncStartedAtRef = useRef(0);

    const refreshCloudChats = useCallback(async (
        force = false,
        source: "startup" | "focus" | "poll" = force ? "startup" : "focus"
    ) => {
        if (!hasValidLocalAuth()) return;
        if (syncInProgressRef.current) return;

        const now = Date.now();
        if (!force && now - lastSyncStartedAtRef.current < CLOUD_SYNC_THROTTLE_MS) return;

        syncInProgressRef.current = true;
        lastSyncStartedAtRef.current = now;

        try {
            await syncCloudChatsToLocalStorage({
                force,
                source,
            });
        } finally {
            syncInProgressRef.current = false;
        }
    }, []);

    useEffect(() => {
        if (!hasValidLocalAuth()) return;

        void refreshCloudChats(true);

        const handleFocus = () => {
            void refreshCloudChats(false);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void refreshCloudChats(false, "poll");
            }
        };

        const handleStorage = (event: StorageEvent) => {
            if (
                (event.key === "ai_session_token" || event.key === "ai_user_email") &&
                hasValidLocalAuth()
            ) {
                void refreshCloudChats(true);
            }
        };

        const handleManualRefresh = () => {
            void refreshCloudChats(true);
        };

        const intervalId = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                void refreshCloudChats(false, "poll");
            }
        }, CLOUD_SYNC_INTERVAL_MS);

        window.addEventListener("focus", handleFocus);
        window.addEventListener("storage", handleStorage);
        window.addEventListener("ai-cloud-chat-history-refresh", handleManualRefresh);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener(
                "ai-cloud-chat-history-refresh",
                handleManualRefresh
            );
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [refreshCloudChats]);

    return null;
};

export default CloudChatHistorySync;
