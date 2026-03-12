import { useState } from "react";
import Link from "next/link";
import Head from "@/components/Login/Head";
import Button from "@/components/Button";
import Field from "@/components/Field";
import Checkbox from "@/components/Checkbox";

type Props = {
    onSignUp: () => void;
};

const Start = ({ onSignUp }: Props) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agreeTerms, setAgreeTerms] = useState(false);

    return (
        <>
            <Head
                title="Создай аккаунт в MAX AI"
                description="Зарегистрируйся и начни пользоваться AI-агрегатором."
            />
            <Field
                className="mb-3"
                label="Email"
                placeholder="Введите email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <Field
                className="mb-3"
                label="Пароль"
                placeholder="Введите пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <Field
                className="mb-4"
                label="Подтвердите пароль"
                placeholder="Повторите пароль"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
            />
            <Checkbox
                className="mb-4"
                label="Я согласен с Условиями и Политикой конфиденциальности"
                checked={agreeTerms}
                onChange={() => setAgreeTerms(!agreeTerms)}
            />
            <Button className="w-full mb-2" isPrimary onClick={onSignUp}>
                Зарегистрироваться
            </Button>
            <div className="flex justify-center items-center gap-2 h-14 text-body-sm">
                <div className="text-gray-600">Уже есть аккаунт?</div>
                <Link
                    className="font-medium text-primary-200 transition-colors hover:text-primary-300"
                    href="/auth/sign-in"
                >
                    Войти
                </Link>
            </div>
        </>
    );
};

export default Start;