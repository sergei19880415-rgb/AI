import { Checkbox as CheckboxHeadless } from "@headlessui/react";
import Icon from "@/components/Icon";

type CheckboxProps = {
    className?: string;
    classTick?: string;
    label?: string;
    checked: boolean;
    onChange: (value: boolean) => void;
};

const Checkbox = ({
    className,
    classTick,
    label,
    checked,
    onChange,
}: CheckboxProps) => (
    <CheckboxHeadless
        className={`group flex items-center gap-2 cursor-pointer ${
            className || ""
        }`}
        checked={checked}
        onChange={onChange}
    >
        <span
            className={`relative flex justify-center items-center shrink-0 size-5 bg-gray-0 rounded-md border border-gray-100 transition-colors group-data-[hover]:border-primary-200 group-data-[checked]:border-primary-200 group-data-[checked]:bg-primary-200 ${
                classTick || ""
            }`}
        >
            <Icon
                className="!size-3.5 fill-gray-0 opacity-0 transition-opacity group-data-[checked]:opacity-100"
                name="check"
            />
        </span>
        {label && <span className="text-body-sm text-gray-700">{label}</span>}
    </CheckboxHeadless>
);

export default Checkbox;
