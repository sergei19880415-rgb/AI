import Image from "@/components/Image";
import Icon from "@/components/Icon";
import GenerateImage from "./GenerateImage";
import GenerateVideo from "./GenerateVideo";
import MarkdownContent from "./MarkdownContent";

type Props = {
    image?: string;
    video?: string;
    messageId?: string;
    modelId?: string;
    modelProvider?: string;
    modelLabel?: string;
    children: React.ReactNode;
};

type ExtractedGeneratedImage = {
    image: string;
    remainingContent: string;
};

const generatedImageHtmlPattern =
    /<img\b[^>]*\bsrc\s*=\s*(["'])(data:image\/(?:png|jpe?g|webp);base64,[^"']+)\1[^>]*>/i;
const directGeneratedImagePattern =
    /^(data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=\s]+)$/i;

const normalizeDataImageUrl = (value: string) => {
    const commaIndex = value.indexOf(",");
    if (commaIndex === -1) return value.trim();

    const header = value.slice(0, commaIndex + 1);
    const payload = value.slice(commaIndex + 1).replace(/\s+/g, "");
    return `${header}${payload}`;
};

const extractGeneratedImage = (content: string): ExtractedGeneratedImage | null => {
    const htmlMatch = generatedImageHtmlPattern.exec(content);

    if (htmlMatch?.[2]) {
        return {
            image: normalizeDataImageUrl(htmlMatch[2]),
            remainingContent: content.replace(htmlMatch[0], "").trim(),
        };
    }

    const directMatch = directGeneratedImagePattern.exec(content.trim());

    if (directMatch?.[1]) {
        return {
            image: normalizeDataImageUrl(directMatch[1]),
            remainingContent: "",
        };
    }

    return null;
};

const getModelLogoSrc = (
    modelLabel?: string,
    modelId?: string,
    modelProvider?: string
) => {
    const label = String(modelLabel || "").trim().toLowerCase();
    const id = String(modelId || "").trim().toLowerCase();
    const provider = String(modelProvider || "").trim().toLowerCase();

    if (
        provider.includes("openai") ||
        id.includes("gpt") ||
        id.includes("o1") ||
        id.includes("o3") ||
        id.includes("o4")
    ) {
        return "/images/models/openai.svg";
    }

    if (provider.includes("anthropic") || id.includes("claude")) {
        return "/images/models/claude-color.svg";
    }

    if (provider.includes("google") || id.includes("gemini")) {
        return "/images/models/gemini-color.svg";
    }

    if (provider.includes("xai") || provider.includes("x.ai") || id.includes("grok")) {
        return "/images/models/grok.svg";
    }

    if (provider.includes("perplexity") || id.includes("perplexity")) {
        return "/images/models/perplexity.svg";
    }

    if (label.includes("gpt") || label.includes("openai")) {
        return "/images/models/openai.svg";
    }

    if (label.includes("claude") || label.includes("anthropic")) {
        return "/images/models/claude-color.svg";
    }

    if (label.includes("gemini") || label.includes("google")) {
        return "/images/models/gemini-color.svg";
    }

    if (label.includes("grok") || label.includes("xai") || label.includes("x.ai")) {
        return "/images/models/grok.svg";
    }

    if (label.includes("sonar") || label.includes("perplexity")) {
        return "/images/models/perplexity.svg";
    }

    return "/images/models/openai.svg";
};

const Answer = ({
    image,
    video,
    messageId,
    modelId,
    modelProvider,
    modelLabel,
    children,
}: Props) => {
    const contentText =
        typeof children === "string"
            ? children
            : Array.isArray(children)
              ? children.join(" ")
              : "";

    const extractedGeneratedImage = extractGeneratedImage(contentText);
    const renderedImage = image || extractedGeneratedImage?.image;
    const renderedContentText = extractedGeneratedImage
        ? extractedGeneratedImage.remainingContent
        : contentText;
    const trimmedContentText = renderedContentText.trim();

    const handleCopy = async () => {
        if (!trimmedContentText) return;

        try {
            await navigator.clipboard.writeText(trimmedContentText);
        } catch {
            // Clipboard can be unavailable in restricted browser contexts.
        }
    };

    const handleRefresh = () => {
        if (!messageId) return;

        window.dispatchEvent(
            new CustomEvent("ai-answer-refresh-request", {
                detail: {
                    assistantMessageId: messageId,
                    modelId: modelId || "",
                },
            })
        );
    };

    const actions = [
        {
            icon: "copy",
            title: "Копировать",
            onClick: handleCopy,
        },
        {
            icon: "refresh",
            title: "Повторить",
            onClick: handleRefresh,
        },
    ];

    const showModelLabel =
        !!modelLabel && !trimmedContentText.startsWith("Печатает...");
    const hideActions = !!renderedImage || !!video || !trimmedContentText;

    return (
        <div>
            <div className="flex items-start gap-2">
                <div className="relative flex shrink-0 after:absolute after:top-full after:left-1/2 after:h-0.5 after:w-3.5 after:-translate-x-1/2 after:rounded-[100%] after:bg-[#8A44F4]/40 after:blur-[0.125rem]">
                    <Image
                        className="w-4 opacity-100"
                        src={getModelLogoSrc(modelLabel, modelId, modelProvider)}
                        width={16}
                        height={16}
                        alt={modelLabel || "Model logo"}
                    />
                </div>

                <div className="min-w-0 max-w-full flex-1">
                    {trimmedContentText && (
                        <div className="content min-w-0 rounded-3xl rounded-tl-none bg-gray-50 p-3 text-slate-700 max-md:rounded-2xl max-md:rounded-tl-none">
                            <MarkdownContent content={trimmedContentText} />
                        </div>
                    )}

                    {renderedImage && <GenerateImage image={renderedImage} />}
                    {video && <GenerateVideo video={video} />}

                    {showModelLabel && (
                        <div className="mt-1 pr-1 text-right text-[12px] italic leading-4 text-gray-400">
                            {modelLabel}
                        </div>
                    )}

                    {!hideActions && (
                        <div className="mt-2 flex gap-2">
                            {actions.map((action) => (
                                <button
                                    type="button"
                                    className="group flex size-7 items-center justify-center rounded-md transition hover:bg-gray-100"
                                    key={action.icon}
                                    onClick={action.onClick}
                                    title={action.title}
                                    aria-label={action.title}
                                >
                                    <Icon
                                        className="fill-gray-500 transition-colors group-hover:fill-gray-900"
                                        name={action.icon}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Answer;
