import Image from "@/components/Image";
import Icon from "@/components/Icon";
import File from "./File";

type Props = {
    image?: string;
    file?: boolean;
    children: React.ReactNode;
};

const Message = ({ image, file, children }: Props) => {
    const actions = [
        {
            icon: "copy",
            onClick: () => {
                console.log("Copy");
            },
        },
        {
            icon: "pencil-1",
            onClick: () => {
                console.log("Edit");
            },
        },
    ];

    return (
        <div className="">
            {image && (
                <div className="flex flex-wrap justify-end gap-2 mb-2">
                    <div className="w-50">
                        <Image
                            className="w-full opacity-100 rounded-md"
                            src={image}
                            width={200}
                            height={200}
                            alt=""
                        />
                    </div>
                </div>
            )}
            <div className="flex justify-end items-start gap-2">
                <div className="">
                    <div className="content p-3 rounded-3xl rounded-tr-none bg-gray-50 max-md:rounded-2xl max-md:rounded-tr-none">
                        {children}
                    </div>
                    {file && <File />}
                    <div className="flex justify-end gap-2 mt-2">
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
                <div className="shrink-0 size-6 rounded-full overflow-hidden border border-gray-0 shadow-[0_0.0625rem_0.125rem_0_rgba(0,0,0,0.08)]">
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
