"use client";

import NavLink from "./NavLink";

type Props = {
    isCollapsed: boolean;
};

type MenuItem = {
    title: string;
    icon: string;
    iconActive: string;
    href: string;
};

const Menu = ({ isCollapsed }: Props) => {
    const items: MenuItem[] = [
        {
            title: "Галерея",
            icon: "gallery",
            iconActive: "gallery-fill",
            href: "/gallery-library",
        },
    ];

    return (
        <div
            className={`border-b border-gray-100 py-3 ${
                isCollapsed ? "px-1.5" : "px-3"
            }`}
        >
            <div className="flex flex-col gap-0.5">
                {items.map((item) => (
                    <NavLink
                        isCollapsed={isCollapsed}
                        item={item}
                        key={item.href}
                    />
                ))}
            </div>
        </div>
    );
};

export default Menu;
