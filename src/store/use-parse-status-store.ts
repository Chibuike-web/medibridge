import { create } from "zustand";

type ParseStatus = "idle" | "parsing" | "success" | "error";

type ParseStatusState = {
	parseStatus: ParseStatus;
	setParseStatus: (status: ParseStatus) => void;
};

const useParseStatusStore = create<ParseStatusState>((set) => ({
	parseStatus: "idle",
	setParseStatus: (status) => set({ parseStatus: status }),
}));

export const useParseStatus = () => {
	const parseStatus = useParseStatusStore((state) => state.parseStatus);
	const setParseStatus = useParseStatusStore((state) => state.setParseStatus);
	return {
		parseStatus,
		setParseStatus,
	};
};
