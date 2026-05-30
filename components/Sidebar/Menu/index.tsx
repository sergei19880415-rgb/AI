"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import NavLink from "./NavLink";
import Button from "./Button";
import ArchivedChat from "./ArchivedChat";

type Props = {
    isCollapsed: boolean;
};

type MenuItem = {
    title: string;
    icon: string;
    iconActive: string;
    href?: string;
    onClick?: () => void;
    activePath?: string;
};

const Menu = ({ isCollapsed }: Props) => {
    const [openModalArchivedChat, setOpenModalArchivedChat] = useState(false);

    const items: MenuItem[] = [
        {
            title: "Галерея",
            icon: "gallery",
            iconActive: "gallery-fill",
            href: "/gallery-library",
        },
        {
            title: "Архив",
            icon: "box",
            iconActive: "box-fill",
            activePath: "/archived-chat",
            onClick: () => setOpenModalArchivedChat(true),
        },
    ];

    return (
        <>
            <div 
                className={`border-b border-gray-100 py-3 ${
                    isCollapsed ? "px-1.5" : "px-3"
                }`}
            >
                <div className="flex flex-col gap-0.5">
                    {items.map((item, index) =>
                        item.href ? (
                            <NavLink
                                isCollapsed={isCollapsed}
                                item={item as MenuItem & { href: string }}
                                key={index}
                            />
                        ) : (
                            <Button
                                isCollapsed={isCollapsed}
                                item={item}
                                key={index}
                            />
                        )
                    )}
                </div>
            </div>

            <Modal
                classWrapper="relative max-w-100 rounded-xl border border-gray-50 bg-gray-0 px-5 py-4"
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
