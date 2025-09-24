import React, {useEffect, useState} from "react";
import {CaretCircleLeftIcon} from "@phosphor-icons/react";
import {useRouter} from "next/navigation";


interface HeadingWithButtonProps {
	title : string;
	subheading? : string;
	ariaPreviousScreenName? : string;
	handleBackURI : string;
	sticky? : boolean;
	className? : string;
}

export function HeadingWithBackButton(
		{
			title,
			subheading,
			ariaPreviousScreenName,
			handleBackURI,
			sticky = true,
			className
		} : Readonly<HeadingWithButtonProps>) {
	const router = useRouter();
	const [isSticky, setIsSticky] = useState(false);

	useEffect(() => {
		if (!sticky) return;

		const handleScroll = () => {
			setIsSticky(window.scrollY > 50);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	});

	const previousScreenName = ariaPreviousScreenName ? `to ${ariaPreviousScreenName}` : "";
	const ariaLabel = `Return ${previousScreenName}`;

	const handleBack = () => {
		router.push(handleBackURI);
	};

	return (
			<div className={`mb-8 bg-background transition-all duration-200
					${isSticky ? "sticky top-0 z-50 shadow-md py-4" : ""}`}
			>
				<div className={`${className} grid grid-cols-[1fr_auto_1fr] items-center`}>
					<button
							onClick={handleBack}
							className="justify-self-start"
							aria-label={ariaLabel}
					>
						<CaretCircleLeftIcon
								size={40}
								weight="bold"
								className="text-primary hover:text-teal-300 transition-colors duration-200"
								aria-hidden="true"
						/>
					</button>

					<h1 className="text-3xl font-bold text-primary text-center">
						{title}
					</h1>

					{/* Right spacer */}
					<div aria-hidden="true"/>
				</div>

				{subheading && (
						<h2 className="text-sm text-gray-400 text-center">
							{subheading}
						</h2>
				)}
			</div>
	);
}
