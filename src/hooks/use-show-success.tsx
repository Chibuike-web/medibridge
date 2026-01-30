import { useState } from "react";

export function useShowSuccess() {
	const [showSuccess, setShowSuccess] = useState(true);

	return {
		showSuccess,
		setShowSuccess,
	};
}
