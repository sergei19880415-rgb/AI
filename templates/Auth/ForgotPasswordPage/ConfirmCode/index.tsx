import { useState } from "react";
import Link from "next/link";
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
                title="Reset your password"
                description="Enter your new password and confirm it."
            />
            <Field
                className="mb-3"
                label="Password"
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <Field
                className="mb-4"
                label="Confirm Password"
                placeholder="Confirm your password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
            />
            <Button className="w-full mb-2" isPrimary onClick={onContinue}>
                Reset password
            </Button>
        </>
    );
};

export default ConfirmCode;
