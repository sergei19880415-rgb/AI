import Image from "@/components/Image";
import Icon from "@/components/Icon";
import GenerateImage from "./GenerateImage";
import GenerateVideo from "./GenerateVideo";

type Props = {
    image?: string;
    video?: string;
    messageId?: string;
    modelId?: string;
    modelProvider?: string;
    modelLabel?: string;
    children: React.ReactNode;
};

type MarkdownInlineNode = string | { type: "strong"; text: string };

type MarkdownBlock =
    | { type: "heading"; text: string }
    | { type: "paragraph"; lines: string[] }
    | { type: "list"; items: string[] };

const markdownHeadingPattern = /^#{1,4}\s+(.+)$/;

const parseMarkdownHeading = (line: string) => {
    const match = markdownHeadingPattern.exec(line);

    return match ? match[1].trim() : null;
};

const parseInlineMarkdown = (text: string): MarkdownInlineNode[] => {
    const nodes: MarkdownInlineNode[] = [];
    const boldPattern = /\*\*([^*]+?)\*\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = boldPattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }

        nodes.push({ type: "strong", text: match[1] });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return nodes.length ? nodes : [text];
};

const renderInlineMarkdown = (text: string, keyPrefix: string) =>
    parseInlineMarkdown(text).map((node, index) => {
        if (typeof node === "string") {
            return <span key={`${keyPrefix}-text-${index}`}>{node}</span>;
        }

        return (
            <strong className="font-bold" key={`${keyPrefix}-strong-${index}`}>
                {node.text}
            </strong>
        );
    });

const parseMarkdownBlocks = (content: string): MarkdownBlock[] => {
    const blocks: MarkdownBlock[] = [];
    const lines = content.replace(/\r\n?/g, "\n").split("\n");
    let index = 0;

    while (index < lines.length) {
        const line = lines[index];
        const trimmedLine = line.trim();

        if (!trimmedLine) {
            index += 1;
            continue;
        }

        const headingText = parseMarkdownHeading(trimmedLine);

        if (headingText) {
            blocks.push({ type: "heading", text: headingText });
            index += 1;
            continue;
        }

        if (trimmedLine.startsWith("- ")) {
            const items: string[] = [];

            while (index < lines.length && lines[index].trim().startsWith("- ")) {
                items.push(lines[index].trim().slice(2).trim());
                index += 1;
            }

            blocks.push({ type: "list", items });
            continue;
        }

        const paragraphLines: string[] = [];

        while (index < lines.length) {
            const currentLine = lines[index];
            const currentTrimmedLine = currentLine.trim();

            if (
                !currentTrimmedLine ||
                parseMarkdownHeading(currentTrimmedLine) ||
                currentTrimmedLine.startsWith("- ")
            ) {
                break;
            }

            paragraphLines.push(currentTrimmedLine);
            index += 1;
        }

        blocks.push({ type: "paragraph", lines: paragraphLines });
    }

    return blocks;
};

const AssistantMarkdown = ({ content }: { content: string }) => {
    const blocks = parseMarkdownBlocks(content);

    return (
        <div className="space-y-2 leading-[1.65]">
            {blocks.map((block, blockIndex) => {
                if (block.type === "heading") {
                    return (
                        <h3
                            className="mt-3 mb-1.5 text-[15px] font-bold leading-[1.45] text-slate-800 first:mt-0"
                            key={`heading-${blockIndex}`}
                        >
                            {renderInlineMarkdown(
                                block.text,
                                `heading-${blockIndex}`
                            )}
                        </h3>
                    );
                }

                if (block.type === "list") {
                    return (
                        <ul
                            className="mb-2 list-disc space-y-1 pl-5 last:mb-0"
                            key={`list-${blockIndex}`}
                        >
                            {block.items.map((item, itemIndex) => (
                                <li key={`list-${blockIndex}-item-${itemIndex}`}>
                                    {renderInlineMarkdown(
                                        item,
                                        `list-${blockIndex}-item-${itemIndex}`
                                    )}
                                </li>
                            ))}
                        </ul>
                    );
                }

                return (
                    <p className="mb-2 last:mb-0" key={`paragraph-${blockIndex}`}>
                        {block.lines.map((line, lineIndex) => (
                            <span key={`paragraph-${blockIndex}-line-${lineIndex}`}>
                                {lineIndex > 0 && <br />}
                                {renderInlineMarkdown(
                                    line,
                                    `paragraph-${blockIndex}-line-${lineIndex}`
                                )}
                            </span>
                        ))}
                    </p>
                );
            })}
        </div>
    );
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

    const trimmedContentText = contentText.trim();

    const handleCopy = async () => {
        if (!trimmedContentText) return;

        try {
            await navigator.clipboard.writeText(trimmedContentText);
        } catch {
            // ignore
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
            onClick: handleCopy,
        },
        {
            icon: "refresh",
            onClick: handleRefresh,
        },
    ];

    const showModelLabel =
        !!modelLabel && !trimmedContentText.startsWith("Печатает...");

    const hideActions = !!image || !!video;

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

                <div className="min-w-0">
                    {children && (
                        <div className="content rounded-3xl rounded-tl-none bg-gray-50 p-3 text-[14px] text-slate-700 max-md:rounded-2xl max-md:rounded-tl-none">
                            {typeof children === "string" ? (
                                <AssistantMarkdown content={children} />
                            ) : (
                                children
                            )}
                        </div>
                    )}

                    {image && <GenerateImage image={image} />}
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
                                    className="group text-0"
                                    key={action.icon}
                                    onClick={action.onClick}
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
