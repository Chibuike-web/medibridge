import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { MotionGlobalConfig } from "motion/react";

MotionGlobalConfig.skipAnimations = true;

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
