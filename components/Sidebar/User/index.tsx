"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "@/components/Image";
import Icon from "@/components/Icon";

type Props = {
    isCollapsed: boolean;
};

const User = ({ isCollapsed }: Props) => {
    const router = useRouter();
    const [firstName, setFirstName] = useState("Пользователь");
    const [planName, setPlanName] = useState("");

    useEffect(() => {
        const savedFirstName = localStorage.getItem("ai_user_first_name");
        const savedFullName = localStorage.getItem("ai_user_name");
        const savedPlanType = localStorage.getItem("ai_plan_type") || "";

        if (savedFirstName && savedFirstName.trim()) {
            setFirstName(savedFirstName.trim());
        } else if (savedFullName && savedFullName.trim()) {
            const onlyFirstName = savedFullName.trim().split(" ")[0];
            setFirstName(onlyFirstName || "Пользователь");
        }

        setPlanName(savedPlanType.trim());
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("ai_user_email");
        localStorage.removeItem("ai_user_first_name");
        localStorage.removeItem("ai_user_name");
        localStorage.removeItem("ai_plan_type");
        localStorage.removeItem("ai_allowed_models");

        router.push("/auth/sign-in");
    };

    return (
        <div
            className={`border-t border-gray-100 py-4 max-md:px-5 max-md:py-0 ${
                isCollapsed ? "px-0" : "px-3"
            }`}
        >
            <button
                type="button"
                onClick={handleLogout}
                className={`group flex h-12 w-full items-center rounded-lg bg-gray-0 max-2xl:bg-gray-25 max-md:bg-transparent ${
                    isCollapsed ? "justify-center" : "px-3"
                }`}
            >
                <div className="size-6 shrink-0 overflow-hidden rounded-lg border border-gray-0 shadow-[0_0.0625rem_0.125rem_0_rgba(0,0,0,0.08)]">
                    <Image
                        className="size-full opacity-100"
                        src="/images/avatar-1.jpg"
                        width={24}
                        height={24}
                        alt=""
                    />
                </div>

                {!isCollapsed && (
                    <>
                        <div className="ml-2 mr-auto min-w-0 text-left">
                            <div className="truncate text-body-sm font-medium transition-colors group-hover:text-primary-200">
                                {firstName}
                            </div>

                            {planName && (
                                <div className="truncate text-[12px] leading-4 text-gray-400 transition-colors group-hover:text-gray-500">
                                    {planName}
                                </div>
                            )}
                        </div>

                        <div className="ml-2 text-body-xs text-gray-400 transition-colors group-hover:text-primary-200">
                            Выйти
                        </div>

                        <Icon
                            className="ml-2 shrink-0 -rotate-90"
                            name="chevron"
                        />
                    </>
                )}
            </button>
        </div>
    );
};

export default User;