type Props = {
    title: string;
    children: React.ReactNode;
};

const TabContainer = ({ title, children }: Props) => (
    <div className="">
        <div className="p-2 text-h5 max-md:px-0">{title}</div>
        <div className="flex flex-col gap-5 mt-1 px-6 py-7 border-t border-gray-100 max-md:px-0 max-md:py-3">
            {children}
        </div>
    </div>
);

export default TabContainer;
