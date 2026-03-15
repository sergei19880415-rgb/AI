import Image from "@/components/Image";

const NoArchivedChat = ({}) => (
    <div className="pt-18 pb-10 text-center">
        <Image
            className="w-20 mb-3"
            src="/images/empty-box.svg"
            width={80}
            height={80}
            alt=""
        />
        <div className="mb-2 font-medium text-gray-700">Архив пуст</div>
        <div className="text-body-sm text-gray-500">
            У вас пока нет архивных чатов
        </div>
    </div>
);

export default NoArchivedChat;