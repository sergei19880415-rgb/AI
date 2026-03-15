"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import NavLink from "./NavLink";
import Button from "./Button";
import Space from "./Space";
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
    const [openModalSpace, setOpenModalSpace] = useState(false);
    const [openModalArchivedChat, setOpenModalArchivedChat] = useState(false);

    useEffect(() => {
        const handleOpenProjectModal = () => {
            setOpenModalSpace(true);
        };

        window.addEventListener(
            "ai-open-project-create-modal",
            handleOpenProjectModal
        );

        return () => {
            window.removeEventListener(
                "ai-open-project-create-modal",
                handleOpenProjectModal
            );
        };
    }, []);

    const items: MenuItem[] = [
        {
            title: "Чат",
            icon: "chat",
            iconActive: "chat-fill",
            href: "/chat",
        },
        {
            title: "Галерея",
            icon: "gallery",
            iconActive: "gallery-fill",
            href: "/gallery-library",
        },
        {
            title: "Проекты",
            icon: "folders",
            iconActive: "folders-fill",
            onClick: () => setOpenModalSpace(true),
        },
        {
            title: "Архив",
            icon: "box",
            iconActive: "box-fill",
            activePath: "/archived-chat",
            onClick: () => setOpenModalArchivedChat(true),
        },
        {
            title: "Настройки",
            icon: "settings",
            iconActive: "settings-fill",
            href: "/settings",
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
                                item={item}
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
                classWrapper="relative w-full max-w-[640px] rounded-xl border border-gray-50 bg-gray-0 px-6 py-5"
                classButtonClose="!top-4.5 !right-4 size-auto [&_svg]:!size-5 max-md:!size-auto"
                open={openModalSpace}
                onClose={() => setOpenModalSpace(false)}
            >
                <Space onClose={() => setOpenModalSpace(false)} />
            </Modal>

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