import { useState } from "react";
import Image from "@/components/Image";
import Icon from "@/components/Icon";
import Actions from "./Actions";

type Props = {
    item: {
        id: number;
        image: string;
        type: string;
    };
};

const Preview = ({ item }: Props) => {
    const [visibleActions, setVisibleActions] = useState(false);

    return (
        <div
            className="group/item relative w-[calc(20%-1.25rem)] mt-5 mx-2.5 max-xl:w-[calc(25%-1.25rem)] max-lg:w-[calc(33.333%-1.25rem)] max-md:w-[calc(50%-1rem)] max-md:mt-4 max-md:mx-2"
            onClick={() => setVisibleActions(!visibleActions)}
        >
            <Image
                className="w-full rounded-lg"
                src={item.image}
                width={100}
                height={100}
                alt=""
            />
            {item.type === "video" && (
                <div className="absolute top-2 left-2 flex justify-center items-center size-8 bg-[#1B1B1B]/40 rounded-full backdrop-blur-3xl">
                    <Icon className="fill-gray-0" name="camera-fill" />
                </div>
            )}
            <Actions visible={visibleActions} />
        </div>
    );
};

export default Preview;
