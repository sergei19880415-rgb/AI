import { useMemo } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Icon from "@/components/Icon";

type ChatFeatureMode = "chat" | "search" | "image" | "video";

type Props = {
    activeMode: ChatFeatureMode;
    onSelectChat: () => void;
    onSelectImage: () => void;
    onGenerateVideo: () => void;
    onAttachFile: () => void;
};

const ChatFeatures = ({
    activeMode,
    onSelectChat,
    onSelectImage,
    onGenerateVideo,
    onAttachFile,
}: Props) => {
    void activeMode;
    void onGenerateVideo;

    const menuItems = useMemo(
        () => [
            {
                key: "chat",
                name: "Чат",
                icon: "chat",
                onClick: onSelectChat,
            },
            {
                key: "image",
                name: "Создать изображение",
                icon: "generate-image",
                onClick: onSelectImage,
            },
            {
                key: "attach-file",
                name: "Прикрепить файл",
                icon: "attach-file",
                onClick: onAttachFile,
            },
        ],
        [onAttachFile, onSelectChat, onSelectImage]
    );

    return (
        <Menu>
            <MenuButton
                className="group flex size-10 items-center justify-center rounded-lg border border-gray-100 bg-white transition-colors hover:bg-gray-25"
                aria-label="Открыть дополнительные действия"
                title="Дополнительные действия"
            >
                <Icon
                    className="fill-gray-500 transition-colors group-hover:fill-gray-900"
                    name="plus"
                />
            </MenuButton>

            <MenuItems
                className="z-20 flex w-56 origin-bottom flex-col overflow-hidden rounded-xl border border-black/8 bg-gray-0 outline-0 shadow-[0_0.25rem_1rem_rgba(0,0,0,0.12)] transition duration-200 ease-out [--anchor-gap:0.5rem] data-closed:scale-95 data-closed:opacity-0"
                anchor="top start"
                transition
                modal={false}
            >
                {menuItems.map((feature) => (
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
    );
};

export default ChatFeatures;
