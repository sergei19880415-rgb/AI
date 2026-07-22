"use client";

import Layout from "@/components/Layout";
import Preview from "./Preview";
import { content } from "./content";

const GalleryLibraryPage = () => {
    return (
        <Layout classWrapper="wrapper" title="Галерея">
            {content.length > 0 ? (
                <div className="-mx-2.5 -mt-5 flex flex-wrap max-md:-mx-2 max-md:-mt-4">
                    {content.map((item) => (
                        <Preview item={item} key={item.id} />
                    ))}
                </div>
            ) : (
                <div className="flex min-h-[55vh] items-center justify-center px-4 text-center">
                    <div className="max-w-md">
                        <div className="text-[20px] font-semibold leading-7 text-gray-900">
                            Галерея пока пуста
                        </div>
                        <div className="mt-2 text-[14px] leading-6 text-gray-500">
                            Здесь будут сохраняться изображения, созданные в OmniAI.
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default GalleryLibraryPage;
