import Button from "@/components/Button";
import ChatVersions from "./ChatVersions";

type Props = {
    title?: string;
    onOpenSidebar: () => void;
};

const Header = ({ title, onOpenSidebar }: Props) => (
    <div className="relative flex items-center border-b border-gray-100 p-6 max-2xl:py-5 max-md:fixed max-md:top-0 max-md:left-0 max-md:right-0 max-md:z-10 max-md:h-16 max-md:bg-gray-0 max-md:px-4 max-md:py-0">
        <Button
            className="!hidden w-8 shrink-0 flex-col !gap-0.75 !px-0 mr-3 [&_span]:h-[1.5px] [&_span]:w-3 [&_span]:bg-gray-800 max-2xl:!flex"
            isSecondary
            isXSmall
            onClick={onOpenSidebar}
        >
            <span></span>
            <span></span>
            <span></span>
        </Button>

        <ChatVersions />

        <div className="ml-auto pr-1 text-right font-semibold text-gray-900 max-md:pr-0">
            {title || "Чат"}
        </div>
    </div>
);

export default Header;