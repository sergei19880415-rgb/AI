type Props = {
    title: string;
    description: string;
    children: React.ReactNode;
};

const Line = ({ title, description, children }: Props) => (
    <div className="flex justify-between items-center gap-4">
        <div className="grow">
            <div className="font-medium">{title}</div>
            <div className="mt-1 text-gray-500">{description}</div>
        </div>
        <div className="shrink-0">{children}</div>
    </div>
);

export default Line;
