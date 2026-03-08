"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Layout from "@/components/Layout";
import General from "./General";
import Notifications from "./Notifications";
import Personalization from "./Personalization";
import Pricing from "./Pricing";
import Security from "./Security";
import Account from "./Account";

const SettingsPage = () => {
    const searchParams = useSearchParams();
    const initialActiveId = (() => {
        const tab = searchParams.get("tab");
        if (tab === "pricing") return 3;
        return 0;
    })();
    const [activeId, setActiveId] = useState(initialActiveId);

    const items = [
        {
            id: 0,
            title: "General",
        },
        {
            id: 1,
            title: "Notifications",
        },
        {
            id: 2,
            title: "Personalization",
        },
        {
            id: 3,
            title: "Pricing",
        },
        {
            id: 4,
            title: "Security",
        },
        {
            id: 5,
            title: "Account",
        },
    ];

    return (
        <Layout
            classWrapper="wrapper py-10 max-md:py-8"
            title="Settings"
            hidePanelMessage
        >
            <div className="max-w-258 mx-auto">
                <div className="mb-12 text-center max-md:mb-0">
                    <div className="mb-3 text-h4">Chat Experience Settings</div>
                    <div className="mb-6 text-gray-500 max-md:mb-0">
                        Personalize your chat, voice, and visuals for the best
                        AI experience.
                    </div>
                    <div className="max-md:-mx-4 max-md:p-4 max-md:overflow-x-auto max-md:scrollbar-none">
                        <div className="inline-flex bg-gray-25 rounded-lg">
                            {items.map((item) => (
                                <button
                                    className={`h-9 px-4 rounded-lg text-body-sm font-medium transition-all ${
                                        activeId === item.id
                                            ? "bg-gray-0 shadow-[0_0.0625rem_0.1875rem_0_rgba(0,0,0,0.07)] !text-gray-800"
                                            : "text-gray-500"
                                    }`}
                                    key={item.id}
                                    onClick={() => setActiveId(item.id)}
                                >
                                    {item.title}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                {activeId === 0 && <General />}
                {activeId === 1 && <Notifications />}
                {activeId === 2 && <Personalization />}
                {activeId === 3 && <Pricing />}
                {activeId === 4 && <Security />}
                {activeId === 5 && <Account />}
            </div>
        </Layout>
    );
};

export default SettingsPage;
