"use client";

import { useState } from "react";
import Button from "@/components/Button";
import ChatVersions from "./ChatVersions";
import TextInputDialog from "@/components/TextInputDialog";

type Props = {
    title?: string;
    onRenameTitle?: (nextTitle: string) => void;
    onOpenSidebar: () => void;
};

const Header = ({ title, onRenameTitle, onOpenSidebar }: Props) => {
    const [renameOpen, setRenameOpen] = useState(false);

    return (
        <>
            <div className="relative flex items-center border-b border-gray-100 p-6 max-2xl:py-5 max-md:fixed max-md:top-0 max-md:left-0 max-md:right-0 max-md:z-10 max-md:h-16 max-md:bg-gray-0 max-md:px-4 max-md:py-0">
                <Button
                    className="mr-3 !hidden w-8 shrink-0 flex-col !gap-0.75 !px-0 [&_span]:h-[1.5px] [&_span]:w-3 [&_span]:bg-gray-800 max-2xl:!flex"
                    isSecondary
                    isXSmall
                    onClick={onOpenSidebar}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </Button>

                <ChatVersions />

                <button
                    type="button"
                    className="ml-auto max-w-[min(32rem,45vw)] truncate rounded-xl px-4 py-2 text-right text-[16px] font-semibold leading-6 text-gray-900 transition-colors hover:bg-gray-50 disabled:cursor-default disabled:hover:bg-transparent max-md:max-w-[45vw] max-md:px-2 max-md:text-[15px]"
                    onClick={() => onRenameTitle && setRenameOpen(true)}
                    title={onRenameTitle ? "Переименовать чат" : undefined}
                    disabled={!onRenameTitle}
                >
                    {title || "Новый чат"}
                </button>
            </div>

            <TextInputDialog
                open={renameOpen}
                onClose={() => setRenameOpen(false)}
                title="Переименовать чат"
                label="Новое название"
                placeholder="Введите название чата"
                initialValue={title || "Новый чат"}
                confirmLabel="Сохранить"
                onConfirm={(nextTitle) => onRenameTitle?.(nextTitle)}
            />
        </>
    );
};

export default Header;
