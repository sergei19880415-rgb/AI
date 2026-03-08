import Button from "@/components/Button";
import Icon from "@/components/Icon";
import ChatVersions from "./ChatVersions";

type Props = {
    title?: string;
    onOpenSidebar: () => void;
};

const Header = ({ title, onOpenSidebar }: Props) => (
    <div className="relative flex items-center p-6 border-b border-gray-100 max-2xl:py-5 max-md:fixed max-md:top-0 max-md:left-0 max-md:right-0 max-md:z-10 max-md:h-16 max-md:px-4 max-md:py-0 max-md:bg-gray-0">
        <Button
            className="!hidden flex-col shrink-0 !gap-0.75 w-8 mr-3 !px-0 [&_span]:w-3 [&_span]:h-[1.5px] [&_span]:bg-gray-800 max-2xl:!flex max-md:order-1"
            isSecondary
            isXSmall
            onClick={onOpenSidebar}
        >
            <span></span>
            <span></span>
            <span></span>
        </Button>
        <ChatVersions />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 truncate font-semibold max-md:static max-md:order-2 max-md:mr-auto max-md:translate-x-0 max-md:translate-y-0 max-md:pr-3">
            {title || "Chat"}
        </div>
        <Button
            className="shrink-0 ml-auto max-md:order-4 max-md:gap-0 max-md:w-8 max-md:ml-3 max-md:!px-0 max-md:!text-0"
            isSecondary
            isXSmall
        >
            Help
            <Icon name="help-circle" />
        </Button>
    </div>
);

export default Header;
