"use client";

import Link from "next/link";
import Layout from "@/components/Layout";
import Image from "@/components/Image";

import { history } from "./history";

const NewCtatPage = () => {
    return (
        <Layout classWrapper="flex" title="Diabetes Scan App">
            <div className="w-full my-auto px-20 pt-12 pb-53 max-2xl:pt-8 max-2xl:px-6 max-md:px-4 max-md:pb-46">
                <div className="relative w-16 mx-auto mb-8 after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:w-13 after:h-1.25 after:bg-[#8A44F4]/40 after:rounded-[100%] after:blur-[0.25rem] max-md:mb-4">
                    <Image
                        className="w-full opacity-100"
                        src="/images/logo-circle.png"
                        width={64}
                        height={64}
                        alt=""
                    />
                </div>
                <div className="max-w-130 mx-auto text-center text-h2 max-md:text-[2rem]">
                    Which research topic would you like to analyze today?
                </div>
                <div className="flex flex-col gap-2 max-w-128.5 mx-auto mt-8 max-md:mt-6">
                    {history.map((item) => (
                        <Link
                            className="flex items-center p-3 border border-gray-50 rounded-xl cursor-pointer transition-colors hover:bg-gray-25"
                            key={item.id}
                            href={`/space?id=${item.id}`}
                        >
                            <div className="grow">
                                <div className="mb-1 text-body-sm font-semibold text-gray-600">
                                    {item.title}
                                </div>
                                <div className="text-body-sm text-gray-500 max-md:line-clamp-1">
                                    {item.description}
                                </div>
                            </div>
                            <div className="shrink-0 ml-4 text-body-xs text-gray-500">
                                {item.date}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default NewCtatPage;
