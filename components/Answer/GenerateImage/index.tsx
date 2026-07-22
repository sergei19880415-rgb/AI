"use client";

import { useState } from "react";
import Image from "@/components/Image";
import Modal from "@/components/Modal";
import Icon from "@/components/Icon";

type Props = {
    image: string;
};

const getImageExtension = (image: string) => {
    const match = /^data:image\/(png|jpe?g|webp);/i.exec(image);
    const extension = String(match?.[1] || "png").toLowerCase();
    return extension === "jpeg" ? "jpg" : extension;
};

const GenerateImage = ({ image }: Props) => {
    const [open, setOpen] = useState(false);

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = image;
        link.download = `omniai-image-${Date.now()}.${getImageExtension(image)}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <>
            <div className="mt-1 w-full max-w-[36rem]">
                <button
                    type="button"
                    className="group relative block w-full overflow-hidden rounded-2xl rounded-tl-none border border-gray-100 bg-gray-25 text-left"
                    onClick={() => setOpen(true)}
                    aria-label="Открыть изображение"
                >
                    <Image
                        className="h-auto max-h-[34rem] w-full object-contain"
                        src={image}
                        width={1024}
                        height={1024}
                        alt="Сгенерированное изображение"
                        unoptimized
                    />
                    <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-medium text-gray-700 shadow-sm transition group-hover:bg-white">
                        Открыть
                    </span>
                </button>

                <div className="mt-2 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                    >
                        <Icon name="download" className="fill-current" />
                        Скачать
                    </button>
                </div>
            </div>

            <Modal
                classWrapper="max-w-[min(92vw,70rem)]"
                open={open}
                onClose={() => setOpen(false)}
            >
                <div className="rounded-2xl bg-gray-0 p-3 max-md:p-2">
                    <Image
                        className="mx-auto h-auto max-h-[78vh] max-w-full object-contain"
                        src={image}
                        width={1536}
                        height={1536}
                        alt="Сгенерированное изображение"
                        unoptimized
                    />
                </div>
                <div className="mt-4 flex justify-center">
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="flex items-center gap-2 rounded-xl bg-primary-300 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-400"
                    >
                        <Icon name="download" className="fill-current" />
                        Скачать изображение
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default GenerateImage;
