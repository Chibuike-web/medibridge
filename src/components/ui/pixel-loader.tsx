function PixelLoader({ label }: { label: string }) {
	return (
		<svg
			data-slot="pixel-loader"
			viewBox="0 0 16 16"
			fill="currentColor"
			role="img"
			aria-label={label}
			className="size-4 [&_rect]:animate-pixel-pulse motion-reduce:[&_rect]:animate-none"
		>
			<rect x="1" y="1" width="4" height="4" />
			<rect x="6" y="1" width="4" height="4" style={{ animationDelay: "100ms" }} />
			<rect x="11" y="1" width="4" height="4" style={{ animationDelay: "200ms" }} />
			<rect x="1" y="6" width="4" height="4" style={{ animationDelay: "100ms" }} />
			<rect x="6" y="6" width="4" height="4" style={{ animationDelay: "200ms" }} />
			<rect x="11" y="6" width="4" height="4" style={{ animationDelay: "300ms" }} />
			<rect x="1" y="11" width="4" height="4" style={{ animationDelay: "200ms" }} />
			<rect x="6" y="11" width="4" height="4" style={{ animationDelay: "300ms" }} />
			<rect x="11" y="11" width="4" height="4" style={{ animationDelay: "400ms" }} />
		</svg>
	);
}

export { PixelLoader };
