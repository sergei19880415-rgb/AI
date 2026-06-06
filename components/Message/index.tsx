import Image from "@/components/Image";
import Icon from "@/components/Icon";

type Props = {
    image?: string;
    file?: boolean;
    attachedFileName?: string;
    attachedFileMimeType?: string;
    children: React.ReactNode;
};

const getAttachedFileMeta = (fileName?: string, mimeType?: string) => {
    const ext = String(fileName || "")
        .trim()
        .toLowerCase()
        .split(".")
        .pop();
    const mime = String(mimeType || "").trim().toLowerCase();

    if (ext === "pdf" || mime.includes("pdf")) {
        return { icon: "box-fill", iconClassName: "fill-red-500", badge: "PDF" };
    }

    if (["doc", "docx"].includes(String(ext)) || mime.includes("word")) {
        return { icon: "copy", iconClassName: "fill-blue-500", badge: "DOC" };
    }

    if (
        ["xls", "xlsx"].includes(String(ext)) ||
        mime.includes("excel") ||
        mime.includes("spreadsheet")
    ) {
        return { icon: "toggle", iconClassName: "fill-emerald-500", badge: "XLS" };
    }

    if (
        ["png", "jpg", "jpeg", "webp"].includes(String(ext)) ||
        mime.startsWith("image/")
    ) {
        return { icon: "gallery-fill", iconClassName: "fill-violet-500", badge: "IMG" };
    }

    return { icon: "folders", iconClassName: "fill-gray-500", badge: "FILE" };
};

const Message = ({
    image,
    file,
    attachedFileName,
    attachedFileMimeType,
    children,
}: Props) => {
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
    const showAttachedFile = Boolean(attachedFileName);
    const attachedFileMeta = getAttachedFileMeta(
        attachedFileName,
        attachedFileMimeType
    );

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
                    <div className="content rounded-3xl rounded-tr-none bg-[#EAF4FF] px-3 py-2 text-[16px] leading-6 text-slate-700 max-md:rounded-2xl max-md:rounded-tr-none">
                        {children}
                    </div>

                    {showAttachedFile && (
                        <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] leading-none text-gray-600">
                            <span className="inline-flex size-4 items-center justify-center rounded bg-gray-100">
                                <Icon
                                    className={`${attachedFileMeta.iconClassName} size-3`}
                                    name={attachedFileMeta.icon}
                                />
                            </span>
                            <span className="rounded bg-gray-100 px-1 py-0.5 font-semibold">
                                {attachedFileMeta.badge}
                            </span>
                            <span className="max-w-40 truncate rounded bg-gray-100 px-1.5 py-0.5">
                                {attachedFileName}
                            </span>
                        </div>
                    )}
                    {!showAttachedFile && file && (
                        <div className="mt-2 text-[11px] text-gray-500">Файл</div>
                    )}

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
