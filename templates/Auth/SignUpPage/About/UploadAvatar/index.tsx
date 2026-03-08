import { useState, useRef } from "react";
import Image from "@/components/Image";
import Button from "@/components/Button";

const UploadAvatar = ({}) => {
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
        }
    };

    return (
        <div className="mb-3 p-3.75 border border-gray-100 rounded-xl">
            <div className="flex items-center gap-4">
                <div className="relative flex justify-center items-center shrink-0 size-18 bg-gray-50 rounded-full overflow-hidden">
                    {preview ? (
                        <Image
                            className="size-full opacity-100"
                            src={preview}
                            width={72}
                            height={72}
                            alt="avatar"
                        />
                    ) : (
                        <svg
                            className="!size-7 fill-[#818898]"
                            xmlns="http://www.w3.org/2000/svg"
                            width="29"
                            height="29"
                            fill="none"
                            viewBox="0 0 29 29"
                        >
                            <path d="M23.5 25.85H4.7V23.5c0-3.245 2.63-5.875 5.875-5.875h7.05c3.245 0 5.875 2.63 5.875 5.875v2.35zm-9.4-10.575a7.05 7.05 0 1 1 0-14.1 7.05 7.05 0 1 1 0 14.1z" />
                        </svg>
                    )}
                </div>
                <div className="grow">
                    <div className="mb-1 font-semibold">
                        Upload your image{" "}
                        <span className="text-gray-300">(Optional)</span>
                    </div>
                    <div className="max-w-60 text-body-xs text-gray-600">
                        formats allowed are *png, *jpg. up to 10 MB with a
                        minimum size of 400px by 400px
                    </div>
                </div>
            </div>
            <div className="relative mt-4">
                <input
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 object-cover"
                    ref={inputRef}
                    type="file"
                    onChange={handleChange}
                    accept="image/*"
                />
                <Button className="w-full !h-9 rounded-lg" isSecondary isSmall>
                    Upload image
                </Button>
            </div>
        </div>
    );
};

export default UploadAvatar;
