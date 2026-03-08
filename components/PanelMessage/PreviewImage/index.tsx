import Image from "@/components/Image";
import Icon from "@/components/Icon";

type Props = {
    onClose: () => void;
};

const PreviewImage = ({ onClose }: Props) => {
    const actions = [
        {
            icon: "pencil",
            onClick: () => {
                console.log("Edit");
            },
        },
        {
            icon: "close",
            onClick: onClose,
        },
    ];

    return (
        <div className="flex flex-wrap gap-2 mb-6 max-md:mb-4">
            <div className="relative w-25">
                <Image
                    className="w-full opacity-100 rounded"
                    src="/images/preview-image.jpg"
                    width={100}
                    height={100}
                    alt="Preview Image"
                />
                <div className="absolute top-0 right-0 flex gap-1">
                    {actions.map((action) => (
                        <button
                            className="group size-6 bg-gray-0 rounded-full text-0"
                            key={action.icon}
                            onClick={action.onClick}
                        >
                            <Icon
                                className="fill-gray-900 transition-colors group-hover:fill-gray-500"
                                name={action.icon}
                            />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PreviewImage;
