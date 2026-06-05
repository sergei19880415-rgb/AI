import Link from "next/link";
import Image from "@/components/Image";

type Props = {
    title: string;
    description: React.ReactNode;
};

const Head = ({ title, description }: Props) => (
    <div className="mb-7 text-center">
        <Link className="mb-3 inline-flex size-12 items-center justify-center rounded-2xl bg-primary-0 shadow-[inset_0_0_0_0.0625rem_rgba(138,68,244,0.12)]" href="/">
            <Image
                className="w-7 opacity-100"
                src="/images/logo.svg"
                width={28}
                height={28}
                alt="Logo"
            />
        </Link>
        <div className="mb-2 text-h4 max-sm:text-h5">{title}</div>
        <div className="text-body-md text-gray-500">{description}</div>
    </div>
);

export default Head;
