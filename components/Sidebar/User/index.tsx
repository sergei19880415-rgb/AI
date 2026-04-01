"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "@/components/Image";
import Icon from "@/components/Icon";

type Props = {
    isCollapsed: boolean;
};

const User = ({ isCollapsed }: Props) => {
    const router = useRouter();
    const rootRef = useRef<HTMLDivElement | null>(null);
    const [firstName, setFirstName] = useState("Пользователь");
    const [userEmail, setUserEmail] = useState("");
    const [planName, setPlanName] = useState("");
    const [profileOpen, setProfileOpen] = useState(false);
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

    useEffect(() => {
        const savedFirstName = localStorage.getItem("ai_user_first_name");
        const savedFullName = localStorage.getItem("ai_user_name");
        const savedEmail = localStorage.getItem("ai_user_email") || "";
        const savedPlanType = localStorage.getItem("ai_plan_type") || "";

        if (savedFirstName && savedFirstName.trim()) {
            setFirstName(savedFirstName.trim());
        } else if (savedFullName && savedFullName.trim()) {
            const onlyFirstName = savedFullName.trim().split(" ")[0];
            setFirstName(onlyFirstName || "Пользователь");
        }

        setUserEmail(savedEmail.trim());
        setPlanName(savedPlanType.trim());
    }, []);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
                setLogoutConfirmOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("ai_user_email");
        localStorage.removeItem("ai_user_first_name");
        localStorage.removeItem("ai_user_name");
        localStorage.removeItem("ai_plan_type");
        localStorage.removeItem("ai_allowed_models");
        localStorage.removeItem("ai_models_catalog");
        localStorage.removeItem("ai_max_parallel_models");

        router.push("/auth/sign-in");
    };

    if (isCollapsed) {
        return (
            <div className="border-t border-gray-100 px-2 py-4">
                <div ref={rootRef} className="relative flex flex-col items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setProfileOpen((prev) => !prev);
                            setLogoutConfirmOpen(false);
                        }}
                        className="flex size-10 items-center justify-center rounded-xl bg-gray-25 transition-colors hover:bg-gray-50"
                    >
                        <div className="size-7 overflow-hidden rounded-full border border-gray-0 shadow-[0_0.0625rem_0.125rem_0_rgba(0,0,0,0.08)]">
                            <Image
                                className="size-full opacity-100"
                                src="/images/avatar-1.jpg"
                                width={28}
                                height={28}
                                alt=""
                            />
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setLogoutConfirmOpen((prev) => !prev);
                            setProfileOpen(false);
                        }}
                        className="flex size-10 items-center justify-center rounded-xl bg-gray-25 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                        <Icon name="chevron" className="-rotate-90 fill-current" />
                    </button>

                    {profileOpen && (
                        <div className="absolute bottom-[calc(100%+10px)] left-0 z-30 w-64 rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
                            <div className="rounded-xl px-3 py-2">
                                <div className="text-sm font-medium text-gray-900">
                                    {firstName}
                                </div>
                                {userEmail && (
                                    <div className="mt-0.5 truncate text-[12px] text-gray-500">
                                        {userEmail}
                                    </div>
                                )}
                                {planName && (
                                    <div className="mt-1 text-[12px] text-gray-500">
                                        Тариф: {planName}
                                    </div>
                                )}
                            </div>
                            <div className="my-1 h-px bg-gray-100" />
                            <button
                                type="button"
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => router.push("/settings")}
                            >
                                <Icon name="settings" className="fill-gray-500" />
                                <span>Настройки</span>
                            </button>
                        </div>
                    )}

                    {logoutConfirmOpen && (
                        <div className="absolute bottom-[calc(100%+10px)] left-0 z-30 w-56 rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
                            <div className="text-sm font-medium text-gray-900">
                                Выйти из аккаунта?
                            </div>
                            <div className="mt-1 text-[12px] text-gray-500">
                                Текущая сессия будет завершена.
                            </div>
                            <div className="mt-3 flex gap-2">
                                <button
                                    type="button"
                                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    onClick={() => setLogoutConfirmOpen(false)}
                                >
                                    Отмена
                                </button>
                                <button
                                    type="button"
                                    className="flex-1 rounded-xl bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
                                    onClick={handleLogout}
                                >
                                    Выйти
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div ref={rootRef} className="border-t border-gray-100 px-3 py-4">
            <div className="relative flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => {
                        setProfileOpen((prev) => !prev);
                        setLogoutConfirmOpen(false);
                    }}
                    className="group flex h-12 min-w-0 flex-1 items-center rounded-xl bg-gray-0 px-3 transition-colors hover:bg-gray-25 max-2xl:bg-gray-25"
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

                    <div className="ml-2 mr-auto min-w-0 text-left">
                        <div className="truncate text-body-sm font-medium text-gray-900 transition-colors group-hover:text-primary-200">
                            {firstName}
                        </div>
                        {planName && (
                            <div className="truncate text-[12px] leading-4 text-gray-400 transition-colors group-hover:text-gray-500">
                                Тариф: {planName}
                            </div>
                        )}
                    </div>

                    <Icon
                        className={`ml-2 shrink-0 fill-gray-400 transition-transform ${
                            profileOpen ? "rotate-180" : ""
                        }`}
                        name="chevron"
                    />
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setLogoutConfirmOpen((prev) => !prev);
                        setProfileOpen(false);
                    }}
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-[13px] font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                    Выйти
                </button>

                {profileOpen && (
                    <div className="absolute bottom-[calc(100%+10px)] left-0 z-30 w-[260px] rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
                        <div className="rounded-xl px-3 py-2">
                            <div className="text-sm font-medium text-gray-900">
                                {firstName}
                            </div>
                            {userEmail && (
                                <div className="mt-0.5 truncate text-[12px] text-gray-500">
                                    {userEmail}
                                </div>
                            )}
                            {planName && (
                                <div className="mt-1 text-[12px] text-gray-500">
                                    Тариф: {planName}
                                </div>
                            )}
                        </div>
                        <div className="my-1 h-px bg-gray-100" />
                        <button
                            type="button"
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => router.push("/settings")}
                        >
                            <Icon name="settings" className="fill-gray-500" />
                            <span>Настройки</span>
                        </button>
                    </div>
                )}

                {logoutConfirmOpen && (
                    <div className="absolute bottom-[calc(100%+10px)] right-0 z-30 w-[260px] rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
                        <div className="text-sm font-medium text-gray-900">
                            Подтвердить выход?
                        </div>
                        <div className="mt-1 text-[12px] text-gray-500">
                            Ты выйдешь из текущего аккаунта на этом устройстве.
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button
                                type="button"
                                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setLogoutConfirmOpen(false)}
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                className="flex-1 rounded-xl bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
                                onClick={handleLogout}
                            >
                                Выйти
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default User;
