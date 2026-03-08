import Link from "next/link";
import Image from "@/components/Image";

type Props = {
    title: string;
    description: React.ReactNode;
};

const Head = ({ title, description }: Props) => (
    <div className="mb-6 text-center">
        <Link className="inline-flex mb-2" href="/">
            <Image
                className="w-6 opacity-100"
                src="/images/logo.svg"
                width={24}
                height={24}
                alt="Logo"
            />
        </Link>
        <div className="mb-2 text-h5">{title}</div>
        <div className="text-gray-500">{description}</div>
    </div>
);

export default Head;
