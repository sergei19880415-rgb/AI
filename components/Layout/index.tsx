"use client";

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

            <div className="relative flex h-[calc(100svh-1rem)] min-h-0 flex-col rounded-2xl border border-gray-100 bg-gray-0 max-md:h-[calc(100svh-4rem)] max-md:rounded-none max-md:border-none max-md:bg-transparent">
                <Header
                    title={title}
                    onOpenSidebar={() => setSidebarVisible(true)}
                />

                <div
                    className={`min-h-0 grow overflow-auto scrollbar-none ${
                        archived
                            ? "overflow-hidden"
                            : ""
                    } ${classWrapper || ""}`}
                >
                    {children}
                </div>

                {archived ? (
                    <div className="rounded-b-2xl bg-linear-to-b from-gray-0/0 via-gray-0 to-gray-0 px-5 pb-12 pt-10 text-center">
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
            />
        </div>
    );
};

export default Layout;