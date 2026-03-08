import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import "swiper/css";
import "swiper/css/navigation";

import { Navigation } from "swiper/modules";

import { items } from "./items";

type Props = {
    onClose: () => void;
};

const Slider = ({ onClose }: Props) => {
    const swiperRef = useRef<SwiperType | null>(null);
    const [isBeginning, setIsBeginning] = useState(false);
    const [isEnd, setIsEnd] = useState(false);

    const handlePrev = () => {
        if (swiperRef.current) {
            swiperRef.current.slidePrev();
        }
    };

    const handleNext = () => {
        if (swiperRef.current) {
            swiperRef.current.slideNext();
        }
    };

    const handleSlideChange = (swiper: SwiperType) => {
        setIsBeginning(swiper.isBeginning);
        setIsEnd(swiper.isEnd);
    };

    return (
        <div className="w-60 mx-auto max-md:w-54">
            <div className="relative py-3.5">
                <Swiper
                    className="swiper-voice !overflow-visible"
                    spaceBetween={0}
                    slidesPerView={1}
                    // loop={true}
                    centeredSlides={true}
                    initialSlide={1}
                    navigation={false}
                    modules={[Navigation]}
                    onSwiper={(swiper) => {
                        swiperRef.current = swiper;
                        setIsBeginning(swiper.isBeginning);
                        setIsEnd(swiper.isEnd);
                    }}
                    onSlideChange={handleSlideChange}
                >
                    {items.map((item) => (
                        <SwiperSlide
                            className="px-9 text-center max-md:px-5"
                            key={item.id}
                        >
                            <div className="text-h5">{item.title}</div>
                            <div className="mt-1">{item.description}</div>
                        </SwiperSlide>
                    ))}
                </Swiper>
                <div className="">
                    {!isBeginning && (
                        <button
                            className="group prev absolute top-1/2 -left-5 z-1 -translate-y-1/2 max-md:-left-4"
                            onClick={handlePrev}
                        >
                            <Icon
                                className="!size-6 fill-gray-0 rotate-90 transition-colors group-hover:fill-primary-200"
                                name="chevron"
                            />
                        </button>
                    )}
                    {!isEnd && (
                        <button
                            className="group next absolute top-1/2 -right-5 z-1 -translate-y-1/2 max-md:-right-4"
                            onClick={handleNext}
                        >
                            <Icon
                                className="!size-6 fill-gray-0 -rotate-90 transition-colors group-hover:fill-primary-200"
                                name="chevron"
                            />
                        </button>
                    )}
                </div>
            </div>
            <div className="flex justify-center gap-3.5 mt-5">
                <Button
                    className="min-w-21"
                    isSecondary
                    isMedium
                    onClick={onClose}
                >
                    Cancel
                </Button>
                <Button
                    className="min-w-21"
                    isPrimary
                    isMedium
                    onClick={onClose}
                >
                    Done
                </Button>
            </div>
        </div>
    );
};

export default Slider;
