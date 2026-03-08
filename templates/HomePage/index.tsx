"use client";

import Layout from "@/components/Layout";
import Image from "@/components/Image";
import Button from "@/components/Button";
import useEventsStore from "@/store/useEventsStore";

import { features } from "./features";

const HomePage = () => {
    const { isNewChat } = useEventsStore();

    return (
        <Layout classWrapper="flex">
            <div className="w-full my-auto px-20 pt-12 pb-53 max-2xl:px-6 max-md:pt-8 max-md:px-4 max-md:pb-46">
                <div className="relative w-16 mx-auto mb-8 after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:w-13 after:h-1.25 after:bg-[#8A44F4]/40 after:rounded-[100%] after:blur-[0.25rem] max-md:mb-4">
                    <Image
                        className="w-full opacity-100"
                        src="/images/logo-circle.png"
                        width={64}
                        height={64}
                        alt=""
                    />
                </div>
                <div className="text-center text-h2">
                    How can i help you today ?
                </div>
                {!isNewChat && (
                    <div className="flex gap-4 max-w-258 mx-auto mt-8 max-lg:flex-col max-lg:max-w-100 max-lg:mx-auto">
                        {features.map((feature, index) => (
                            <div
                                className="relative flex-1 bg-gray-25 rounded-xl shadow-[0_0.125rem_0.3125rem_0_rgba(38,39,64,0.03)]"
                                key={index}
                            >
                                <Image
                                    className="w-full"
                                    src={feature.image}
                                    width={333}
                                    height={320}
                                    alt=""
                                />
                                <div className="absolute bottom-2 left-2 right-2 p-4 bg-gray-0 rounded-lg">
                                    <div className="mb-1 text-body-lg font-semibold">
                                        {feature.title}
                                    </div>
                                    <div className="mb-4 text-gray-500">
                                        {feature.description}
                                    </div>
                                    <Button
                                        className="w-full"
                                        isSecondary
                                        isSmall
                                        as="link"
                                        href="/chat"
                                    >
                                        Try now
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default HomePage;
