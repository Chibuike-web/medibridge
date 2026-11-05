import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";
import { MotionGlobalConfig } from "motion/react";

MotionGlobalConfig.skipAnimations = true;
configure({ asyncUtilTimeout: 5000 });

if (typeof Element !== "undefined") {
	Element.prototype.scrollIntoView = () => {};
	window.scrollTo = () => {};
}

if (typeof HTMLElement !== "undefined") {
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.setPointerCapture = () => {};
	HTMLElement.prototype.releasePointerCapture = () => {};
}

afterEach(cleanup);

if (typeof window !== "undefined") {
	window.matchMedia = (query) =>
		({
			matches: false,
			media: query,
			addEventListener: () => {},
			removeEventListener: () => {},
		}) as unknown as MediaQueryList;
}
