import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import heroImage from "../../../public/assets/hero-image.png";

export const metadata = {
	title: "Home",
};

export default function Home() {
	return (
		<main className="flex flex-col xl:flex-row gap-y-10 items-center w-full justify-center">
			<div className="w-full h-[31.25rem] xl:h-screen">
				<Image
					src={heroImage}
					alt="african american physician discussing disease symptoms questionnaire with sick woman patient"
					className="w-full h-full object-cover"
					loading="lazy"
					placeholder="blur"
					sizes="(max-width: 80rem) 100vw, 50vw"
				/>
			</div>
			<div className="w-full sm:w-[31.25rem] flex shrink-0 flex-col items-center mx-6 xl:mx-40">
				<span className="font-bold text-xl leading-[1.2em] tracking-[-0.02em] text-gray-800">
					MediBridge
				</span>

				<h1 className="mt-[6.25rem] w-full text-center text-xl font-bold leading-[1.2em] tracking-[-0.02em] text-gray-800">
					Welcome to MediBridge
				</h1>
				<p className="text-gray-600 font-medium text-center leading-[1.4em] tracking-[-0.02em] text-lg mt-6 text-balance">
					Securely connect your institution to the MediBridge network.
				</p>
				<div className="flex flex-col gap-4 w-full mt-[6.25rem] mb-[6.25rem] xl:mb-0">
					<Button asChild className="w-full text-sm">
						<Link href="/owner">Begin Registration</Link>
					</Button>

					<Button asChild className="w-full text-sm" variant="outline">
						<Link href="/sign-in">Sign in</Link>
					</Button>
				</div>
			</div>
		</main>
	);
}
