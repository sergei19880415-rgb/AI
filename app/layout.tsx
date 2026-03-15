import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "MAX AI",
    description: "AI-агрегатор с несколькими моделями в одном интерфейсе",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            className="text-[calc(0.7rem+0.35vw)] max-[2300px]:text-[calc(0.7rem+0.32vw)] max-[2150px]:text-[calc(0.7rem+0.28vw)] max-4xl:text-[1rem]"
            lang="ru"
        >
            <head>
                <meta
                    name="description"
                    content="MAX AI — AI-агрегатор с несколькими моделями в одном интерфейсе"
                />
                <meta name="product-name" content="MAX AI" />

                <meta name="twitter:card" content="summary" />
                <meta name="twitter:title" content="MAX AI" />
                <meta
                    name="twitter:description"
                    content="AI-агрегатор с несколькими моделями в одном интерфейсе"
                />

                <meta property="og:title" content="MAX AI" />
                <meta property="og:type" content="website" />
                <meta
                    property="og:description"
                    content="AI-агрегатор с несколькими моделями в одном интерфейсе"
                />
                <meta property="og:site_name" content="MAX AI" />
            </head>
            <body
                className={`${geistSans.variable} bg-gray-25 font-geist-sans text-body-md text-gray-800 antialiased max-md:bg-gray-0`}
            >
                <Suspense fallback={null}>{children}</Suspense>
            </body>
        </html>
    );
}