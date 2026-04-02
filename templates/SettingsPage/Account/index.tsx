"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Button";
import TextInputDialog from "@/components/TextInputDialog";
import Modal from "@/components/Modal";
import TabContainer from "../TabContainer";
import Line from "../Line";

const UPDATE_NAME_WEBHOOK_URL = "https://tgdomen.ru/webhook/update-name";
const UPDATE_PASSWORD_WEBHOOK_URL = "https://tgdomen.ru/webhook/update-password";

type Props = {
    onOpenPricing: () => void;
};

const Account = ({ onOpenPricing }: Props) => {
    const [nameDialogOpen, setNameDialogOpen] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
    const [firstName, setFirstName] = useState("Пользователь");
    const [userEmail, setUserEmail] = useState("");
    const [isSavingName, setIsSavingName] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

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

    const resetPasswordDialog = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError("");
        setPasswordDialogOpen(false);
    };

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

    const handleSavePassword = async () => {
        const cleanEmail = userEmail.trim();
        const cleanCurrentPassword = currentPassword.trim();
        const cleanNewPassword = newPassword.trim();
        const cleanConfirmPassword = confirmPassword.trim();

        if (
            !cleanEmail ||
            !cleanCurrentPassword ||
            !cleanNewPassword ||
            !cleanConfirmPassword
        ) {
            setPasswordError("Заполни все поля");
            return;
        }

        if (cleanNewPassword.length < 6) {
            setPasswordError("Новый пароль должен быть не короче 6 символов");
            return;
        }

        if (cleanNewPassword !== cleanConfirmPassword) {
            setPasswordError("Новые пароли не совпадают");
            return;
        }

        if (cleanCurrentPassword === cleanNewPassword) {
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
                    oldPassword: cleanCurrentPassword,
                    newPassword: cleanNewPassword,
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

            resetPasswordDialog();
            setPasswordSuccess("Пароль успешно обновлён");
        } catch {
            setPasswordError("Ошибка сети или CORS");
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <>
            <TabContainer title="Аккаунт">
                {passwordSuccess && (
                    <div className="mb-1 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-[14px] text-green-700">
                        {passwordSuccess}
                    </div>
                )}

                <Line title="Имя" description={`Текущее имя: ${firstName}`}>
                    <Button
                        className="!text-[1rem]"
                        isSecondary
                        isSmall
                        onClick={() => setNameDialogOpen(true)}
                    >
                        {isSavingName ? "Сохранение..." : "Изменить имя"}
                    </Button>
                </Line>

                <Line title="Почта" description={userEmail || "Не указана"} />

                <Line title="Пароль" description="Измени пароль для входа в аккаунт.">
                    <Button
                        className="!text-[1rem]"
                        isSecondary
                        isSmall
                        onClick={() => {
                            setPasswordSuccess("");
                            setPasswordError("");
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                            setPasswordDialogOpen(true);
                        }}
                    >
                        {isSavingPassword ? "Сохранение..." : "Изменить пароль"}
                    </Button>
                </Line>

                <Line
                    title="Тариф"
                    description="Посмотрите возможности текущего тарифа или выберите более подходящий."
                >
                    <Button
                        className="!text-[1rem]"
                        isSecondary
                        isSmall
                        onClick={onOpenPricing}
                    >
                        Открыть тарифы
                    </Button>
                </Line>

                <Line
                    title="Деактивировать аккаунт"
                    description="Временно ограничить доступ к аккаунту. На текущем этапе это интерфейс подтверждения без отправки на сервер."
                >
                    <Button
                        className="!text-[1rem] !shadow-[inset_0_0_0_0.0625rem_#D73E3D] !text-error-100 hover:!bg-error-100 hover:!text-gray-0"
                        isSecondary
                        isSmall
                        onClick={() => setDeactivateDialogOpen(true)}
                    >
                        Деактивировать аккаунт
                    </Button>
                </Line>
            </TabContainer>

            <TextInputDialog
                open={nameDialogOpen}
                onClose={() => setNameDialogOpen(false)}
                title="Изменить имя"
                label="Введите новое имя"
                placeholder="Например, Серж"
                initialValue={firstName}
                confirmLabel="Сохранить"
                onConfirm={handleSaveName}
            />

            <Modal
                open={passwordDialogOpen}
                onClose={resetPasswordDialog}
                classWrapper="relative w-full max-w-[30rem] rounded-[1.5rem] border border-gray-100 bg-white px-6 py-6 shadow-[0_24px_64px_rgba(17,12,46,0.16)]"
                classButtonClose="!top-4 !right-4 !size-10 bg-gray-25 hover:bg-gray-50 [&_svg]:!size-5"
            >
                <div className="pr-10">
                    <div className="text-[20px] font-semibold leading-7 text-gray-900">
                        Смена пароля
                    </div>
                    <div className="mt-2 text-[13px] leading-5 text-gray-500">
                        Введи текущий пароль и два раза новый пароль.
                    </div>
                </div>

                <div className="mt-5 space-y-3">
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        placeholder="Текущий пароль"
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-200"
                        autoFocus
                    />

                    <input
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="Новый пароль"
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-200"
                    />

                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                void handleSavePassword();
                            }
                        }}
                        placeholder="Повтори новый пароль"
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-200"
                    />
                </div>

                {passwordError && (
                    <div className="mt-3 text-[13px] leading-5 text-red-600">
                        {passwordError}
                    </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={resetPasswordDialog}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        Отмена
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleSavePassword()}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-primary-300 px-5 text-[14px] font-medium text-white shadow-[0_10px_24px_rgba(123,58,237,0.24)] transition-colors hover:bg-primary-200 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={
                            isSavingPassword ||
                            !currentPassword.trim() ||
                            !newPassword.trim() ||
                            !confirmPassword.trim()
                        }
                    >
                        {isSavingPassword ? "Сохранение..." : "Сохранить"}
                    </button>
                </div>
            </Modal>

            <Modal
                open={deactivateDialogOpen}
                onClose={() => setDeactivateDialogOpen(false)}
                classWrapper="relative w-full max-w-[30rem] rounded-[1.5rem] border border-gray-100 bg-white px-6 py-6 shadow-[0_24px_64px_rgba(17,12,46,0.16)]"
                classButtonClose="!top-4 !right-4 !size-10 bg-gray-25 hover:bg-gray-50 [&_svg]:!size-5"
            >
                <div className="pr-10">
                    <div className="text-[20px] font-semibold leading-7 text-gray-900">
                        Деактивация аккаунта
                    </div>
                    <div className="mt-2 text-[13px] leading-5 text-gray-500">
                        Вы уверены, что хотите деактивировать аккаунт? Сейчас это
                        только UI-подтверждение: действие не отправляется на
                        сервер.
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => setDeactivateDialogOpen(false)}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        Отмена
                    </button>
                    <button
                        type="button"
                        onClick={() => setDeactivateDialogOpen(false)}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-error-100 px-5 text-[14px] font-medium text-white transition-colors hover:opacity-90"
                    >
                        Подтвердить
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default Account;
