import { useState } from "react";

export function useShowSuccess() {
	const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

	return {
		isSuccessModalOpen,
		setIsSuccessModalOpen,
	};
}
