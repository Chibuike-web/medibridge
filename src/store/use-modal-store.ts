import { create } from "zustand";

type ModalStoreType = {
	isOpen: boolean;
	setIsOpen: (value: boolean) => void;
	toggle: () => void;
};

const useModalStore = create<ModalStoreType>((set) => ({
	isOpen: false,
	setIsOpen: (value: boolean) => set({ isOpen: value }),
	toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));

export const useModal = () => {
	const isOpen = useModalStore((s) => s.isOpen);
	const setIsOpen = useModalStore((s) => s.setIsOpen);
	const toggle = useModalStore((s) => s.toggle);

	return {
		isOpen,
		setIsOpen,
		toggle,
	};
};
