"use client";

import React from "react";
import Layout from "@/components/Layout";
import Preview from "./Preview";

import { content } from "./content";

const ChatPage = () => {
    return (
        <Layout classWrapper="wrapper" title="Gallery Library">
            <div className="flex flex-wrap -mt-5 -mx-2.5 max-md:-mt-4 max-md:-mx-2">
                {content.map((item) => (
                    <Preview item={item} key={item.id} />
                ))}
            </div>
        </Layout>
    );
};

export default ChatPage;
