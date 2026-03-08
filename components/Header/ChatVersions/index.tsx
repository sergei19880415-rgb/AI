import { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Image from "@/components/Image";
import Icon from "@/components/Icon";

const ChatVersions = ({}) => {
    const [activeVersion, setActiveVersion] = useState(0);

    const versions = [
        {
            name: "Noctis 3.0",
            description: "Great for daily use",
            upgraded: true,
        },
        {
            name: "Noctis 4.0",
            description: "Unlock premium speed & priority",
            upgraded: false,
        },
    ];

    return (
        <Menu>
            <MenuButton className="group flex items-center gap-2 shrink-0 h-8 px-4 border border-gray-100 rounded-lg shadow-[0_0.0625rem_0.125rem_0_rgba(13,13,18,0.06)] text-body-xs font-medium text-primary-300 outline-0 transition-colors hover:bg-gray-25 max-md:order-3 max-md:px-3">
                <div className="relative after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:w-4.5 after:h-0.5 after:bg-[#8A44F4]/40 after:rounded-[100%] after:blur-[0.125rem]">
                    <Image
                        className="w-5 opacity-100"
                        src="/images/logo-circle.png"
                        width={20}
                        height={20}
                        alt=""
                    />
                </div>
                {versions[activeVersion].name}
                <Icon
                    className="fill-gray-500 transition-transform group-[[data-open]]:rotate-180"
                    name="chevron"
                />
            </MenuButton>
            <MenuItems
                className="flex [--anchor-gap:0.5rem] origin-top flex-col w-83 bg-gray-0 border border-black/8 rounded-lg rounded-tl-none outline-0 shadow-[0_0.0625rem_0.25rem_0_rgba(0,0,0,0.16)] transition duration-200 ease-out overflow-hidden data-closed:scale-95 data-closed:opacity-0 max-md:z-15 max-md:!left-auto max-md:!right-4"
                anchor="bottom start"
                transition
                modal={false}
            >
                {versions.map((version, index) => (
                    <MenuItem
                        className="flex items-center gap-2 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-gray-25"
                        key={index}
                        onClick={() => setActiveVersion(index)}
                        as="button"
                    >
                        <div className="relative after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:w-4.5 after:h-0.5 after:bg-[#8A44F4]/40 after:rounded-[100%] after:blur-[0.125rem]">
                            <Image
                                className="w-5 opacity-100"
                                src="/images/logo-circle.png"
                                width={20}
                                height={20}
                                alt=""
                            />
                        </div>
                        <div className="">
                            <div className="text-body-xs font-medium text-primary-300">
                                {version.name}
                            </div>
                            <div className="text-body-xs text-gray-500">
                                {version.description}
                            </div>
                        </div>
                        {!version.upgraded && (
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

export default ChatVersions;
