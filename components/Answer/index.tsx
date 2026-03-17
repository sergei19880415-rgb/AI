import Image from "@/components/Image";
import Icon from "@/components/Icon";
import GenerateImage from "./GenerateImage";
import GenerateVideo from "./GenerateVideo";

type Props = {
    image?: string;
    video?: string;
    modelLabel?: string;
    children: React.ReactNode;
};

const getModelLogoSrc = (modelLabel?: string) => {
    const label = String(modelLabel || "").trim().toLowerCase();

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

const Answer = ({ image, video, modelLabel, children }: Props) => {
    const actions = [
        {
            icon: "copy",
            onClick: () => {
                console.log("Copy");
            },
        },
        {
            icon: "refresh",
            onClick: () => {
                console.log("Refresh");
            },
        },
    ];

    const contentText =
        typeof children === "string"
            ? children
            : Array.isArray(children)
              ? children.join(" ")
              : "";

    const trimmedContentText = contentText.trim();

    const isHtmlImageAnswer =
        typeof children === "string" &&
        /^<img[\s\S]*?>$/i.test(trimmedContentText);

    const showModelLabel =
        !!modelLabel && !trimmedContentText.startsWith("Печатает...");

    const hideActions = !!image || !!video || isHtmlImageAnswer;

    return (
        <div>
            <div className="flex items-start gap-2">
                <div className="relative flex shrink-0 after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:w-3.5 after:h-0.5 after:bg-[#8A44F4]/40 after:rounded-[100%] after:blur-[0.125rem]">
                    <Image
                        className="w-4 opacity-100"
                        src={getModelLogoSrc(modelLabel)}
                        width={16}
                        height={16}
                        alt={modelLabel || "Model logo"}
                    />
                </div>

                <div className="min-w-0">
                    {children && (
                        <div className="content rounded-3xl rounded-tl-none bg-gray-50 p-3 text-[13px] leading-[19px] text-slate-700 max-md:rounded-2xl max-md:rounded-tl-none">
                            {isHtmlImageAnswer ? (
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: trimmedContentText,
                                    }}
                                />
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
