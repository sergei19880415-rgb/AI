import { useState } from "react";
import Field from "@/components/Field";
import Image from "@/components/Image";
import Button from "@/components/Button";

const Space = ({}) => {
    const [name, setName] = useState("");
    const [category, setCategory] = useState(0);

    const categories = [
        {
            title: "Book",
            image: "/images/book.svg",
        },
        {
            title: "Health",
            image: "/images/health.svg",
        },
        {
            title: "Research",
            image: "/images/research.svg",
        },
        {
            title: "Trip",
            image: "/images/trip.svg",
        },
        {
            title: "Writing",
            image: "/images/writing.svg",
        },
        {
            title: "Investing",
            image: "/images/dollar-circle.svg",
        },
    ];

    return (
        <>
            <div className="mb-8 font-medium">Create new space</div>
            <Field
                className="mb-3"
                label="Space Name"
                placeholder="Enter your Space name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            />
            <div className="flex gap-1 -mx-5 mb-3 px-5 overflow-x-auto scrollbar-none">
                {categories.map((item, index) => (
                    <div
                        className={`flex items-center gap-1 shrink-0 h-9 px-3 rounded-full border text-body-sm text-gray-700 cursor-pointer transition-colors ${
                            category === index
                                ? "border-[#C33AB8]"
                                : "border-gray-50"
                        }`}
                        key={index}
                        onClick={() => setCategory(index)}
                    >
                        <Image
                            className="shrink-0 w-4"
                            src={item.image}
                            width={16}
                            height={16}
                            alt={item.title}
                        />
                        {item.title}
                    </div>
                ))}
            </div>
            <Button
                className="w-full"
                isPrimary
                isSmall
                as="link"
                href="/space/new-chat"
            >
                Create space
            </Button>
        </>
    );
};

export default Space;
