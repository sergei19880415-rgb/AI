import { useState } from "react";
import Icon from "@/components/Icon";
import Image from "@/components/Image";

const Audio = ({}) => {
    const [isRecording, setIsRecording] = useState(false);

    return (
        <div className="flex gap-3">
            {isRecording && (
                <>
                    <div className="max-w-106 px-3 border-x border-gray-300 overflow-hidden max-3xl:max-w-100 max-xl:max-w-80 max-lg:hidden">
                        <Image
                            className="w-114.5 h-8 opacity-100"
                            src="/images/audio-recording.svg"
                            width={458}
                            height={33}
                            alt="Audio Recording"
                        />
                    </div>
                    <button
                        className="size-8 text-0 max-lg:hidden"
                        onClick={() => setIsRecording(false)}
                    >
                        <Icon name="close" />
                    </button>
                </>
            )}
            <div className="relative">
                <button
                    className={`relative z-2 flex justify-center items-center size-8 outline-0 transition-colors ${
                        isRecording
                            ? "bg-primary-200 rounded-full fill-gray-0 shadow-[inset_0_-0.125rem_0_0_#722BDD,inset_0_0.125rem_0_0_#9C60F6] hover:bg-primary-300 hover:shadow-[inset_0_-0.125rem_0_0_#3A186F,inset_0_0.125rem_0_0_#623A9E]"
                            : "border border-gray-100 rounded-lg fill-gray-900 shadow-[0_0.0625rem_0.125rem_0_rgba(0,0,0,0.08)] hover:bg-gray-25"
                    }`}
                    onClick={() => setIsRecording(!isRecording)}
                >
                    <Icon
                        className="relative z-2 fill-inherit"
                        name="microphone"
                    />
                </button>
                {isRecording && (
                    <div className="absolute inset-0 rounded-full bg-primary-50 animate-ping"></div>
                )}
            </div>
        </div>
    );
};

export default Audio;
