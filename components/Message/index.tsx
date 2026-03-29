import Image from "@/components/Image";
import Icon from "@/components/Icon";
import File from "./File";

type Props = {
    image?: string;
    file?: boolean;
    children: React.ReactNode;
};

const Message = ({ image, file, children }: Props) => {
    const contentText =
        typeof children === "string"
            ? children
            : Array.isArray(children)
              ? children.join(" ")
              : "";

    const handleCopy = async () => {
        if (!contentText.trim()) return;

        try {
            await navigator.clipboard.writeText(contentText.trim());
        } catch {
            // ignore
        }
    };

    const handleEdit = () => {
        if (!contentText.trim()) return;

        window.dispatchEvent(
            new CustomEvent("ai-message-edit-request", {
                detail: { content: contentText.trim() },
            })
        );
    };

    const actions = [
        {
            icon: "copy",
            onClick: handleCopy,
        },
        {
            icon: "pencil-1",
            onClick: handleEdit,
        },
    ];

    return (
        <div>
            {image && (
                <div className="mb-2 flex flex-wrap justify-end gap-2">
                    <div className="w-50">
                        <Image
                            className="w-full rounded-md opacity-100"
                            src={image}
                            width={200}
                            height={200}
                            alt=""
                        />
                    </div>
                </div>
            )}

            <div className="flex items-start justify-end gap-2">
                <div>
                    <div className="content rounded-3xl rounded-tr-none bg-[#EAF4FF] px-3 py-2 text-[13px] leading-[19px] text-slate-700 max-md:rounded-2xl max-md:rounded-tr-none">
                        {children}
                    </div>

                    {file && <File />}

                    <div className="mt-1.5 flex justify-end gap-2">
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
                </div>

                <div className="size-6 shrink-0 overflow-hidden rounded-full border border-gray-0 shadow-[0_0.0625rem_0.125rem_0_rgba(0,0,0,0.08)]">
                    <Image
                        className="size-full opacity-100"
                        src="/images/avatar-1.jpg"
                        width={24}
                        height={24}
                        alt=""
                    />
                </div>
            </div>
        </div>
    );
};

export default Message;
