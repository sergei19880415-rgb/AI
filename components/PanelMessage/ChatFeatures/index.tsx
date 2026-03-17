import { useMemo } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Icon from "@/components/Icon";

type ChatFeatureMode = "chat" | "search" | "image" | "video";

type Props = {
    activeMode: ChatFeatureMode;
    onSelectChat: () => void;
    onSelectImage: () => void;
    onGenerateVideo: () => void;
};

const ChatFeatures = ({
    activeMode,
    onSelectChat,
    onSelectImage,
    onGenerateVideo,
}: Props) => {
    const features = useMemo(
        () => [
            {
                key: "chat" as ChatFeatureMode,
                name: "Чат",
                icon: "chat",
                onClick: onSelectChat,
            },
            {
                key: "image" as ChatFeatureMode,
                name: "Создать изображение",
                icon: "generate-image",
                onClick: onSelectImage,
            },
            {
                key: "video" as ChatFeatureMode,
                name: "Создать видео",
                icon: "generate-video",
                onClick: onGenerateVideo,
            },
        ],
        [onGenerateVideo, onSelectChat, onSelectImage]
    );

    const activeFeature =
        features.find((item) => item.key === activeMode) || features[0];

    return (
        <div className="flex h-full min-h-[108px] w-[56px] flex-col justify-between">
            <button
                type="button"
                className="group flex h-12 w-full items-center justify-center rounded-xl border border-gray-100 bg-white shadow-[0_0.0625rem_0.125rem_0_rgba(13,13,18,0.06)] transition-colors hover:bg-gray-25"
                aria-label={activeFeature.name}
            >
                <Icon className="size-5 fill-primary-300" name={activeFeature.icon} />
            </button>

            <div className="pt-1.5">
                <Menu>
                    <MenuButton className="group flex h-12 w-full items-center justify-center rounded-xl border border-gray-100 bg-white shadow-[0_0.0625rem_0.125rem_0_rgba(13,13,18,0.06)] transition-colors hover:bg-gray-25">
                        <Icon className="fill-gray-500 transition-colors group-hover:fill-gray-900" name="plus" />
                    </MenuButton>

                    <MenuItems
                        className="z-20 flex w-56 origin-bottom flex-col overflow-hidden rounded-xl border border-black/8 bg-gray-0 outline-0 shadow-[0_0.0625rem_0.25rem_0_rgba(0,0,0,0.16)] transition duration-200 ease-out [--anchor-gap:0.5rem] data-closed:scale-95 data-closed:opacity-0"
                        anchor="top start"
                        transition
                        modal={false}
                    >
                        {features.map((feature) => (
                            <MenuItem
                                className="group flex items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-gray-25"
                                key={feature.key}
                                onClick={feature.onClick}
                                as="button"
                            >
                                <Icon
                                    className="fill-gray-500 transition-colors group-hover:fill-gray-900"
                                    name={feature.icon}
                                />
                                <div className="text-body-xs font-medium text-gray-800">
                                    {feature.name}
                                </div>
                            </MenuItem>
                        ))}
                    </MenuItems>
                </Menu>
            </div>
        </div>
    );
};

export default ChatFeatures;
