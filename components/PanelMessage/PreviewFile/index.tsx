import Image from "@/components/Image";
import Icon from "@/components/Icon";

type Props = {
    onClose: () => void;
};

const PreviewFile = ({ onClose }: Props) => {
    return (
        <div className="flex flex-col gap-2 mb-6 max-md:mb-4">
            <div className="relative flex items-center w-71 p-0.75 border border-black/8 rounded-lg max-md:w-full">
                <div className="flex justify-center items-center size-12 bg-error-50 rounded">
                    <Image
                        className="w-6 opacity-100"
                        src="/images/file-text.svg"
                        width={24}
                        height={24}
                        alt="Preview File"
                    />
                </div>
                <div className="w-[calc(100%-3.5rem)] pl-2">
                    <div className="mb-1 pr-4 truncate font-medium">
                        WW2_History_Lesson.pdf
                    </div>
                    <div className="text-body-sm text-gray-600">
                        Size : 3.21 MB
                    </div>
                </div>
                <button
                    className="absolute top-1 right-1 size-4 bg-gray-500 rounded-full text-0 transition-colors hover:bg-gray-900"
                    onClick={onClose}
                >
                    <Icon className="!size-3 fill-gray-0" name="close" />
                </button>
            </div>
        </div>
    );
};

export default PreviewFile;
