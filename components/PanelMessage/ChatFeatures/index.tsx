import { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Icon from "@/components/Icon";

type Props = {
    onGenerateVideo: () => void;
};

const ChatFeatures = ({ onGenerateVideo }: Props) => {
    const [activeFeature, setActiveFeature] = useState(0);

    const features = [
        {
            name: "Chat",
            icon: "chat",
            upgraded: true,
            onClick: () => {
                console.log("Chat");
            },
        },
        {
            name: "Generate Image",
            icon: "generate-image",
            upgraded: true,
            onClick: () => {
                console.log("Generate Image");
            },
        },
        {
            name: "Generate Video",
            icon: "generate-video",
            upgraded: false,
            onClick: () => {
                onGenerateVideo();
                console.log("Generate Video");
            },
        },
    ];

    return (
        <Menu>
            <MenuButton className="group flex items-center gap-2 h-8 px-4 border border-gray-100 rounded-lg shadow-[0_0.0625rem_0.125rem_0_rgba(13,13,18,0.06)] text-body-xs font-medium outline-0 transition-colors hover:bg-gray-25 max-md:gap-1 max-md:px-2">
                <Icon
                    className="fill-gray-500"
                    name={features[activeFeature].icon}
                />
                {features[activeFeature].name}
                <Icon
                    className="fill-gray-500 transition-transform group-[[data-open]]:rotate-180"
                    name="chevron"
                />
            </MenuButton>
            <MenuItems
                className="flex [--anchor-gap:0.5rem] origin-top z-20 flex-col w-59.5 bg-gray-0 border border-black/8 rounded-lg rounded-bl-none outline-0 shadow-[0_0.0625rem_0.25rem_0_rgba(0,0,0,0.16)] transition duration-200 ease-out overflow-hidden data-closed:scale-95 data-closed:opacity-0"
                anchor="bottom start"
                transition
                modal={false}
            >
                {features.map((feature, index) => (
                    <MenuItem
                        className="group flex items-center gap-2 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-gray-25"
                        key={index}
                        onClick={() => {
                            setActiveFeature(index);
                            feature.onClick();
                        }}
                        as="button"
                    >
                        <Icon
                            className="fill-gray-500 transition-colors group-hover:fill-gray-900"
                            name={feature.icon}
                        />
                        <div className="text-body-xs font-medium">
                            {feature.name}
                        </div>
                        {!feature.upgraded && (
                            <div className="ml-auto px-2 py-1 bg-primary-0 rounded-full text-body-xs font-medium text-primary-300">
                                Upgrade Pro
                            </div>
                        )}
                    </MenuItem>
                ))}
            </MenuItems>
        </Menu>
    );
};

export default ChatFeatures;
