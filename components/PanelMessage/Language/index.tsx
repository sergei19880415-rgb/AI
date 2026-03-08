import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Icon from "@/components/Icon";
import Image from "@/components/Image";

const Language = ({}) => {
    const items = [
        {
            title: "English",
            flag: "/images/flags/us.png",
        },
        {
            title: "Spanish",
            flag: "/images/flags/es.png",
        },
        {
            title: "German",
            flag: "/images/flags/de.png",
        },
    ];

    return (
        <Menu>
            <MenuButton className="group flex justify-center items-center size-8 border border-[#1B1B1B]/8 rounded-lg shadow-[0_0.0625rem_0.125rem_0_rgba(0,0,0,0.08)] outline-0 transition-colors hover:border-gray-100 data-open:bg-gray-25 data-open:border-gray-100 max-md:hidden">
                <Icon
                    className="fill-gray-500 transition-colors group-[[data-hover]]:fill-gray-900 group-[[data-open]]:fill-gray-900"
                    name="earth"
                />
            </MenuButton>
            <MenuItems
                className="flex [--anchor-gap:0.5rem] [--anchor-offset:-1.5rem] origin-top z-20 flex-col min-w-41 bg-gray-0 border border-black/8 rounded-lg rounded-bl-none outline-0 shadow-[0_0.0625rem_0.25rem_0_rgba(0,0,0,0.16)] transition duration-200 ease-out overflow-hidden data-closed:scale-95 data-closed:opacity-0"
                anchor="bottom start"
                transition
                modal={false}
            >
                {items.map((item, index) => (
                    <MenuItem
                        className="group flex items-center gap-2 p-3 text-left cursor-pointer transition-colors hover:bg-gray-25"
                        key={index}
                        as="button"
                    >
                        <Image
                            className="size-4 opacity-100 rounded-full"
                            src={item.flag}
                            width={16}
                            height={16}
                            alt={item.title}
                        />
                        <div className="text-body-xs font-medium">
                            {item.title}
                        </div>
                    </MenuItem>
                ))}
            </MenuItems>
        </Menu>
    );
};

export default Language;
