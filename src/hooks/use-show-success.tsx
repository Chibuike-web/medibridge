import { useState } from "react";

export function useShowSuccess() {
	const [showSuccess, setShowSuccess] = useState(false);

	return {
		showSuccess,
		setShowSuccess,
	};
}
