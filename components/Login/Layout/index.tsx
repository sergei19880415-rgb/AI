import Link from "next/link";
import Button from "@/components/Button";
import Icon from "@/components/Icon";

type Props = {
    children: React.ReactNode;
};

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
    return (
        <div className="flex min-h-[100svh] flex-col bg-gray-25">
            <div className="flex justify-between items-center px-10 py-5 max-xl:p-4">
                <div
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-100 bg-gray-0 px-4 text-sm font-semibold text-gray-800 shadow-[0_0.0625rem_0.125rem_0_rgba(13,13,18,0.04)]"
                    aria-label="Текущий язык: русский"
                >
                    <span aria-hidden="true">🇷🇺</span>
                    <span>RU</span>
                </div>
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