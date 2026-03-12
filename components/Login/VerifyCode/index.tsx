"use client";

import { useEffect, useState } from "react";
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
    const [emailText, setEmailText] = useState("на указанный email");

    useEffect(() => {
        try {
            const rememberedEmail =
                localStorage.getItem("ai_remember_email")?.trim() || "";
            const currentEmail =
                localStorage.getItem("ai_user_email")?.trim() || "";
            const finalEmail = currentEmail || rememberedEmail;

            if (finalEmail) {
                setEmailText(finalEmail);
            }
        } catch {
            setEmailText("на указанный email");
        }
    }, []);

    return (
        <>
            <Head
                title={title}
                description={
                    <>
                        Введите код подтверждения, который мы отправили
                        <span className="block text-gray-800">{emailText}</span>
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
                Продолжить
            </Button>
            <div className="flex justify-between items-center mt-2 text-body-sm">
                <div className="text-gray-600">Не пришел код?</div>
                <Link
                    className="font-medium text-primary-200 transition-colors hover:text-primary-300"
                    href="/auth/sign-up"
                >
                    Отправить код снова
                </Link>
            </div>
        </>
    );
};

export default VerifyCode;