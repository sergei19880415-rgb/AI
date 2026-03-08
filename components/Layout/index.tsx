import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import PanelMessage from "@/components/PanelMessage";
import Button from "@/components/Button";
import Icon from "@/components/Icon";

type Props = {
    classWrapper?: string;
    title?: string;
    archived?: boolean;
    hidePanelMessage?: boolean;
    children: React.ReactNode;
};

const Layout = ({
    classWrapper,
    title,
    archived,
    hidePanelMessage,
    children,
}: Props) => {
    const [sidebarCollapse, setSidebarCollapse] = useState(false);
    const [sidebarVisible, setSidebarVisible] = useState(false);

    return (
        <div
            className={`p-2 pl-70 max-4xl:pl-60 max-2xl:pl-2 max-md:p-0 max-md:pt-16 ${
                sidebarCollapse ? "!pl-18" : ""
            }`}
        >
            <Sidebar
                isCollapsed={sidebarCollapse}
                onToggle={() => setSidebarCollapse(!sidebarCollapse)}
                visible={sidebarVisible}
                onClose={() => setSidebarVisible(false)}
            />
            <div className="relative flex flex-col h-[calc(100svh-1rem)] bg-gray-0 rounded-2xl border border-gray-100 max-md:min-h-[calc(100svh-4rem)] max-md:h-auto max-md:bg-transparent max-md:border-none max-md:rounded-none">
                <Header
                    title={title}
                    onOpenSidebar={() => setSidebarVisible(true)}
                />
                <div
                    className={`grow scrollbar-none ${
                        archived
                            ? "overflow-hidden max-md:h-[calc(100svh-4rem)]"
                            : "overflow-auto"
                    } ${classWrapper || ""}`}
                >
                    {children}
                </div>
                {archived ? (
                    <div className="absolute bottom-0 left-0 right-0 pt-44 px-5 pb-12 rounded-b-2xl bg-linear-to-b from-gray-0/0 via-gray-0 to-gray-0 text-center max-md:fixed">
                        <div className="mb-5">
                            This chat has been archived. Please unarchive it to
                            continue.
                        </div>
                        <Button isSecondary isSmall>
                            <Icon name="box-arrow" />
                            <span>Unarchive chat</span>
                        </Button>
                    </div>
                ) : (
                    !hidePanelMessage && <PanelMessage />
                )}
            </div>
            <div
                className={`hidden fixed inset-0 z-20 bg-[#1B1B1B]/90 backdrop-blur-sm duration-300 transition-all max-2xl:block ${
                    sidebarVisible
                        ? "visible opacity-100"
                        : "invisible opacity-0"
                }`}
                onClick={() => setSidebarVisible(false)}
            ></div>
        </div>
    );
};

export default Layout;
