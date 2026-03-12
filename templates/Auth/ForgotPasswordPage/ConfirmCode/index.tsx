import { useState } from "react";
import Head from "@/components/Login/Head";
import Button from "@/components/Button";
import Field from "@/components/Field";

type Props = {
    onContinue: () => void;
};

const ConfirmCode = ({ onContinue }: Props) => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    return (
        <>
            <Head
                title="Сброс пароля"
                description="Введите новый пароль и подтвердите его."
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
            <Button className="w-full mb-2" isPrimary onClick={onContinue}>
                Сохранить новый пароль
            </Button>
        </>
    );
};

export default ConfirmCode;