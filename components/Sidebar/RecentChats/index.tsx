import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { requests } from "./requests";

const RecentChats = () => {
    const searchParams = useSearchParams();
    const activeId = Number(searchParams.get("id"));
    const pathname = usePathname();

    return (
        <div className="px-3 py-4">
            <div className="mb-2 pl-2 text-body-xs">RECENT CHATS</div>
            <div className="flex flex-col gap-0.5">
                {requests.map((item) => (
                    <Link
                        className={`truncate px-3 py-2 rounded-lg text-body-sm cursor-pointer transition-colors hover:text-primary-200 ${
                            pathname.startsWith("/chat") && item.id === activeId
                                ? "bg-gray-100 !text-gray-900"
                                : ""
                        }`}
                        key={item.id}
                        href={`/chat?id=${item.id}`}
                    >
                        {item.title}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default RecentChats;
