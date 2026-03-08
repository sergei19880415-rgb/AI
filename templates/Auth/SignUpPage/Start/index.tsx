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
                title="Start your journey with Zyra"
                description="Create your account and start chatting smarter with AI."
            />
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
            <Checkbox
                className="mb-4"
                label="I agree to the Terms & Privacy Policy"
                checked={agreeTerms}
                onChange={() => setAgreeTerms(!agreeTerms)}
            />
            <Button className="w-full mb-2" isPrimary onClick={onSignUp}>
                Sign up
            </Button>
            <div className="flex justify-center items-center gap-2 h-14 text-body-sm">
                <div className="text-gray-600">Already have an account?</div>
                <Link
                    className="font-medium text-primary-200 transition-colors hover:text-primary-300"
                    href="/auth/sign-in"
                >
                    Sign In
                </Link>
            </div>
        </>
    );
};

export default Start;
