"use client";

import React from "react";
import Layout from "@/components/Layout";
import Message from "@/components/Message";
import Answer from "@/components/Answer";

import { content } from "./content";

const ChatPage = () => {
    return (
        <Layout classWrapper="wrapper flex flex-col gap-6" title="Target User">
            {content.map((item) => (
                <React.Fragment key={item.id}>
                    <div className="date">{item.date}</div>
                    {item.chat.map((chat) => (
                        <React.Fragment key={chat.id}>
                            <Message
                                image={
                                    "image" in chat.message
                                        ? typeof chat.message.image === "string"
                                            ? chat.message.image
                                            : undefined
                                        : undefined
                                }
                                file={
                                    "file" in chat.message
                                        ? typeof chat.message.file === "boolean"
                                            ? chat.message.file
                                            : false
                                        : false
                                }
                            >
                                {chat.message.content}
                            </Message>
                            <Answer
                                image={
                                    "image" in chat.answer
                                        ? typeof chat.answer.image === "string"
                                            ? chat.answer.image
                                            : undefined
                                        : undefined
                                }
                                video={
                                    "video" in chat.answer
                                        ? typeof chat.answer.video === "string"
                                            ? chat.answer.video
                                            : undefined
                                        : undefined
                                }
                            >
                                {"content" in chat.answer
                                    ? chat.answer.content
                                    : undefined}
                            </Answer>
                        </React.Fragment>
                    ))}
                </React.Fragment>
            ))}
        </Layout>
    );
};

export default ChatPage;
