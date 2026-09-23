import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

if (typeof Element !== "undefined") {
	Element.prototype.scrollIntoView = () => {};
}

if (typeof HTMLElement !== "undefined") {
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.setPointerCapture = () => {};
	HTMLElement.prototype.releasePointerCapture = () => {};
}

afterEach(cleanup);
