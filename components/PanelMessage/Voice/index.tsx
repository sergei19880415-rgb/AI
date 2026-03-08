import { useState } from "react";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import Image from "@/components/Image";
import Slider from "./Slider";

const Voice = ({}) => {
    const [open, setOpen] = useState(false);
    const [visibleSlider, setVisibleSlider] = useState(false);

    return (
        <>
            <button
                className="relative z-2 flex justify-center items-center size-8 border border-gray-100 rounded-lg fill-gray-900 shadow-[0_0.0625rem_0.125rem_0_rgba(0,0,0,0.08)] outline-0 transition-colors hover:bg-gray-25"
                onClick={() => setOpen(true)}
            >
                <Icon className="relative z-2 fill-inherit" name="voice" />
            </button>
            <Modal
                classWrapper="max-w-188 max-md:!w-[calc(100%+2rem)] max-md:max-w-[calc(100%+2rem)] max-md:-mx-4"
                open={open}
                onClose={() => setOpen(false)}
            >
                <div className="relative w-60 mx-auto before:absolute before:-inset-10 before:bg-[#9150F5]/10 before:rounded-full before:blur-[2.25rem] max-md:w-45">
                    <Image
                        className="w-full opacity-100"
                        src="/images/voice-recording.png"
                        width={240}
                        height={240}
                        alt="Voice Recording"
                    />
                </div>
                {visibleSlider && (
                    <div className="mt-20 overflow-hidden max-md:mt-5">
                        <Slider onClose={() => setVisibleSlider(false)} />
                    </div>
                )}
                <div className="flex justify-center gap-5 mt-30 max-md:mt-20">
                    <button className="group size-16 bg-gray-0 rounded-full text-0 transition-colors hover:bg-gray-25">
                        <Icon
                            className="!size-7 fill-gray-500 transition-colors group-hover:fill-gray-900"
                            name="microphone"
                        />
                    </button>
                    <button
                        className={`group size-16 rounded-full text-0 transition-colors hover:bg-gray-25 ${
                            visibleSlider ? "!bg-gray-700 " : "bg-gray-0"
                        }`}
                        onClick={() => setVisibleSlider(!visibleSlider)}
                    >
                        <Icon
                            className={`!size-7 transition-colors group-hover:fill-gray-900 ${
                                visibleSlider ? "!fill-gray-0" : "fill-gray-500"
                            }`}
                            name="message-ai"
                        />
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default Voice;
