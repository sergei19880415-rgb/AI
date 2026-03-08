import Image from "@/components/Image";

type TabItem = {
    id: number;
    name: string;
    sale?: string;
    onClick?: () => void;
};

type Props = {
    className?: string;
    items: TabItem[];
    value: TabItem;
    setValue: (value: TabItem) => void;
};

const Tabs = ({ className, items, value, setValue }: Props) => {
    return (
        <div
            className={`p-0.25 border border-[#E6E6E6] bg-[#F7F7F7] rounded-lg ${
                className || ""
            }`}
        >
            <div className="relative flex">
                <div
                    className={`absolute top-0 left-0 bottom-0 rounded-md bg-gray-0 shadow-[0_0.0625rem_0.1875rem_0_rgba(0,0,0,0.07)] duration-300 outline-0 transition-transform ${
                        items.length === 3 ? "w-1/3" : "w-1/2"
                    } ${value.id === items[1].id ? "translate-x-full" : ""}`}
                ></div>
                {items.map((item) => (
                    <button
                        className={`relative z-1 flex-1 h-9 text-body-sm font-medium transition-colors hover:text-gray-800 ${
                            value.id === item.id
                                ? "text-gray-800"
                                : "text-gray-500"
                        }`}
                        key={item.id}
                        onClick={() => {
                            setValue(item);
                            item.onClick?.();
                        }}
                    >
                        {item.name}
                        {item.sale && (
                            <div className="absolute top-[calc(100%-0.125rem)] left-1/2 -translate-x-1/2 bg-primary-200 shadow-[0_0.0625rem_0.125rem_0_rgba(17,17,19,0.08)] text-gray-0 text-body-xs font-medium px-3 py-0.5 rounded-full pointer-events-none">
                                {item.sale}
                                <Image
                                    className="absolute bottom-[calc(100%-0.25rem)] left-1/2 -translate-x-1/2 w-3 opacity-100"
                                    src="/images/triangle.svg"
                                    width={11}
                                    height={9}
                                    alt=""
                                />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Tabs;
