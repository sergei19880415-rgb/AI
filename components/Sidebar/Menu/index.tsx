import { useState } from "react";
import Modal from "@/components/Modal";
import NavLink from "./NavLink";
import Button from "./Button";
import Space from "./Space";
import ArchivedChat from "./ArchivedChat";

type Props = {
    isCollapsed: boolean;
};

const Menu = ({ isCollapsed }: Props) => {
    const [openModalSpace, setOpenModalSpace] = useState(false);
    const [openModalArchivedChat, setOpenModalArchivedChat] = useState(false);

    const items = [
        {
            title: "Chat",
            icon: "chat",
            iconActive: "chat-fill",
            href: "/",
        },
        {
            title: "Gallery Library",
            icon: "gallery",
            iconActive: "gallery-fill",
            href: "/gallery-library",
        },
        {
            title: "Space",
            icon: "folders",
            iconActive: "folders-fill",
            onClick: () => setOpenModalSpace(true),
        },
        {
            title: "Archive",
            icon: "box",
            iconActive: "box-fill",
            onClick: () => setOpenModalArchivedChat(true),
        },
        {
            title: "Settings",
            icon: "settings",
            iconActive: "settings-fill",
            href: "/settings",
        },
    ];

    return (
        <>
            <div
                className={`py-4 border-b border-gray-100 ${
                    isCollapsed ? "px-1.5" : "px-3"
                }`}
            >
                {!isCollapsed && (
                    <div className="mb-2 pl-2 text-body-xs">MAIN MENU</div>
                )}
                <div className="">
                    {items.map((item, index) => {
                        return item.href ? (
                            <NavLink
                                isCollapsed={isCollapsed}
                                item={item}
                                key={index}
                            />
                        ) : (
                            <Button
                                isCollapsed={isCollapsed}
                                item={item}
                                key={index}
                            />
                        );
                    })}
                </div>
            </div>
            <Modal
                classWrapper="relative max-w-100 px-5 py-4 bg-gray-0 rounded-xl border border-gray-50"
                classButtonClose="!top-4.5 !right-4 size-auto [&_svg]:!size-5 max-md:!size-auto"
                open={openModalSpace}
                onClose={() => setOpenModalSpace(false)}
            >
                <Space />
            </Modal>
            <Modal
                classWrapper="relative max-w-100 px-5 py-4 bg-gray-0 rounded-xl border border-gray-50"
                classButtonClose="!top-4.5 !right-4 size-auto [&_svg]:!size-5 max-md:!size-auto"
                open={openModalArchivedChat}
                onClose={() => setOpenModalArchivedChat(false)}
            >
                <ArchivedChat />
            </Modal>
        </>
    );
};

export default Menu;
