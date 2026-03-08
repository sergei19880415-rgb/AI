import Link from "next/link";
import Image from "@/components/Image";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import useEventsStore from "@/store/useEventsStore";
import Menu from "./Menu";
import Space from "./Space";
import RecentChats from "./RecentChats";
import Upgrade from "./Upgrade";
import User from "./User";

type Props = {
    visible: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    onToggle: () => void;
};

const Sidebar = ({ visible, onClose, isCollapsed, onToggle }: Props) => {
    const { newChat } = useEventsStore();

    return (
        <div
            className={`fixed top-0 left-0 bottom-0 flex flex-col max-2xl:z-30 max-2xl:transition-transform max-2xl:bg-gray-0 max-2xl:duration-300 ${
                isCollapsed
                    ? "w-18 px-3"
                    : "w-70 max-4xl:w-60 max-2xl:w-70 max-md:w-full"
            } ${
                visible ? "max-2xl:translate-x-0" : "max-2xl:-translate-x-full"
            }`}
        >
            <div
                className={`flex items-center gap-3 px-3 py-4 border-b border-gray-100 ${
                    isCollapsed ? "flex-col" : "flex-row justify-between"
                }`}
            >
                <Link className="flex items-center gap-2" href="/">
                    <Image
                        className="w-6 opacity-100"
                        src="/images/logo.svg"
                        width={24}
                        height={24}
                        alt="Logo"
                    />
                    {!isCollapsed && <span className="font-medium">Zyra</span>}
                </Link>
                <button
                    className="group flex max-2xl:hidden"
                    onClick={onToggle}
                >
                    <Icon
                        className="fill-gray-500 transition-colors group-hover:fill-gray-900"
                        name="toggle"
                    />
                </button>
                <button className="hidden max-2xl:flex" onClick={onClose}>
                    <Icon
                        className="!size-6 fill-gray-500 transition-colors group-hover:fill-gray-900"
                        name="close"
                    />
                </button>
            </div>
            <div className="grow overflow-y-auto scrollbar-none">
                <div
                    className={`py-3 border-b border-gray-100 ${
                        isCollapsed ? "px-0" : "px-3"
                    }`}
                >
                    <Button
                        className={`w-full !gap-0 ${
                            isCollapsed ? " !px-0" : ""
                        }`}
                        icon="plus"
                        isPrimary
                        isXSmall
                        onClick={() => {
                            newChat();
                            onClose();
                        }}
                        as="link"
                        href="/"
                    >
                        {!isCollapsed && <span className="ml-2">New Chat</span>}
                    </Button>
                </div>
                <Menu isCollapsed={isCollapsed} />
                {!isCollapsed && (
                    <>
                        <Space />
                        <RecentChats />
                    </>
                )}
            </div>
            <Upgrade isCollapsed={isCollapsed} />
            <User isCollapsed={isCollapsed} />
        </div>
    );
};

export default Sidebar;
