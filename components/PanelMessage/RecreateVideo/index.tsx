import Image from "@/components/Image";
import Icon from "@/components/Icon";

const RecreateVideo = ({}) => (
    <div className="relative flex gap-2 max-w-111 mb-3">
        <div className="relative flex-1">
            <Image
                className="w-full rounded"
                src="/images/preview-video.png"
                width={600}
                height={400}
                alt=""
            />
            <div className="absolute left-3 bottom-3 z-2 px-2 py-1 rounded-full bg-primary-0 text-body-xs text-primary-300 max-md:left-1.5 max-md:bottom-1.5 max-md:py-0.5">
                First Frame
            </div>
            <button className="group absolute top-2 right-2 size-6 bg-gray-0 rounded-full text-0 max-md:top-1 max-md:right-1">
                <Icon
                    className="fill-gray-900 transition-colors group-hover:fill-primary-200"
                    name="edit"
                />
            </button>
        </div>
        <div className="relative flex-1">
            <Image
                className="w-full rounded"
                src="/images/preview-video.png"
                width={600}
                height={400}
                alt=""
            />
            <div className="absolute left-3 bottom-3 z-2 px-2 py-1 rounded-full bg-primary-0 text-body-xs text-primary-300 max-md:left-1.5 max-md:bottom-1.5 max-md:py-0.5">
                Last Frame
            </div>
            <button className="group absolute top-2 right-2 size-6 bg-gray-0 rounded-full text-0 max-md:top-1 max-md:right-1">
                <Icon
                    className="fill-gray-900 transition-colors group-hover:fill-primary-200"
                    name="edit"
                />
            </button>
        </div>
        <button className="group absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-8 bg-gray-0 border border-black/8 rounded-lg text-0">
            <Icon
                className="fill-gray-500 transition-colors group-hover:fill-gray-900"
                name="arrows"
            />
        </button>
    </div>
);

export default RecreateVideo;
