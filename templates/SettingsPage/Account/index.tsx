"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Button";
import TextInputDialog from "@/components/TextInputDialog";
import PasswordChangeDialog from "@/components/PasswordChangeDialog";
import TabContainer from "../TabContainer";
import Line from "../Line";

const UPDATE_NAME_WEBHOOK_URL = "https://tgdomen.ru/webhook/update-name";
const UPDATE_PASSWORD_WEBHOOK_URL = "https://tgdomen.ru/webhook/update-password";

const Account = () => {
    const [nameDialogOpen, setNameDialogOpen] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [firstName, setFirstName] = useState("Пользователь");
    const [userEmail, setUserEmail] = useState("");
    const [isSavingName, setIsSavingName] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");

    useEffect(() => {
        const savedFirstName = localStorage.getItem("ai_user_first_name");
        const savedFullName = localStorage.getItem("ai_user_name");
        const savedEmail = localStorage.getItem("ai_user_email") || "";

        if (savedFirstName && savedFirstName.trim()) {
            setFirstName(savedFirstName.trim());
        } else if (savedFullName && savedFullName.trim()) {
            const onlyFirstName = savedFullName.trim().split(" ")[0];
            setFirstName(onlyFirstName || "Пользователь");
        }

        setUserEmail(savedEmail.trim());
    }, []);

    const handleSaveName = async (nextName: string) => {
        const cleanName = nextName.trim();
        const cleanEmail = userEmail.trim();

        if (!cleanName || !cleanEmail || isSavingName) {
            return;
        }

        setIsSavingName(true);

        try {
            const response = await fetch(UPDATE_NAME_WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: cleanEmail,
                    firstName: cleanName,
                }),
            });

            const raw = await response.text();

            let parsed: {
                success?: boolean;
                firstName?: string;
                message?: string;
            } | null = null;

            try {
                parsed = JSON.parse(raw);
            } catch {
                alert("Сервер вернул непонятный ответ");
                return;
            }

            if (!response.ok || !parsed?.success) {
                alert(parsed?.message || "Не удалось обновить имя");
                return;
            }

            const resolvedFirstName = (parsed.firstName || cleanName).trim();

            localStorage.setItem("ai_user_first_name", resolvedFirstName);
            localStorage.setItem("ai_user_name", resolvedFirstName);

            setFirstName(resolvedFirstName);

            window.dispatchEvent(new Event("ai-user-profile-updated"));
        } catch {
            alert("Ошибка сети или CORS");
        } finally {
            setIsSavingName(false);
        }
    };

    const handleSavePassword = async (values: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }) => {
        const cleanEmail = userEmail.trim();
        const currentPassword = values.currentPassword.trim();
        const newPassword = values.newPassword.trim();
        const confirmPassword = values.confirmPassword.trim();

        if (!cleanEmail || !currentPassword || !newPassword || !confirmPassword) {
            setPasswordError("Заполни все поля");
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError("Новый пароль должен быть не короче 6 символов");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("Новые пароли не совпадают");
            return;
        }

        if (currentPassword === newPassword) {
            setPasswordError("Новый пароль должен отличаться от текущего");
            return;
        }

        setIsSavingPassword(true);
        setPasswordError("");

        try {
            const response = await fetch(UPDATE_PASSWORD_WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: cleanEmail,
                    oldPassword: currentPassword,
                    newPassword: newPassword,
                }),
            });

            const raw = await response.text();

            let parsed: {
                success?: boolean;
                message?: string;
            } | null = null;

            try {
                parsed = JSON.parse(raw);
            } catch {
                setPasswordError("Сервер вернул непонятный ответ");
                return;
            }

            if (!response.ok || !parsed?.success) {
                setPasswordError(parsed?.message || "Не удалось обновить пароль");
                return;
            }

            setPasswordDialogOpen(false);
            setPasswordError("");
            alert("Пароль обновлён");
        } catch {
            setPasswordError("Ошибка сети или CORS");
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <>
            <TabContainer title="Account">
                <Line
                    title="Display Name"
                    description={`Текущее имя: ${firstName}`}
                >
                    <Button
                        className="!text-[1rem]"
                        isSecondary
                        isSmall
                        onClick={() => setNameDialogOpen(true)}
                    >
                        {isSavingName ? "Saving..." : "Edit name"}
                    </Button>
                </Line>

                <Line
                    title="Email Address"
                    description={userEmail || "No email"}
                >
                    <Button className="!text-[1rem]" isSecondary isSmall>
                        Change email
                    </Button>
                </Line>

                <Line
                    title="Password"
                    description="Измени пароль для входа в аккаунт."
                >
                    <Button
                        className="!text-[1rem]"
                        isSecondary
                        isSmall
                        onClick={() => {
                            setPasswordError("");
                            setPasswordDialogOpen(true);
                        }}
                    >
                        {isSavingPassword ? "Saving..." : "Change password"}
                    </Button>
                </Line>

                <Line
                    title="Linked Accounts"
                    description="Connect or disconnect your external accounts (e.g. Google, GitHub)."
                >
                    <Button className="!text-[1rem]" isSecondary isSmall>
                        Manage
                    </Button>
                </Line>

                <Line
                    title="Subscription Plan"
                    description="View or upgrade your current Zyra plan to access premium features."
                >
                    <Button className="!text-[1rem]" isSecondary isSmall>
                        View Plan
                    </Button>
                </Line>

                <Line
                    title="Delete Account"
                    description="Permanently remove your Zyra account and all associated data."
                >
                    <Button
                        className="!text-[1rem] !shadow-[inset_0_0_0_0.0625rem_#D73E3D] !text-error-100 hover:!bg-error-100 hover:!text-gray-0"
                        isSecondary
                        isSmall
                    >
                        Delete Account
                    </Button>
                </Line>
            </TabContainer>

            <TextInputDialog
                open={nameDialogOpen}
                onClose={() => setNameDialogOpen(false)}
                title="Edit name"
                label="Введите новое имя"
                placeholder="Например, Серж"
                initialValue={firstName}
                confirmLabel="Save"
                onConfirm={handleSaveName}
            />

            <PasswordChangeDialog
                open={passwordDialogOpen}
                onClose={() => {
                    setPasswordDialogOpen(false);
                    setPasswordError("");
                }}
                onConfirm={handleSavePassword}
                isLoading={isSavingPassword}
                errorText={passwordError}
            />
        </>
    );
};

export default Account;
