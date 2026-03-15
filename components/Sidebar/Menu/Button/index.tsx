import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";

type Props = {
    item: {
        title: string;
        icon: string;
        iconActive: string;
        href?: string;
        onClick?: () => void;
        activePath?: string;
    };
    isCollapsed: boolean;
};

const Button = ({ item, isCollapsed }: Props) => {
    const pathname = usePathname();
    const isActive = item.activePath ? pathname === item.activePath : false;

    return (
        <button
            className={`group flex w-full items-center gap-2 rounded-lg text-body-sm transition-colors hover:text-gray-900 ${
                isCollapsed ? "h-9 justify-center px-0" : "h-9 px-3"
            } ${isActive ? "bg-gray-100 text-gray-900" : "text-gray-500"}`}
            onClick={item.onClick}
        >
            <Icon
                className={`transition-colors group-hover:fill-gray-900 ${
                    isActive ? "fill-gray-900" : "fill-gray-500"
                }`}
                name={isActive ? item.iconActive : item.icon}
            />
            {!isCollapsed && item.title}
        </button>
    );
};

export default Button;