import Link from "next/link";
import Image from "@/components/Image";
import Icon from "@/components/Icon";

type Props = {
    isCollapsed: boolean;
};

const User = ({ isCollapsed }: Props) => {
    return (
        <div
            className={`py-4 border-t border-gray-100 max-md:py-0 max-md:px-5 ${
                isCollapsed ? "px-0" : "px-3"
            }`}
        >
            <Link
                className={`group flex items-center h-12 bg-gray-0 rounded-lg max-2xl:bg-gray-25 max-md:bg-transparent ${
                    isCollapsed ? "justify-center" : "px-3"
                }`}
                href="/auth/sign-in"
            >
                <div className="shrink-0 size-6 rounded-lg overflow-hidden border border-gray-0 shadow-[0_0.0625rem_0.125rem_0_rgba(0,0,0,0.08)]">
                    <Image
                        className="size-full opacity-100"
                        src="/images/avatar-1.jpg"
                        width={24}
                        height={24}
                        alt=""
                    />
                </div>
                {!isCollapsed && (
                    <>
                        <div className="ml-2 mr-auto text-body-sm font-medium transition-colors group-hover:text-primary-200">
                            Coco Mario
                        </div>
                        <Icon
                            className="shrink-0 ml-auto -rotate-90"
                            name="chevron"
                        />
                    </>
                )}
            </Link>
        </div>
    );
};

export default User;
