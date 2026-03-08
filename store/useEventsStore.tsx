import { create } from "zustand";

type Store = {
    isNewChat: boolean;
    newChat: () => void;
};

const useEventsStore = create<Store>()((set) => ({
    isNewChat: false,
    newChat: () => set({ isNewChat: true }),
}));

export default useEventsStore;
