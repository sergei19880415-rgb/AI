import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Icon from "@/components/Icon";

const Actions = ({}) => {
    const actions = [
        {
            title: "Rename",
            icon: "edit",
            onClick: () => {
                console.log("Rename");
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
            title: "Remove from Diabetes Scan App Space",
            icon: "arrow-circle",
            onClick: () => {
                console.log("Remove");
            },
        },
        {
            title: "Archive",
            icon: "box",
            onClick: () => {
                console.log("Archive");
            },
        },
        {
            title: "Delete Chat",
            icon: "trash",
            onClick: () => {
                console.log("Delete Chat");
            },
        },
    ];

    return (
        <Menu>
            <MenuButton className="group absolute top-1/2 right-3 -translate-y-1/2 size-4 text-0 outline-0">
                <Icon className="fill-gray-900" name="dots" />
            </MenuButton>
            <MenuItems
                className="flex [--anchor-gap:0.25rem] origin-top z-40 flex-col w-45 bg-gray-0 border border-black/8 rounded-lg rounded-tl-none shadow-[0_0.0625rem_0.25rem_0_rgba(0,0,0,0.16)] outline-0 transition duration-200 ease-out overflow-hidden data-closed:scale-95 data-closed:opacity-0 max-md:right-4 max-md:!left-auto"
                anchor="bottom start"
                transition
                modal={false}
            >
                {actions.map((action, index) => (
                    <MenuItem
                        className="group flex items-center gap-2 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-gray-25 last:text-error-100 last:[&_svg]:fill-error-100"
                        key={index}
                        as="button"
                        onClick={action.onClick}
                    >
                        <Icon
                            className="shrink-0 fill-gray-500 transition-colors group-hover:fill-gray-900"
                            name={action.icon}
                        />
                        <div className="truncate text-body-xs font-medium">
                            {action.title}
                        </div>
                    </MenuItem>
                ))}
            </MenuItems>
        </Menu>
    );
};

export default Actions;
