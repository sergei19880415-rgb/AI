"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/Icon";

const findImageSettingsGrid = (shell: HTMLElement) => {
    const candidates = Array.from(shell.querySelectorAll<HTMLElement>("div.grid"));

    return (
        candidates.find((candidate) => {
            const text = candidate.textContent || "";
            return text.includes("Качество") && text.includes("Размер");
        }) || null
    );
};

const readSettingsSummary = (grid: HTMLElement) => {
    const qualityText = (grid.children[0]?.textContent || "")
        .replace("Качество", "")
        .trim();
    const sizeText = (grid.children[1]?.textContent || "")
        .replace("Размер", "")
        .trim();

    return [qualityText, sizeText].filter(Boolean).join(" · ");
};

const ImageSettingsToggle = () => {
    const [host, setHost] = useState<HTMLElement | null>(null);
    const [grid, setGrid] = useState<HTMLElement | null>(null);
    const [open, setOpen] = useState(false);
    const [summary, setSummary] = useState("");

    useEffect(() => {
        const shell = document.querySelector<HTMLElement>(".omni-panel-shell");
        if (!shell) return;

        let currentHost: HTMLElement | null = null;
        let currentGrid: HTMLElement | null = null;

        const scan = () => {
            const nextGrid = findImageSettingsGrid(shell);

            if (!nextGrid) {
                currentHost?.remove();
                currentHost = null;
                currentGrid = null;
                setHost(null);
                setGrid(null);
                setOpen(false);
                setSummary("");
                return;
            }

            nextGrid.classList.add("omni-image-settings-grid");

            if (!currentHost || !currentHost.isConnected) {
                currentHost = document.createElement("div");
                currentHost.className = "omni-image-settings-toggle-host";
                nextGrid.parentElement?.insertBefore(currentHost, nextGrid);
            }

            currentGrid = nextGrid;
            setGrid(nextGrid);
            setHost(currentHost);
            setSummary(readSettingsSummary(nextGrid));
        };

        scan();

        const observer = new MutationObserver(scan);
        observer.observe(shell, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        return () => {
            observer.disconnect();
            currentGrid?.classList.remove("omni-image-settings-grid", "is-open");
            currentHost?.remove();
        };
    }, []);

    useEffect(() => {
        grid?.classList.toggle("is-open", open);
    }, [grid, open]);

    if (!host) return null;

    return createPortal(
        <button
            type="button"
            className="omni-image-settings-toggle"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
        >
            <span className="truncate">
                Параметры изображения{summary ? ` · ${summary}` : ""}
            </span>
            <Icon
                className={`shrink-0 fill-gray-500 transition-transform ${
                    open ? "rotate-180" : ""
                }`}
                name="chevron"
            />
        </button>,
        host
    );
};

export default ImageSettingsToggle;
