import {
    Dialog,
    DialogPanel,
    DialogBackdrop,
    CloseButton,
} from "@headlessui/react";
import Icon from "@/components/Icon";

type ModalProps = {
    classWrapper?: string;
    classButtonClose?: string;
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
};

const Modal = ({
    classWrapper,
    classButtonClose,
    open,
    onClose,
    children,
}: ModalProps) => {
    return (
        <Dialog className="relative z-50" open={open} onClose={onClose}>
            <DialogBackdrop
                className="fixed inset-0 bg-[#1B1B1B]/90 backdrop-blur-sm duration-300 ease-out data-[closed]:opacity-0"
                transition
            />
            <div className="fixed inset-0 flex p-4 overflow-y-auto">
                <DialogPanel
                    className={`w-full m-auto duration-300 ease-out data-[closed]:opacity-0 ${
                        classWrapper || ""
                    }`}
                    transition
                >
                    {children}
                    <CloseButton
                        className={`group absolute top-12 right-12 z-15 size-16 bg-gray-0 rounded-full text-0 transition-colors hover:bg-gray-25 max-lg:top-8 max-lg:right-8 max-md:top-4 max-md:right-4 max-md:!size-12 ${
                            classButtonClose || ""
                        }`}
                    >
                        <Icon
                            className="!size-7 fill-gray-500 transition-colors group-hover:fill-gray-900 max-md:!size-5.5"
                            name="close"
                        />
                    </CloseButton>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default Modal;
