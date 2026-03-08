import { useState } from "react";
import Link from "next/link";
import Head from "@/components/Login/Head";
import Button from "@/components/Button";
import Field from "@/components/Field";

type Props = {
    title: string;
    onContinue: () => void;
};

const VerifyCode = ({ title, onContinue }: Props) => {
    const [number1, setNumber1] = useState("");
    const [number2, setNumber2] = useState("");
    const [number3, setNumber3] = useState("");
    const [number4, setNumber4] = useState("");
    const [number5, setNumber5] = useState("");

    return (
        <>
            <Head
                title={title}
                description={
                    <>
                        Enter the verification code we sent to
                        <span className="block text-gray-800">
                            cocomario@gmail.com
                        </span>
                    </>
                }
            />
            <div className="flex gap-6 mb-6 max-md:gap-3">
                <Field
                    classInput="h-19 px-2 rounded-xl text-center text-[2rem] font-medium max-md:h-13 max-md:text-[1.5rem]"
                    value={number1}
                    onChange={(e) => setNumber1(e.target.value)}
                    required
                />
                <Field
                    classInput="h-19 px-2 rounded-xl text-center text-[2rem] font-medium max-md:h-13 max-md:text-[1.5rem]"
                    value={number2}
                    onChange={(e) => setNumber2(e.target.value)}
                    required
                />
                <Field
                    classInput="h-19 px-2 rounded-xl text-center text-[2rem] font-medium max-md:h-13 max-md:text-[1.5rem]"
                    value={number3}
                    onChange={(e) => setNumber3(e.target.value)}
                    required
                />
                <Field
                    classInput="h-19 px-2 rounded-xl text-center text-[2rem] font-medium max-md:h-13 max-md:text-[1.5rem]"
                    value={number4}
                    onChange={(e) => setNumber4(e.target.value)}
                    required
                />
                <Field
                    classInput="h-19 px-2 rounded-xl text-center text-[2rem] font-medium max-md:h-13 max-md:text-[1.5rem]"
                    value={number5}
                    onChange={(e) => setNumber5(e.target.value)}
                    required
                />
            </div>
            <Button className="w-full" isPrimary onClick={onContinue}>
                Continue
            </Button>
            <div className="flex justify-between items-center mt-2 text-body-sm">
                <div className="text-gray-600">Don’t have an account?</div>
                <Link
                    className="font-medium text-primary-200 transition-colors hover:text-primary-300"
                    href="/auth/sign-up"
                >
                    Resend code
                </Link>
            </div>
        </>
    );
};

export default VerifyCode;
