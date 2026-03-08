import { useState } from "react";
import {
    Listbox,
    ListboxButton,
    ListboxOption,
    ListboxOptions,
} from "@headlessui/react";
import Icon from "@/components/Icon";

const timeOptions = [
    {
        id: 0,
        name: "15s",
    },
    {
        id: 1,
        name: "30s",
    },
    {
        id: 2,
        name: "45s",
    },
    {
        id: 3,
        name: "60s",
    },
];

const Time = ({}) => {
    const [time, setTime] = useState(timeOptions[0]);

    return (
        <Listbox value={time} onChange={setTime}>
            <ListboxButton className="group flex items-center gap-2 h-8 px-4 border border-gray-100 rounded-lg shadow-[0_0.0625rem_0.125rem_0_rgba(13,13,18,0.06)] text-body-xs font-medium outline-0 transition-colors hover:bg-gray-25 max-md:hidden">
                <Icon className="fill-gray-500" name="clock" />
                {time.name}
                <Icon
                    className="fill-gray-500 transition-transform group-[[data-open]]:rotate-180"
                    name="chevron"
                />
            </ListboxButton>
            <ListboxOptions
                className="flex [--anchor-gap:0.5rem] origin-top z-20 flex-col w-(--button-width) bg-gray-0 border border-black/8 rounded-lg outline-0 shadow-[0_0.0625rem_0.25rem_0_rgba(0,0,0,0.16)] transition duration-200 ease-out overflow-hidden data-closed:scale-95 data-closed:opacity-0"
                anchor="bottom start"
                transition
                modal={false}
            >
                {timeOptions.map((time, index) => (
                    <ListboxOption
                        className="group flex justify-center items-center gap-2 px-4 py-2 cursor-pointer transition-colors hover:bg-gray-50 data-focus:!bg-gray-50"
                        key={index}
                        value={time}
                    >
                        <div className="text-body-xs font-medium">
                            {time.name}
                        </div>
                    </ListboxOption>
                ))}
            </ListboxOptions>
        </Listbox>
    );
};

export default Time;
