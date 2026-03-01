import { ReviewExtractedInfoClient } from "./review-extracted-info-client";

export default function ReviewExtractedInfo() {
	return (
		<main className="max-w-[600px] mx-auto min-h-dvh grid place-items-center my-10">
			<div className="w-full ">
				<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] mt-10 mb-5">
					Review Patient Information
				</h1>
				<div className="text-center mb-10 text-gray-600">
					<p className="text-balance">
						The documents have been processed. Please review the extracted details before saving.
					</p>
				</div>

				<ReviewExtractedInfoClient />
			</div>
		</main>
	);
}
