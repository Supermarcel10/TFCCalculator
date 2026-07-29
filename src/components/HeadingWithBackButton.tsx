import {useEffect, useState} from "react";
import {CaretCircleLeftIcon, CaretDownIcon} from "@phosphor-icons/react";
import {useRouter} from "next/navigation";
import {GlassButton} from "@/components/GlassButton";


interface DropdownOption {
	value : string;
	label : string;
}

interface DropdownConfig {
	options : DropdownOption[];
	selected : string;
	onChange : (value : string) => void;
	ariaLabel? : string;
}

interface HeadingWithButtonProps {
	title : string;
	subheading? : string;
	ariaPreviousScreenName? : string;
	handleBackURI : string;
	sticky? : boolean;
	className? : string;
	dropdown? : DropdownConfig;
}

export function HeadingWithBackButton(
		{
			title,
			subheading,
			ariaPreviousScreenName,
			handleBackURI,
			sticky = true,
			className,
			dropdown
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
		<div className={`mb-8 transition-all duration-200
				${isSticky ? "sticky top-0 z-50 py-4" : ""}`}
		>
			<div className={`${className} grid grid-cols-[1fr_auto_1fr] items-center`}>
				<GlassButton
						onClick={handleBack}
						className="justify-self-start p-2 bg-black/60"
						aria-label={ariaLabel}
					>
						<CaretCircleLeftIcon
							size={40}
							weight="bold"
							className="text-primary hover:text-teal-300 transition-colors duration-200"
							aria-hidden="true"
						/>
					</GlassButton>

				{dropdown ? (
					<div className="backdrop-blur bg-black/60 rounded-xl border border-gray-500/30
					                inline-flex items-center justify-self-center relative
					                hover:scale-105 text-primary hover:text-teal-300 transition-all duration-200">
						<span className="text-4xl font-bold pl-4 pr-3 py-2 pointer-events-none">
							{dropdown.options.find(o => o.value === dropdown.selected)?.label ?? title}
						</span>
						<CaretDownIcon
							size={24}
							weight="bold"
							className="mr-3 pointer-events-none"
							aria-hidden="true"
						/>
						<select
							value={dropdown.selected}
							onChange={(e) => dropdown.onChange(e.target.value)}
							className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
							aria-label={dropdown.ariaLabel ?? "Select metal"}
						>
							{dropdown.options.map(opt => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</div>
				) : (
					<h1 className="text-3xl font-bold text-primary text-center">
						{title}
					</h1>
				)}

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
