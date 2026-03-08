import Button from "@/components/Button";
import Icon from "@/components/Icon";
import NoArchivedChat from "./NoArchivedChat";

import { chats } from "./chats";

const ArchivedChat = ({}) => {
    return (
        <>
            <div className="font-medium">Archived Chat</div>
            {chats.length > 0 ? (
                <div className="flex flex-col gap-2 mt-8">
                    {chats.map((chat) => (
                        <div
                            className="relative p-3 pr-41 border border-gray-50 rounded-xl"
                            key={chat.id}
                        >
                            <div className="truncate text-body-sm font-medium">
                                {chat.title}
                            </div>
                            <div className="text-body-xs text-gray-500">
                                {chat.date}
                            </div>
                            <div className="absolute top-1/2 right-3 flex gap-3 -translate-y-1/2">
                                <Button
                                    className=""
                                    isSecondary
                                    isXSmall
                                    as="link"
                                    href="/archived-chat"
                                >
                                    View chat
                                </Button>
                                <div className="flex gap-2">
                                    <button className="text-0 transition-opacity hover:opacity-85">
                                        <Icon name="box" />
                                    </button>
                                    <button className="text-0 transition-opacity hover:opacity-85">
                                        <Icon
                                            className="fill-error-100"
                                            name="trash"
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <NoArchivedChat />
            )}
        </>
    );
};

export default ArchivedChat;
