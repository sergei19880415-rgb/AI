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

const greatestCommonDivisor = (a: number, b: number): number => {
    let left = Math.abs(a);
    let right = Math.abs(b);

    while (right) {
        const next = left % right;
        left = right;
        right = next;
    }

    return left || 1;
};

const formatSizeLabel = (value: string) => {
    const match = value.match(/(\d+)\s*[x×]\s*(\d+)/i);
    if (!match) return value || "Авто";

    const width = Number(match[1]);
    const height = Number(match[2]);
    const divisor = greatestCommonDivisor(width, height);
    const ratio = `${width / divisor}:${height / divisor}`;

    if (width === height) return `Квадрат ${ratio}`;
    return width > height ? `Альбом ${ratio}` : `Портрет ${ratio}`;
};

const formatQualityLabel = (value: string) => {
    const normalized = value.trim().toLowerCase();

    if (normalized.includes("high") || normalized.includes("hd")) {
        return "Высокое";
    }
    if (normalized.includes("medium") || normalized.includes("standard")) {
        return "Стандарт";
    }
    if (normalized.includes("low")) return "Экономно";
    if (normalized.includes("auto")) return "Авто";

    return value || "Авто";
};

const readSettingsSummary = (grid: HTMLElement) => {
    const qualityText = (grid.children[0]?.textContent || "")
        .replace("Качество", "")
        .trim();
    const sizeText = (grid.children[1]?.textContent || "")
        .replace("Размер", "")
        .trim();

    return {
        quality: formatQualityLabel(qualityText),
        format: formatSizeLabel(sizeText),
    };
};

const ImageSettingsToggle = () => {
    const [host, setHost] = useState<HTMLElement | null>(null);
    const [grid, setGrid] = useState<HTMLElement | null>(null);
    const [open, setOpen] = useState(false);
    const [summary, setSummary] = useState({ quality: "Авто", format: "Авто" });

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
                setSummary({ quality: "Авто", format: "Авто" });
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
            aria-label={`Параметры изображения: ${summary.format}, качество ${summary.quality}`}
        >
            <span className="omni-image-settings-value">
                <span className="omni-image-settings-prefix">Формат: </span>
                {summary.format}
            </span>
            <span className="omni-image-settings-divider" aria-hidden="true" />
            <span className="omni-image-settings-value">
                <span className="omni-image-settings-prefix">Качество: </span>
                {summary.quality}
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
