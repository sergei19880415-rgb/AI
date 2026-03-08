import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import AnimateHeight from "react-animate-height";
import Image from "@/components/Image";
import Icon from "@/components/Icon";
import Actions from "./Actions";

import { spaces } from "./spaces";

const Space = ({}) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const searchParams = useSearchParams();
    const activeId = Number(searchParams.get("id"));
    const pathname = usePathname();

    return (
        <div className="px-3 py-4 border-b border-gray-100">
            <div className="mb-2 pl-2 text-body-xs">Space</div>
            <div className="flex flex-col gap-2">
                {spaces.map((item, index) => (
                    <div className="" key={index}>
                        <div
                            className="group flex items-center gap-2 h-8 px-3 text-body-sm transition-colors cursor-pointer hover:text-primary-200"
                            onClick={() => setActiveIndex(index)}
                        >
                            <Image
                                className="shrink-0 w-4 opacity-100"
                                src={item.image}
                                width={16}
                                height={16}
                                alt={item.title}
                            />
                            {item.title}
                            <Icon
                                className={`shrink-0 ml-auto fill-gray-500 transition-all ${
                                    activeIndex === index ? "rotate-180" : ""
                                }`}
                                name="chevron"
                            />
                        </div>
                        <AnimateHeight
                            duration={500}
                            height={
                                activeIndex === index ||
                                (pathname.startsWith("/space") &&
                                    activeId ===
                                        item.list.find(
                                            (item) => item.id === activeId
                                        )?.id)
                                    ? "auto"
                                    : 0
                            }
                        >
                            <div className="relative flex flex-col gap-0.5 pt-0.5">
                                {item.list.map((item, index) => (
                                    <div className="relative" key={index}>
                                        <Link
                                            className={`relative flex items-center min-h-8 pl-9 text-body-sm cursor-pointer transition-colors before:absolute before:top-0.5 before:left-5 before:bottom-0 before:z-1 before:border-l before:border-dashed before:pointer-events-none hover:text-primary-200 ${
                                                pathname.startsWith("/space") &&
                                                activeId === item.id
                                                    ? "bg-gray-100 !text-gray-900 before:border-gray-200"
                                                    : "before:border-gray-100"
                                            }`}
                                            href={`/space?id=${item.id}`}
                                        >
                                            {item.title}
                                        </Link>
                                        {pathname.startsWith("/space") &&
                                            activeId === item.id && <Actions />}
                                    </div>
                                ))}
                            </div>
                        </AnimateHeight>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Space;
