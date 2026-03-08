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
                title="Reset your password"
                description="Enter your email and we'll send you a reset link."
            />
            <Field
                className="mb-4"
                label="Email"
                placeholder="Enter your email"
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
                Reset password
            </Button>
            <div className="flex justify-center items-center gap-2 h-14 text-body-sm">
                <Link
                    className="font-medium text-primary-200 transition-colors hover:text-primary-300"
                    href="/auth/sign-in"
                >
                    Back to login
                </Link>
            </div>
        </>
    );
};

export default Start;
