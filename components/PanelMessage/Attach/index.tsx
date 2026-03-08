import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Icon from "@/components/Icon";

type Props = {
    onAttachImage: () => void;
    onAttachFile: () => void;
};

const ChatFeatures = ({ onAttachImage, onAttachFile }: Props) => {
    const items = [
        {
            name: "Attach from camera",
            icon: "camera",
            onClick: () => {
                console.log("Attach from camera");
            },
        },
        {
            name: "Attach image",
            icon: "add-picture",
            onClick: onAttachImage,
        },
        {
            name: "Attach file",
            icon: "attach-file",
            onClick: onAttachFile,
        },
    ];

    return (
        <Menu>
            <MenuButton className="group flex justify-center items-center size-8 border border-[#1B1B1B]/8 rounded-lg shadow-[0_0.0625rem_0.125rem_0_rgba(0,0,0,0.08)] outline-0 transition-colors hover:border-gray-100 data-open:bg-gray-25 data-open:border-gray-100">
                <Icon
                    className="fill-gray-500 transition-colors group-[[data-hover]]:fill-gray-900 group-[[data-open]]:fill-gray-900"
                    name="add-file"
                />
            </MenuButton>
            <MenuItems
                className="flex [--anchor-gap:0.5rem] z-20 [--anchor-offset:-1.5rem] origin-top flex-col min-w-41 bg-gray-0 border border-black/8 rounded-lg rounded-bl-none outline-0 shadow-[0_0.0625rem_0.25rem_0_rgba(0,0,0,0.16)] transition duration-200 ease-out overflow-hidden data-closed:scale-95 data-closed:opacity-0"
                anchor="bottom start"
                transition
                modal={false}
            >
                {items.map((item, index) => (
                    <MenuItem
                        className="group flex items-center gap-2 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-gray-25"
                        key={index}
                        as="button"
                        onClick={item.onClick}
                    >
                        <Icon
                            className="fill-gray-500 transition-colors group-hover:fill-gray-900"
                            name={item.icon}
                        />
                        <div className="text-body-xs font-medium">
                            {item.name}
                        </div>
                    </MenuItem>
                ))}
            </MenuItems>
        </Menu>
    );
};

export default ChatFeatures;
