import { useState } from "react";
import Image from "@/components/Image";
import Modal from "@/components/Modal";
import Icon from "@/components/Icon";

type Props = {
    video: string;
};

const GenerateVideo = ({ video }: Props) => {
    const [open, setOpen] = useState(false);

    const actions = [
        {
            title: "Recreate Video",
            icon: "refresh",
            isPro: false,
            onClick: () => {
                console.log("Recreate Video");
            },
        },
        {
            title: "Extend Video",
            icon: "generate-video",
            isPro: false,
            onClick: () => {
                console.log("Extend Video");
            },
        },
        {
            title: "Download",
            icon: "download",
            isPro: false,
            onClick: () => {
                console.log("Download");
            },
        },
        {
            title: "Share",
            icon: "upload",
            isPro: false,
            onClick: () => {
                console.log("Share");
            },
        },
    ];

    return (
        <>
            <div
                className="group relative w-150 not-first:mt-2 cursor-pointer max-md:w-full"
                onClick={() => setOpen(true)}
            >
                <Image
                    className="w-full rounded-2xl rounded-tl-none"
                    src="/images/preview-video.png"
                    width={600}
                    height={400}
                    alt=""
                />
                <Image
                    className="absolute top-1/2 left-1/2 w-8 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 group-hover:scale-120"
                    src="/images/play.png"
                    width={32}
                    height={32}
                    alt=""
                />
                <div className="absolute right-3 bottom-3 z-2 px-2 py-1 rounded-full bg-primary-0 text-body-xs text-primary-300 transition-colors hover:bg-gray-0">
                    View Video
                </div>
            </div>
            <Modal
                classWrapper="max-w-150"
                open={open}
                onClose={() => setOpen(false)}
            >
                <div className="mb-20 text-center max-2xl:mb-10 max-md:mb-6">
                    <video
                        className="w-full rounded-[1.25rem] max-md:rounded-lg"
                        src={video}
                        controls
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                </div>
                <div className="p-6 bg-gray-0 rounded-xl max-md:p-4">
                    <div className="flex items-center gap-2 text-body-xs font-medium">
                        <Icon className="fill-primary-200" name="chat-ai" />
                        Prompt
                    </div>
                    <div className="mt-3 max-md:text-body-sm">
                        can you generate a video of a five friends gathered
                        around a table in a stylish restaurant, enjoying food
                        and drinks together ?
                    </div>
                </div>
                <div className="flex justify-center gap-5 mt-10 max-md:mt-6">
                    {actions.map((action, index) => (
                        <button
                            className="group min-w-27.5 max-md:flex-1 max-md:min-w-auto"
                            key={index}
                            onClick={action.onClick}
                        >
                            <div
                                className="relative flex justify-center items-center size-16 mx-auto bg-gray-0 rounded-full text-0 transition-colors group-hover:bg-gray-25"
                                key={index}
                                onClick={action.onClick}
                            >
                                <Icon
                                    className="!size-7 fill-gray-900 transition-colors group-hover:fill-primary-200"
                                    name={action.icon}
                                />
                                {action.isPro && (
                                    <div className="absolute top-0 -right-5.5 px-1.75 py-0.75 bg-primary-0 rounded-full border border-primary-300 text-body-xs text-primary-300 font-medium">
                                        Pro
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 text-center text-gray-0 max-md:-mx-1.5 max-md:text-body-xs">
                                {action.title}
                            </div>
                        </button>
                    ))}
                </div>
            </Modal>
        </>
    );
};

export default GenerateVideo;
