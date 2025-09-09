"use client";

import {useParams} from "next/navigation";
import {MetalComponentDisplay} from "@/components/MetalComponentDisplay";
import {HeadingWithBackButton} from "@/components/HeadingWithBackButton";
import {replaceUnderscoreWithSpace} from "@/functions/utils";


export default function MetalPage() {
	const {type, id, version, metal} = useParams();
	if (metal == null) return;

	const metalString = Array.isArray(metal) ? metal.join(',') : metal;

	const versionsSplit = decodeURIComponent(version as string).split("_", 2);
	const subheadingString = `${decodeURIComponent(id as string)} ${versionsSplit[1]}`;

	return (
			<main
					className="container mx-auto px-4 py-8"
					role="main"
					aria-label="Metal Calculator"
			>
				<div className="max-w-6xl mx-auto">
					<HeadingWithBackButton
							title={replaceUnderscoreWithSpace(metalString).toUpperCase()}
							subheading={subheadingString}
							ariaPreviousScreenName="metal selection"
							handleBackURI={`/${type}/${id}/${version}/metals`}
					/>

					<MetalComponentDisplay metal={metalString} />
				</div>
			</main>
	);
}
