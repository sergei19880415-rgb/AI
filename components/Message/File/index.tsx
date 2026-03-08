import Image from "@/components/Image";

const File = ({}) => {
    return (
        <div className="flex flex-col items-end gap-2 mt-2">
            <div className="relative flex items-center w-66 p-3 bg-gray-50 rounded-lg rounded-tr-none">
                <div className="flex justify-center items-center size-10 bg-error-50 rounded">
                    <Image
                        className="w-5 opacity-100"
                        src="/images/file-text.svg"
                        width={20}
                        height={20}
                        alt="Preview File"
                    />
                </div>
                <div className="w-[calc(100%-2.5rem)] pl-2">
                    <div className="mb-1 truncate font-medium">
                        WW2_History_Lesson.pdf
                    </div>
                    <div className="text-body-sm text-gray-600">PDF</div>
                </div>
            </div>
        </div>
    );
};

export default File;
