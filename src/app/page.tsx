import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
	return (
		<main className="flex flex-col xl:flex-row gap-x-[145px] gap-y-10 items-center max-w-[1440px] mx-auto justify-end">
			<div className="w-full xl:min-w-screen h-[500px] xl:h-screen">
				<Image
					src="/assets/hero-image.png"
					alt="african american physician discussing disease symptoms questionnaire with sick woman patient"
					width={1388}
					height={1024}
					className="w-full h-full object-cover xl:object-[500px]"
				/>
			</div>
			<div className="w-full sm:max-w-[700] xl:min-w-[500px] flex flex-col items-center px-6 xl:px-0">
				<span className="font-bold text-[1.5rem] leading-[1.2em] tracking-[-0.02em] text-gray-800">
					MediBridge
				</span>

				<h1 className="font-bold text-[56px] w-full text-gray-800 text-center leading-[1.2em] tracking-[-0.02em] mt-[100px]">
					Welcome to MediBridge
				</h1>
				<p className="text-gray-600 font-medium text-center leading-[1.4em] tracking-[-0.02em] text-lg mt-6 text-balance">
					Securely connect your institution to the MediBridge network.
				</p>
				<div className="flex flex-col gap-4 w-full mt-[100px] mb-[100px] xl:mb-0">
					<Button asChild className="h-11 w-full">
						<Link href="/info">Begin Registration</Link>
					</Button>

					<Button asChild className="h-11 w-full" variant="outline">
						<Link href="/login">Log in</Link>
					</Button>
				</div>
			</div>
		</main>
	);
}
