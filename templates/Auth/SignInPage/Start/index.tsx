import { useState } from "react";
import Link from "next/link";
import Head from "@/components/Login/Head";
import Button from "@/components/Button";
import Image from "@/components/Image";
import Field from "@/components/Field";
import Checkbox from "@/components/Checkbox";

type Props = {
    onContinueWithEmail: () => void;
};

const Start = ({ onContinueWithEmail }: Props) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);

    return (
        <>
            <Head
                title="Ready to chat with Zyra AI?"
                description="Login to access your past chats or start a fresh conversation."
            />
            <Button className="w-full mb-3" isSecondary>
                <Image
                    className="w-5 opacity-100"
                    src="/images/google.svg"
                    width={20}
                    height={20}
                    alt="Google"
                />
                Continue with Google
            </Button>
            <Button className="w-full" isSecondary>
                <Image
                    className="w-5 opacity-100"
                    src="/images/apple.svg"
                    width={20}
                    height={20}
                    alt="Apple"
                />
                Continue with Apple
            </Button>
            <div className="flex items-center gap-6 my-4 text-body-sm text-gray-400 before:grow before:h-0.25 before:bg-gray-50 after:grow after:h-0.25 after:bg-gray-50">
                Or continue with
            </div>
            <Field
                className="mb-3"
                label="Email"
                placeholder="Enter your email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <Field
                className="mb-2"
                label="Password"
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <div className="flex justify-between items-center h-10 mb-4">
                <Checkbox
                    label="Remember me"
                    checked={remember}
                    onChange={() => setRemember(!remember)}
                />
                <Link
                    className="font-medium text-primary-200 transition-colors hover:text-primary-300"
                    href="/auth/forgot-password"
                >
                    Forgot password?
                </Link>
            </div>
            <Button
                className="w-full mb-2"
                isPrimary
                onClick={onContinueWithEmail}
            >
                Continue With Email
            </Button>
            <div className="flex justify-center items-center gap-2 h-14 text-body-sm">
                <div className="text-gray-600">Don’t have an account?</div>
                <Link
                    className="font-medium text-primary-200 transition-colors hover:text-primary-300"
                    href="/auth/sign-up"
                >
                    Sign Up
                </Link>
            </div>
        </>
    );
};

export default Start;
