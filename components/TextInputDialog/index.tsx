"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";

type Props = {
    open: boolean;
    title: string;
    label?: string;
    placeholder?: string;
    initialValue?: string;
    confirmLabel?: string;
    allowEmpty?: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void;
};

const TextInputDialog = ({
    open,
    title,
    label,
    placeholder,
    initialValue,
    confirmLabel = "Сохранить",
    allowEmpty = false,
    onClose,
    onConfirm,
}: Props) => {
    const [value, setValue] = useState("");

    useEffect(() => {
        if (open) {
            setValue(initialValue || "");
        }
    }, [initialValue, open]);

    const handleConfirm = () => {
        const cleanValue = value.trim();
        if (!allowEmpty && !cleanValue) return;
        onConfirm(cleanValue);
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            classWrapper="relative w-full max-w-[30rem] rounded-[1.5rem] border border-gray-100 bg-white px-6 py-6 shadow-[0_24px_64px_rgba(17,12,46,0.16)]"
            classButtonClose="!top-4 !right-4 !size-10 bg-gray-25 hover:bg-gray-50 [&_svg]:!size-5"
        >
            <div className="pr-10">
                <div className="text-[20px] font-semibold leading-7 text-gray-900">
                    {title}
                </div>
                {label && (
                    <div className="mt-2 text-[13px] leading-5 text-gray-500">
                        {label}
                    </div>
                )}
            </div>

            <div className="mt-5">
                <input
                    type="text"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            handleConfirm();
                        }
                    }}
                    placeholder={placeholder}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-200"
                    autoFocus
                />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                    Отмена
                </button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-primary-300 px-5 text-[14px] font-medium text-white shadow-[0_10px_24px_rgba(123,58,237,0.24)] transition-colors hover:bg-primary-200 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!allowEmpty && !value.trim()}
                >
                    {confirmLabel}
                </button>
            </div>
        </Modal>
    );
};

export default TextInputDialog;
