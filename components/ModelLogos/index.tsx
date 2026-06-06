import Image from "@/components/Image";

type ProviderKey = "openai" | "google" | "anthropic" | "xai" | "perplexity";

type ModelLogoSource = {
    modelId?: string;
    provider?: string;
};

type ModelLogoStackProps = {
    sources: ModelLogoSource[];
    max?: number;
};

type LogoMeta = {
    src: string;
    label: string;
};

const getProviderKey = ({ modelId, provider }: ModelLogoSource): ProviderKey | null => {
    const id = String(modelId || "").trim().toLowerCase();
    const prov = String(provider || "").trim().toLowerCase();
    const combined = `${prov} ${id}`;

    if (!combined.trim()) return null;
    if (combined.includes("gemini") || combined.includes("google")) return "google";
    if (combined.includes("gpt") || combined.includes("openai")) return "openai";
    if (combined.includes("claude") || combined.includes("anthropic")) return "anthropic";
    if (combined.includes("grok") || combined.includes("xai") || combined.includes("x.ai")) return "xai";
    if (combined.includes("sonar") || combined.includes("perplexity")) return "perplexity";

    return null;
};

const LOGOS: Record<ProviderKey, LogoMeta> = {
    openai: {
        src: "/images/models/openai.svg",
        label: "OpenAI",
    },
    google: {
        src: "/images/models/gemini-color.svg",
        label: "Gemini",
    },
    anthropic: {
        src: "/images/models/claude-color.svg",
        label: "Claude",
    },
    xai: {
        src: "/images/models/grok.svg",
        label: "Grok",
    },
    perplexity: {
        src: "/images/models/perplexity.svg",
        label: "Perplexity",
    },
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
                const logo = LOGOS[key];

                return (
                    <Image
                        key={key}
                        className="size-4 rounded-full border border-gray-100 bg-white object-contain opacity-100 shadow-[0_0.0625rem_0.125rem_rgba(13,13,18,0.08)]"
                        src={logo.src}
                        width={16}
                        height={16}
                        alt={logo.label}
                    />
                );
            })}
            {extraCount > 0 && (
                <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-0 px-1 text-[9px] font-semibold leading-none text-primary-300">
                    +{extraCount}
                </span>
            )}
        </span>
    );
};

export default ModelLogoStack;
