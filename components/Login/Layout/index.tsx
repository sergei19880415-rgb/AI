import { useState } from "react";
import Link from "next/link";
import Select from "@/components/Select";
import Button from "@/components/Button";
import Icon from "@/components/Icon";
import { SelectOption } from "@/types/select";

type Props = {
    children: React.ReactNode;
};

const themeOptions = [
    { id: 0, name: "EN", flag: "/images/flags/us.png" },
    { id: 1, name: "ES", flag: "/images/flags/es.png" },
    { id: 2, name: "DE", flag: "/images/flags/de.png" },
];

const documents = [
    {
        id: 0,
        name: "Пользовательское соглашение",
        link: "/",
    },
    {
        id: 1,
        name: "Политика конфиденциальности",
        link: "/",
    },
];

const Layout = ({ children }: Props) => {
    const [theme, setTheme] = useState<SelectOption | null>(themeOptions[0]);

    return (
        <div className="flex min-h-[100svh] flex-col bg-gray-25">
            <div className="flex justify-between items-center px-10 py-5 max-xl:p-4">
                <Select
                    classButton="h-11 bg-gray-0"
                    value={theme}
                    onChange={setTheme}
                    options={themeOptions}
                />
                <Button className="ml-auto" isSecondary isMedium>
                    Помощь
                    <Icon name="help-circle" />
                </Button>
            </div>
            <div className="flex grow items-center justify-center px-6 py-8 max-md:px-4 max-md:py-4">
                <div className="w-full max-w-140 rounded-3xl border border-gray-100 bg-gray-0 p-10 shadow-[0_1.5rem_3.75rem_rgba(38,39,64,0.08)] max-md:p-6 max-sm:rounded-2xl max-sm:p-5">
                    {children}
                </div>
            </div>
            <div className="flex justify-between items-center h-21 px-10 max-xl:h-16 max-xl:px-4 max-md:h-auto max-md:flex-col max-md:gap-2.5 max-md:py-8">
                <div className="text-gray-400">©️ 2025 OmniAI</div>
                <div className="flex gap-8 max-md:gap-12">
                    {documents.map((document) => (
                        <Link
                            className="text-gray-400 font-medium transition-colors hover:text-gray-900"
                            key={document.id}
                            href={document.link}
                        >
                            {document.name}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Layout;