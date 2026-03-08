import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";

type Props = {
    item: {
        title: string;
        icon: string;
        iconActive: string;
        href: string;
        onClick?: () => void;
    };
    isCollapsed: boolean;
};

const NavLink = ({ item, isCollapsed }: Props) => {
    const pathname = usePathname();
    const isActive = (href: string) => pathname === href;

    return (
        <Link
            className={`group flex items-center gap-2 h-9 rounded-lg text-body-sm transition-colors hover:text-gray-900 ${
                isCollapsed ? "justify-center px-0" : "px-3"
            } ${
                isActive(item.href)
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500"
            }`}
            href={item.href}
        >
            <Icon
                className={`transition-colors group-hover:fill-gray-900 ${
                    isActive(item.href) ? "fill-gray-900" : "fill-gray-500"
                }`}
                name={isActive(item.href) ? item.iconActive : item.icon}
            />
            {!isCollapsed && item.title}
        </Link>
    );
};

export default NavLink;
