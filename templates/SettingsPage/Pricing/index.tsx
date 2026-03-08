import { useState } from "react";
import Tabs from "@/components/Tabs";
import Image from "@/components/Image";
import Button from "@/components/Button";

import { pricing } from "./pricing";

const tabs = [
    { id: 0, name: "Personal" },
    { id: 1, name: "Bussiness", sale: "15% Off" },
];

const Pricing = ({}) => {
    const [tab, setTab] = useState(tabs[0]);

    return (
        <div className="-mx-10 max-2xl:mx-0">
            <div className="flex justify-between items-center -mt-4 mb-8 max-md:flex-col max-md:gap-2.5 max-md:mb-6 max-md:mt-2">
                <div className="text-h5">Reccomended plan for you</div>
                <div className="relative w-72">
                    <Tabs items={tabs} value={tab} setValue={setTab} />
                </div>
            </div>
            <div className="flex gap-6 max-lg:flex-col">
                {pricing.map((item) => (
                    <div
                        className="flex flex-col flex-1 p-0.75 border border-[#E2E2EE] rounded-xl bg-[#F7F7F7] shadow-[0_0.0625rem_0.125rem_0_rgba(2,6,23,0.08)]"
                        key={item.id}
                    >
                        <div className="flex items-center gap-3 h-14 mb-1 px-4">
                            <div className="text-h5">{item.name}</div>
                            {item.name === "PLUS" && (
                                <div className="relative px-2.5 py-1.5 rounded-full overflow-hidden text-body-xs font-medium text-gray-0">
                                    <Image
                                        className="opacity-100 object-cover"
                                        src="/images/gradient.png"
                                        fill
                                        alt=""
                                    />
                                    <span className="relative z-1">
                                        RECOMMENDATION
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="grow p-4 pb-8 rounded-xl bg-gray-0 shadow-[inset_0_0_0_0.0625rem_#E2E2EE]">
                            <div className="flex items-center h-12 mb-5 max-md:mb-3">
                                {item.price === "Free" ? (
                                    <div className="text-[2rem] leading-[1.2] tracking-[-0.03em] font-medium">
                                        Free
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-[2rem] leading-[1.2] tracking-[-0.03em] font-medium">
                                            {tab.id === 0
                                                ? item.pricePersonal
                                                : item.priceBusiness}
                                        </div>
                                        <div className="relative -bottom-1 ml-0.5 text-[#777777]">
                                            / Month
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center min-h-12 mb-5 text-[#777777] max-xl:min-h-10.5 max-xl:text-[0.875rem] max-lg:min-h-auto max-lg:text-[1rem]">
                                {item.description}
                            </div>
                            <Button
                                className="w-full mb-5"
                                isSecondary
                                isMedium
                            >
                                {item.buttonText}
                            </Button>
                            {item.name !== "Starter" && (
                                <div className="mb-3 text-[#777777]">
                                    Everything in Free, and:
                                </div>
                            )}
                            <div className="flex flex-col gap-3">
                                {item.features.map((feature) => (
                                    <div
                                        className="flex items-center gap-2 text-[#777777] max-xl:text-body-sm max-lg:text-body-md"
                                        key={feature}
                                    >
                                        <Image
                                            className="shrink-0 size-5 opacity-100"
                                            src="/images/circle-check.svg"
                                            width={20}
                                            height={20}
                                            alt=""
                                        />
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Pricing;
