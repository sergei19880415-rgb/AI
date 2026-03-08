import { useRef, useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useClickAway } from "react-use";
import Icon from "@/components/Icon";

type Props = {
    visible: boolean;
};

const Actions = ({ visible }: Props) => {
    const [open, setOpen] = useState(false);

    const ref = useRef(null);
    useClickAway(ref, () => {
        setOpen(false);
    });

    const actions = [
        {
            title: "Edit Image",
            icon: "edit",
            onClick: () => {
                console.log("Edit Image");
            },
        },
        {
            title: "Make Video",
            icon: "generate-video",
            onClick: () => {
                console.log("Make Video");
            },
        },
        {
            title: "Share",
            icon: "upload",
            onClick: () => {
                console.log("Share");
            },
        },
        {
            title: "Download",
            icon: "download",
            onClick: () => {
                console.log("Download");
            },
        },
    ];

    return (
        <div className="absolute top-2 right-2" ref={ref}>
            <Menu>
                <MenuButton
                    className={`group size-8 rounded-full bg-gray-0 text-0 outline-0 invisible opacity-0 transition-all duration-400 hover:border-gray-25 data-open:bg-gray-25 group-hover/item:visible group-hover/item:opacity-100 ${
                        visible ? "max-lg:visible max-lg:opacity-100" : ""
                    } ${open ? "visible opacity-100" : ""}`}
                    onClick={() => setOpen(!open)}
                >
                    <Icon className="fill-gray-900" name="dots" />
                </MenuButton>
                <MenuItems
                    className="flex [--anchor-gap:0.5rem] origin-top z-20 flex-col min-w-41 bg-gray-0 border border-black/8 rounded-lg rounded-tr-none shadow-[0_0.0625rem_0.25rem_0_rgba(0,0,0,0.16)] outline-0 transition duration-200 ease-out overflow-hidden data-closed:scale-95 data-closed:opacity-0 max-md:min-w-34"
                    anchor="bottom end"
                    transition
                    // modal={false}
                >
                    {actions.map((action, index) => (
                        <MenuItem
                            className="group flex items-center gap-2 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-gray-25"
                            key={index}
                            as="button"
                            onClick={action.onClick}
                        >
                            <Icon
                                className="fill-gray-500 transition-colors group-hover:fill-gray-900"
                                name={action.icon}
                            />
                            <div className="text-body-xs font-medium">
                                {action.title}
                            </div>
                        </MenuItem>
                    ))}
                </MenuItems>
            </Menu>
        </div>
    );
};

export default Actions;
