import Image from "@/components/Image";
import Icon from "@/components/Icon";
import GenerateImage from "./GenerateImage";
import GenerateVideo from "./GenerateVideo";

type Props = {
    image?: string;
    video?: string;
    children: React.ReactNode;
};

const Answer = ({ image, video, children }: Props) => {
    const actions = [
        {
            icon: "copy",
            onClick: () => {
                console.log("Copy");
            },
        },
        {
            icon: "like",
            onClick: () => {
                console.log("Like");
            },
        },
        {
            icon: "dislike",
            onClick: () => {
                console.log("Dislike");
            },
        },
        {
            icon: "upload",
            onClick: () => {
                console.log("Upload");
            },
        },
        {
            icon: "refresh",
            onClick: () => {
                console.log("Refresh");
            },
        },
    ];

    return (
        <div className="">
            <div className="flex items-start gap-2">
                <div className="relative flex shrink-0 after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:w-3.5 after:h-0.5 after:bg-[#8A44F4]/40 after:rounded-[100%] after:blur-[0.125rem]">
                    <Image
                        className="w-4 opacity-100"
                        src="/images/logo-circle.png"
                        width={16}
                        height={16}
                        alt=""
                    />
                </div>
                <div className="">
                    {children && (
                        <div className="content p-3 rounded-3xl rounded-tl-none bg-gray-50 max-md:rounded-2xl max-md:rounded-tl-none">
                            {children}
                        </div>
                    )}
                    {image && <GenerateImage image={image} />}
                    {video && <GenerateVideo video={video} />}
                    <div className="flex gap-2 mt-2">
                        {actions.map((action) => (
                            <button
                                className={`group text-0 ${
                                    image || video
                                        ? "[&:last-child]:hidden"
                                        : ""
                                }`}
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
            </div>
        </div>
    );
};

export default Answer;
