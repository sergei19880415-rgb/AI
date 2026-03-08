import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import PreviewImage from "./PreviewImage";
import PreviewFile from "./PreviewFile";
import ChatFeatures from "./ChatFeatures";
import Attach from "./Attach";
import Language from "./Language";
import Audio from "./Audio";
import Voice from "./Voice";
import Time from "./Time";
import CloseLine from "./CloseLine";
import RecreateVideo from "./RecreateVideo";

const PanelMessage = ({}) => {
    const [message, setMessage] = useState("");
    const [attachImage, setAttachImage] = useState(false);
    const [attachFile, setAttachFile] = useState(false);
    const [generateVideo, setGenerateVideo] = useState(false);

    return (
        <div className="absolute left-20 right-20 bottom-6 z-5 max-w-258 mx-auto max-2xl:left-6 max-2xl:right-6 max-md:fixed max-md:left-4 max-md:right-4 max-md:bottom-4">
            {generateVideo && (
                <CloseLine
                    title="Recreate Video"
                    onClose={() => setGenerateVideo(false)}
                />
            )}
            <div className="relative z-2 p-6 bg-gray-0 rounded-xl border border-gray-50 shadow-[0_3rem_6.25rem_0_rgba(17,12,46,0.15)] max-md:p-4">
                {attachImage && (
                    <PreviewImage onClose={() => setAttachImage(false)} />
                )}
                {attachFile && (
                    <PreviewFile onClose={() => setAttachFile(false)} />
                )}
                {generateVideo && <RecreateVideo />}
                <div className="relative min-h-18 pl-8 text-0">
                    <Icon
                        className="absolute top-0.75 left-0 fill-primary-200"
                        name="chat-ai-fill"
                    />
                    <TextareaAutosize
                        className="w-full h-12 text-body-md text-gray-900 outline-none resize-none placeholder:text-gray-500"
                        maxRows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="What do you want to know ?"
                    />
                </div>
                <div className="flex items-center gap-2 mt-2.5">
                    <div className="flex items-center gap-2 mr-auto">
                        <ChatFeatures
                            onGenerateVideo={() => setGenerateVideo(true)}
                        />
                        {generateVideo && <Time />}
                        <Attach
                            onAttachImage={() => setAttachImage(true)}
                            onAttachFile={() => setAttachFile(true)}
                        />
                        <Language />
                    </div>
                    <Audio />
                    <Voice />
                    <Button
                        className="w-8 !px-0"
                        icon="arrow"
                        isPrimary
                        isXSmall
                    />
                </div>
            </div>
        </div>
    );
};

export default PanelMessage;
