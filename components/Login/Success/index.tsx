import Image from "@/components/Image";
import Button from "@/components/Button";

type Props = {
    title: string;
    description: React.ReactNode;
    isResetPassword?: boolean;
};

const Success = ({ title, description, isResetPassword }: Props) => {
    return (
        <>
            <div className="mb-6 text-center">
                <div className="relative w-16 mx-auto mb-6 after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:w-13 after:h-1.25 after:bg-[#20AE20]/40 after:rounded-[100%] after:blur-[0.25rem]">
                    <Image
                        className="w-full opacity-100"
                        src="/images/success.png"
                        width={64}
                        height={64}
                        alt="Logo"
                    />
                </div>

                <div className="mb-2 text-h5">{title}</div>
                <div className="text-gray-500">{description}</div>
            </div>
            {isResetPassword ? (
                <Button
                    className="w-full"
                    isPrimary
                    as="link"
                    href="/auth/sign-in"
                >
                    Sign in
                </Button>
            ) : (
                <Button className="w-full" isPrimary as="link" href="/">
                    Start Exploring Zyra
                </Button>
            )}
        </>
    );
};

export default Success;
