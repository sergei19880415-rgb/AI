import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Zyra",
    description: "Coded Chat AI Dashboard",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            className="text-[calc(0.7rem+0.35vw)] max-[2300px]:text-[calc(0.7rem+0.32vw)] max-[2150px]:text-[calc(0.7rem+0.28vw)] max-4xl:text-[1rem]"
            lang="en"
        >
            <head>
                {/* Description no longer than 155 characters */}
                <meta
                    name="description"
                    content="Zyra – Coded Chat AI Dashboard"
                />
                {/* Product Name */}
                <meta
                    name="product-name"
                    content="Zyra – Coded Chat AI Dashboard"
                />
                {/* Twitter Card data */}
                <meta name="twitter:card" content="summary" />
                <meta name="twitter:site" content="@ui8" />
                <meta
                    name="twitter:title"
                    content="Zyra – Coded Chat AI Dashboard"
                />
                <meta
                    name="twitter:description"
                    content="Modern AI chat dashboard built in React and Tailwind"
                />
                <meta name="twitter:creator" content="@ui8" />
                {/* Twitter Summary card images must be at least 120x120px */}
                <meta
                    name="twitter:image"
                    content="https://zyra-z4wa.vercel.app/twitter-card.png"
                />
                {/* Open Graph data for Facebook */}
                <meta
                    property="og:title"
                    content="Zyra – Coded Chat AI Dashboard"
                />
                <meta property="og:type" content="Article" />
                <meta
                    property="og:url"
                    content="https://ui8.net/caraka/products/zyra--chat-ai-dashboard-ui-kit-coded"
                />
                <meta
                    property="og:image"
                    content="https://zyra-z4wa.vercel.app/fb-og-image.png"
                />
                <meta
                    property="og:description"
                    content="Modern AI chat dashboard built in React and Tailwind"
                />
                <meta
                    property="og:site_name"
                    content="Zyra – Coded Chat AI Dashboard"
                />
                <meta property="fb:admins" content="132951670226590" />
                {/* Open Graph data for LinkedIn */}
                <meta
                    property="og:title"
                    content="Zyra – Coded Chat AI Dashboard"
                />
                <meta
                    property="og:url"
                    content="https://ui8.net/caraka/products/zyra--chat-ai-dashboard-ui-kit-coded"
                />
                <meta
                    property="og:image"
                    content="https://zyra-z4wa.vercel.app/linkedin-og-image.png"
                />
                <meta
                    property="og:description"
                    content="Modern AI chat dashboard built in React and Tailwind"
                />
                {/* Open Graph data for Pinterest */}
                <meta
                    property="og:title"
                    content="Zyra – Coded Chat AI Dashboard"
                />
                <meta
                    property="og:url"
                    content="https://ui8.net/caraka/products/zyra--chat-ai-dashboard-ui-kit-coded"
                />
                <meta
                    property="og:image"
                    content="https://zyra-z4wa.vercel.app/pinterest-og-image.png"
                />
                <meta
                    property="og:description"
                    content="Modern AI chat dashboard built in React and Tailwind"
                />
            </head>
            <body
                className={`${geistSans.variable} bg-gray-25 font-geist-sans text-body-md text-gray-800 antialiased max-md:bg-gray-0`}
            >
                <Suspense fallback={null}>{children}</Suspense>
            </body>
        </html>
    );
}
