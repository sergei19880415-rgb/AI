export const getModelLogoSrc = (
    modelId?: string,
    provider?: string
): string => {
    const id = String(modelId || "").trim().toLowerCase();
    const prov = String(provider || "").trim().toLowerCase();

    if (
        prov.includes("openai") ||
        id.includes("gpt") ||
        id.includes("o1") ||
        id.includes("o3") ||
        id.includes("o4")
    ) {
        return "/images/models/openai.svg";
    }

    if (prov.includes("anthropic") || id.includes("claude")) {
        return "/images/models/claude-color.svg";
    }

    if (prov.includes("google") || id.includes("gemini")) {
        return "/images/models/gemini-color.svg";
    }

    if (prov.includes("xai") || prov.includes("x.ai") || id.includes("grok")) {
        return "/images/models/grok.svg";
    }

    if (prov.includes("perplexity") || id.includes("perplexity")) {
        return "/images/models/perplexity.svg";
    }

    return "/images/logo-circle.png";
};
