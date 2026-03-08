import { useState } from "react";
import Icon from "@/components/Icon";

type FieldProps = {
    className?: string;
    classInput?: string;
    label?: string;
    textarea?: boolean;
    isSmall?: boolean;
};

const Field = ({
    className,
    classInput,
    label,
    textarea,
    type,
    ...inputProps
}: FieldProps &
    React.InputHTMLAttributes<HTMLInputElement> &
    React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
    const [showPassword, setShowPassword] = useState(false);

    const error = false;

    return (
        <div className={`${className || ""}`}>
            {label && (
                <div className="mb-1.5 text-body-sm font-medium text-gray-700">
                    {label}
                </div>
            )}
            <div className={`relative ${textarea ? "flex" : ""}`}>
                {textarea ? (
                    <textarea
                        className={`w-full h-24 px-3 border border-gray-100 rounded-lg text-gray-900 text-body-md transition-colors resize-none outline-0 placeholder:text-gray-400 focus:!border-primary-200 ${
                            error ? "!border-[#D73E3D]" : ""
                        } ${classInput || ""}`}
                        {...inputProps}
                    ></textarea>
                ) : (
                    <input
                        className={`w-full h-12 px-3 border border-gray-100 rounded-lg text-gray-900 text-body-md transition-colors outline-0 placeholder:text-gray-400 focus:!border-primary-200 ${
                            error ? "!border-[#D73E3D]" : ""
                        } ${classInput || ""}`}
                        type={
                            type === "password"
                                ? showPassword
                                    ? "text"
                                    : "password"
                                : type || "text"
                        }
                        {...inputProps}
                    />
                )}
                {type === "password" && (
                    <button
                        className={`group text-0 absolute right-3 top-1/2 -translate-y-1/2 outline-0 before:absolute before:top-[52%] before:left-[54%] before:w-6 before:h-1 before:border-t-2 before:border-gray-400 before:-translate-1/2 before:-rotate-45 before:transition-all hover:before:border-gray-900 ${
                            showPassword
                                ? "before:opacity-0"
                                : "before:opacity-100"
                        }`}
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        <Icon
                            className="!size-6 fill-gray-400 transition-colors group-hover:fill-gray-900"
                            name="eye"
                        />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Field;
