"use client";

import React from "react";
import Layout from "@/components/Layout";
import Message from "@/components/Message";
import Answer from "@/components/Answer";

import { content } from "./content";

const ChatPage = () => {
    return (
        <Layout classWrapper="wrapper flex flex-col gap-6">
            {content.map((item) => (
                <React.Fragment key={item.id}>
                    <div className="date">{item.date}</div>
                    {item.chat.map((chat) => (
                        <React.Fragment key={chat.id}>
                            <Message
                                image={
                                    "image" in chat.message
                                        ? chat.message.image
                                        : undefined
                                }
                                file={
                                    "file" in chat.message
                                        ? chat.message.file
                                        : false
                                }
                            >
                                {chat.message.content}
                            </Message>
                            <Answer
                                image={
                                    "image" in chat.answer
                                        ? chat.answer.image
                                        : undefined
                                }
                                video={
                                    "video" in chat.answer
                                        ? chat.answer.video
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
