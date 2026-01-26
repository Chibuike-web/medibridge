import ReviewInfoExtractClient from "./review-info-extract-client";

export default function ReviewInfoExtract() {
	return (
		<div className="px-6 md:px-0">
			<div className="max-w-[800px] mx-auto py-8">
				<div className="max-w-[550px] mx-auto">
					<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] mt-10 mb-5">
						Review Extracted Patient Information
					</h1>
					<div className="text-center text-gray-600">
						<p>AI has parsed the document.</p>
						<p> Please review the extracted data before saving.</p>
					</div>

					<ReviewInfoExtractClient />
				</div>
			</div>
		</div>
	);
}
