import {
    Listbox,
    ListboxButton,
    ListboxOption,
    ListboxOptions,
    Label,
} from "@headlessui/react";
import Icon from "@/components/Icon";
import Image from "@/components/Image";

type SelectOption = {
    id: number;
    name: string;
    flag?: string;
};

type BaseSelectProps = {
    className?: string;
    classButton?: string;
    classOption?: string;
    label?: string;
    placeholder?: string;
    options: SelectOption[];
};

type SingleSelectProps = BaseSelectProps & {
    multiple?: false | undefined;
    value: SelectOption | null;
    onChange: (value: SelectOption | null) => void;
};

type MultipleSelectProps = BaseSelectProps & {
    multiple: true;
    value: SelectOption[] | null;
    onChange: (value: SelectOption[] | null) => void;
};

type SelectProps = SingleSelectProps | MultipleSelectProps;

const Select = (props: SelectProps) => {
    const { className, classButton, classOption, label, placeholder, options } =
        props;

    const isMultiple = "multiple" in props && props.multiple === true;

    const rawValue = props.value as SelectOption | SelectOption[] | null;
    const listboxValue = isMultiple
        ? Array.isArray(rawValue)
            ? rawValue
            : rawValue
            ? [rawValue]
            : []
        : Array.isArray(rawValue)
        ? rawValue[0] ?? null
        : rawValue;

    const isPlaceholder = isMultiple
        ? (listboxValue as SelectOption[]).length === 0
        : !(listboxValue as SelectOption | null);
    const displayText = isMultiple
        ? (listboxValue as SelectOption[]).length
            ? (listboxValue as SelectOption[]).map((o) => o.name).join(", ")
            : placeholder
        : (listboxValue as SelectOption | null)?.name ?? placeholder;

    return (
        <Listbox
            className={`${className || ""}`}
            value={listboxValue}
            onChange={(val) => {
                if ("multiple" in props && props.multiple) {
                    const next = Array.isArray(val)
                        ? (val as SelectOption[])
                        : (val as SelectOption | null)
                        ? [val as SelectOption]
                        : [];
                    (props as MultipleSelectProps).onChange(next);
                } else {
                    const next = Array.isArray(val)
                        ? (val[0] as SelectOption | undefined) ?? null
                        : (val as SelectOption | null) ?? null;
                    (props as SingleSelectProps).onChange(next);
                }
            }}
            as="div"
            multiple={isMultiple}
        >
            {label && (
                <Label className="block mb-1.5 text-body-sm font-medium text-gray-700">
                    {label}
                </Label>
            )}
            <ListboxButton
                className={`group flex justify-between items-center w-full h-10 px-4 border border-gray-100 rounded-lg font-medium text-sub-600 fill-gray-900 transition-all outline-0 data-[hover]:border-primary-200 data-[open]:border-primary-200 ${
                    classButton || ""
                }`}
            >
                {!isMultiple &&
                    listboxValue &&
                    !Array.isArray(listboxValue) &&
                    (listboxValue as SelectOption).flag && (
                        <Image
                            className="!w-5 mr-2 rounded-full opacity-100"
                            src={(listboxValue as SelectOption).flag as string}
                            width={20}
                            height={20}
                            alt={(listboxValue as SelectOption).name}
                        />
                    )}
                <div
                    className={`truncate ${
                        isPlaceholder ? "text-gray-400" : ""
                    }`}
                >
                    {displayText}
                </div>
                <Icon
                    className="shrink-0 ml-2 fill-inherit transition-transform group-[[data-open]]:rotate-180"
                    name="chevron"
                />
            </ListboxButton>
            <ListboxOptions
                className="z-100 [--anchor-gap:0.25rem] w-[var(--button-width)] bg-gray-0 border border-gray-100 shadow-lg rounded-lg overflow-hidden origin-top transition duration-200 ease-out outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
                anchor="bottom"
                transition
                modal={false}
            >
                {options.map((option) => (
                    <ListboxOption
                        className={`group relative pl-4 pr-3 py-1.5 truncate text-gray-900 font-medium cursor-pointer transition-colors data-[focus]:bg-gray-25 data-[selected]:bg-gray-50 not-last:mb-0.25 ${
                            classOption || ""
                        }`}
                        key={option.id}
                        value={option}
                    >
                        {option.flag && (
                            <Image
                                className="!w-5 mr-2 rounded-full opacity-100"
                                src={option.flag}
                                width={20}
                                height={20}
                                alt={option.name}
                            />
                        )}
                        {option.name}
                    </ListboxOption>
                ))}
            </ListboxOptions>
        </Listbox>
    );
};

export default Select;
