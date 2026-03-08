import React from "react";
import Link, { LinkProps } from "next/link";
import Icon from "@/components/Icon";

type CommonProps = {
    className?: string;
    icon?: string;
    children?: React.ReactNode;
    isPrimary?: boolean;
    isSecondary?: boolean;
    isTransparent?: boolean;
    isRed?: boolean;
    isMedium?: boolean;
    isSmall?: boolean;
    isXSmall?: boolean;
};

type ButtonAsButton = {
    as?: "button";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

type ButtonAsAnchor = {
    as: "a";
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

type ButtonAsLink = {
    as: "link";
} & LinkProps;

type ButtonProps = CommonProps &
    (ButtonAsButton | ButtonAsAnchor | ButtonAsLink);

const Button: React.FC<ButtonProps> = ({
    className,
    icon,
    children,
    isPrimary,
    isSecondary,
    isTransparent,
    isRed,
    isMedium,
    isSmall,
    isXSmall,
    as = "button",
    ...props
}) => {
    const isLink = as === "link";
    const Component: React.ElementType = isLink ? Link : as;

    return (
        <Component
            className={`inline-flex items-center justify-center gap-2 h-13 px-4 rounded-lg text-body-md font-medium transition-all cursor-pointer disabled:pointer-events-none ${
                isPrimary
                    ? "bg-primary-200 text-gray-0 fill-gray-0 shadow-[inset_0_-0.125rem_0_0_#722BDD,inset_0_0.125rem_0_0_#9C60F6] hover:bg-primary-300 hover:shadow-[inset_0_-0.125rem_0_0_#3A186F,inset_0_0.125rem_0_0_#623A9E]"
                    : ""
            } ${
                isSecondary
                    ? "bg-gray-0 fill-gray-900 shadow-[inset_0_0_0_0.0625rem_#DFE1E7,0_0.0625rem_0.125rem_0_rgba(13,13,18,0.06)] hover:bg-gray-25"
                    : ""
            } ${
                isTransparent
                    ? "bg-transparent fill-gray-900 hover:bg-gray-25"
                    : ""
            } ${
                isRed
                    ? "bg-[#D73E3D] text-gray-0 fill-gray-0 shadow-[inset_0_0_0_0.0625rem_rgba(255,255,255,.15),0_0_0_0.125rem_#8F2929] hover:bg-[#8F2929]"
                    : ""
            } ${isMedium ? "!h-11" : ""} ${
                isSmall ? "!h-10 !text-body-sm" : ""
            } ${isXSmall ? "!h-8 !text-body-xs" : ""} ${className || ""}`}
            {...(isLink ? (props as LinkProps) : props)}
        >
            {icon && (
                <Icon
                    className={`fill-inherit ${
                        !isSmall && !isXSmall ? "!size-5" : ""
                    }`}
                    name={icon}
                />
            )}
            {children}
        </Component>
    );
};

export default Button;
