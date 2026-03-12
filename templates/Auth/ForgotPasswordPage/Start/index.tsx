import { useState } from "react";
import Link from "next/link";
import Head from "@/components/Login/Head";
import Button from "@/components/Button";
import Field from "@/components/Field";

type Props = {
    onContinueWithEmail: () => void;
};

const Start = ({ onContinueWithEmail }: Props) => {
    const [email, setEmail] = useState("");

    return (
        <>
            <Head
                title="Восстановление пароля"
                description="Введи email, и мы отправим ссылку или код для сброса пароля."
            />
            <Field
                className="mb-4"
                label="Email"
                placeholder="Введите email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <Button
                className="w-full mb-2"
                isPrimary
                onClick={onContinueWithEmail}
            >
                Сбросить пароль
            </Button>
            <div className="flex justify-center items-center gap-2 h-14 text-body-sm">
                <Link
                    className="font-medium text-primary-200 transition-colors hover:text-primary-300"
                    href="/auth/sign-in"
                >
                    Назад ко входу
                </Link>
            </div>
        </>
    );
};

export default Start;