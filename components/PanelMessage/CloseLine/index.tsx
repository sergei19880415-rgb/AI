import Icon from "@/components/Icon";

type Props = {
    title: string;
    onClose: () => void;
};

const CloseLine = ({ title, onClose }: Props) => (
    <div className="absolute bottom-[calc(100%-0.75rem)] left-0 right-0 flex items-center gap-2 px-2 pt-2.5 pb-5.5 rounded-t-xl bg-gray-50 shadow-[0_3rem_6.25rem_0_rgba(17,12,46,0.15)]">
        <button
            className="text-0 rounded-full transition-colors hover:bg-gray-0"
            onClick={onClose}
        >
            <Icon name="close" />
        </button>
        <div className="text-body-sm">{title}</div>
    </div>
);

export default CloseLine;
