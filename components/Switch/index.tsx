import { Switch as HeadlessSwitch } from "@headlessui/react";

type SwitchProps = {
    className?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
};

const Switch = ({ className, checked, onChange }: SwitchProps) => (
    <HeadlessSwitch
        className={`group shrink-0 flex w-11 h-6 p-0.5 rounded-full bg-gray-50 transition-colors data-[hover]:bg-gray-100 data-[checked]:!bg-primary-200 data-[hover]:data-[checked]:!bg-primary-300 ${
            className || ""
        }`}
        checked={checked}
        onChange={onChange}
    >
        <span
            className={`relative size-5 rounded-full bg-gray-0 shadow-[0_0.0625rem_0.1875rem_0_rgba(16,24,40,0.1),0_0.0625rem_0.125rem_0_rgba(16,24,40,0.06)] transition-transform  group-data-[checked]:translate-x-5`}
        />
    </HeadlessSwitch>
);

export default Switch;
