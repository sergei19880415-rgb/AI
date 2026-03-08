import Link from "next/link";
import Button from "@/components/Button";
import Icon from "@/components/Icon";

type Props = {
    isCollapsed: boolean;
};

const Upgrade = ({ isCollapsed }: Props) => {
    return (
        <div className="py-4 border-t border-gray-100 max-md:px-2">
            {isCollapsed ? (
                <Link
                    className="flex justify-center items-center h-12 bg-gray-0 rounded-lg"
                    href="/settings?tab=pricing"
                >
                    <Icon name="chat-ai" />
                </Link>
            ) : (
                <div className="mx-3 p-4 rounded-xl bg-gray-0 max-2xl:bg-gray-25 max-md:p-0 max-md:bg-transparent">
                    <div className="mb-2 text-body-sm font-semibold">
                        Try Zyra Pro
                    </div>
                    <div className="mb-2 text-body-xs text-gray-400 [&_span]:text-primary-200">
                        Experience premium Chat AI <span>one month</span> free
                    </div>
                    <Button
                        className="w-full"
                        isPrimary
                        isXSmall
                        as="link"
                        href="/settings?tab=pricing"
                    >
                        Upgrade Plan
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Upgrade;
