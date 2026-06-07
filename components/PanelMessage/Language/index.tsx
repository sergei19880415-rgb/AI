const RussianFlag = () => (
    <span
        className="inline-flex h-[14px] w-[22px] shrink-0 flex-col overflow-hidden rounded-[3px] border border-gray-200 shadow-[0_0.0625rem_0.125rem_0_rgba(13,13,18,0.08)]"
        aria-hidden="true"
    >
        <span className="h-1/3 bg-white" />
        <span className="h-1/3 bg-[#0039A6]" />
        <span className="h-1/3 bg-[#D52B1E]" />
    </span>
);

const Language = ({}) => {
    return (
        <div
            className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#1B1B1B]/8 bg-gray-0 px-2.5 text-[12px] font-semibold leading-none text-gray-600 shadow-[0_0.0625rem_0.125rem_0_rgba(0,0,0,0.08)] max-md:hidden"
            aria-label="Язык интерфейса: русский"
        >
            <RussianFlag />
            <span>RU</span>
        </div>
    );
};

export default Language;
