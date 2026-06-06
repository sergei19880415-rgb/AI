import type { ComponentType, SVGProps } from "react";

type ProviderKey = "openai" | "google" | "anthropic" | "xai" | "perplexity";

type ModelLogoSource = {
    modelId?: string;
    provider?: string;
};

type ModelLogoStackProps = {
    sources: ModelLogoSource[];
    max?: number;
};

type LogoProps = SVGProps<SVGSVGElement> & {
    title?: string;
};

const getProviderKey = ({ modelId, provider }: ModelLogoSource): ProviderKey | null => {
    const id = String(modelId || "").trim().toLowerCase();
    const prov = String(provider || "").trim().toLowerCase();
    const combined = `${prov} ${id}`;

    if (!combined.trim()) return null;
    if (combined.includes("gpt") || combined.includes("openai")) return "openai";
    if (combined.includes("gemini") || combined.includes("google")) return "google";
    if (combined.includes("claude") || combined.includes("anthropic")) return "anthropic";
    if (combined.includes("grok") || combined.includes("xai") || combined.includes("x.ai")) return "xai";
    if (combined.includes("sonar") || combined.includes("perplexity")) return "perplexity";

    return null;
};

const OpenAILogo = ({ title = "OpenAI", ...props }: LogoProps) => (
    <svg viewBox="0 0 24 24" aria-label={title} role="img" {...props}>
        <circle cx="12" cy="12" r="11" fill="#ffffff" />
        <path
            d="M12 3.25a4.1 4.1 0 0 1 3.74 2.42 4.08 4.08 0 0 1 4.42 6.11 4.08 4.08 0 0 1-3.74 6.55 4.08 4.08 0 0 1-7.48.03 4.08 4.08 0 0 1-4.42-6.11 4.08 4.08 0 0 1 3.75-6.58A4.1 4.1 0 0 1 12 3.25Zm-2.37 4.1L7.1 8.82a2.38 2.38 0 0 0-1.05 2.9l3.58-2.07V7.35Zm1.33-.77v4.14l-3.58 2.07a2.38 2.38 0 0 0 2.52 3.36v-4.14l3.58-2.07a2.38 2.38 0 0 0-2.52-3.36Zm3.4.58a2.38 2.38 0 0 0-2.3-2.18 2.38 2.38 0 0 0-2.07 1.18l3.58 2.07 2.53-1.46a2.32 2.32 0 0 0-1.74.39Zm1.2 1.04-3.58 2.07v4.14a2.38 2.38 0 0 0 2.52-3.36l3.58-2.07a2.38 2.38 0 0 0-2.52-.78Zm2.39 3.93-3.58 2.07v2.92a2.38 2.38 0 0 0 2.05-.12 2.38 2.38 0 0 0 1.53-4.87Zm-5.91 5.7v-4.14l-2.53 1.46a2.38 2.38 0 0 0 2.53 2.68Z"
            fill="#111827"
        />
    </svg>
);

const GoogleAILogo = ({ title = "Google AI", ...props }: LogoProps) => (
    <svg viewBox="0 0 24 24" aria-label={title} role="img" {...props}>
        <circle cx="12" cy="12" r="11" fill="#ffffff" />
        <path d="M12 3.5l1.55 4.95L18.5 10l-4.95 1.55L12 16.5l-1.55-4.95L5.5 10l4.95-1.55L12 3.5Z" fill="#8E75FF" />
        <path d="M17 14.25l.75 2.25 2.25.75-2.25.75L17 20.25 16.25 18 14 17.25l2.25-.75.75-2.25Z" fill="#34A853" />
        <path d="M6.75 14.75l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5Z" fill="#4285F4" />
    </svg>
);

const AnthropicLogo = ({ title = "Anthropic", ...props }: LogoProps) => (
    <svg viewBox="0 0 24 24" aria-label={title} role="img" {...props}>
        <circle cx="12" cy="12" r="11" fill="#F6F1E8" />
        <path d="M8.9 5h2.2l5.15 14h-2.1l-1.08-3.02H6.93L5.85 19h-2.1L8.9 5Zm3.52 9.16L10 7.4l-2.42 6.76h4.84ZM15.8 5h2.08L22 19h-2.06L15.8 5Z" fill="#1F1A17" />
    </svg>
);

const XAILogo = ({ title = "xAI", ...props }: LogoProps) => (
    <svg viewBox="0 0 24 24" aria-label={title} role="img" {...props}>
        <circle cx="12" cy="12" r="11" fill="#ffffff" />
        <path d="M5 5h3.05l3.9 5.12L16.08 5H19l-5.64 6.86L19.3 19h-3.08l-4.1-5.33L7.78 19H4.8l5.9-7.18L5 5Z" fill="#111827" />
    </svg>
);

const PerplexityLogo = ({ title = "Perplexity", ...props }: LogoProps) => (
    <svg viewBox="0 0 24 24" aria-label={title} role="img" {...props}>
        <circle cx="12" cy="12" r="11" fill="#ffffff" />
        <path d="M6 5.25h4.8L12 3.8l1.2 1.45H18v13.5h-4.58L12 20.2l-1.42-1.45H6V5.25Zm5 3.07H7.72v7.42H11V8.32Zm5.28 0H13v7.42h3.28V8.32Zm-4.28.8v6.25l3.08-3.12L12 9.12Zm0 5.75-3.08 2.26h6.16L12 14.87Z" fill="#15AABF" />
    </svg>
);

const LOGOS: Record<ProviderKey, ComponentType<LogoProps>> = {
    openai: OpenAILogo,
    google: GoogleAILogo,
    anthropic: AnthropicLogo,
    xai: XAILogo,
    perplexity: PerplexityLogo,
};

const LABELS: Record<ProviderKey, string> = {
    openai: "OpenAI",
    google: "Google AI",
    anthropic: "Anthropic",
    xai: "xAI",
    perplexity: "Perplexity",
};

export const getModelProviderKeys = (sources: ModelLogoSource[]) => {
    const keys: ProviderKey[] = [];

    for (const source of sources) {
        const key = getProviderKey(source);
        if (key && !keys.includes(key)) {
            keys.push(key);
        }
    }

    return keys;
};

const ModelLogoStack = ({ sources, max = 3 }: ModelLogoStackProps) => {
    const providerKeys = getModelProviderKeys(sources);

    if (providerKeys.length === 0) return null;

    const visibleKeys = providerKeys.slice(0, max);
    const extraCount = Math.max(providerKeys.length - max, 0);

    return (
        <span className="inline-flex shrink-0 items-center gap-0.5" aria-label="Модели чата">
            {visibleKeys.map((key) => {
                const Logo = LOGOS[key];

                return (
                    <Logo
                        key={key}
                        title={LABELS[key]}
                        className="size-4 rounded-full border border-gray-100 shadow-[0_0.0625rem_0.125rem_rgba(13,13,18,0.08)]"
                    />
                );
            })}
            {extraCount > 0 && (
                <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-100 px-1 text-[9px] font-semibold leading-none text-gray-500">
                    +{extraCount}
                </span>
            )}
        </span>
    );
};

export default ModelLogoStack;
