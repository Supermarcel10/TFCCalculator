"use client";

import {useParams, useRouter} from "next/navigation";
import {MetalComponentDisplay} from "@/components/MetalComponentDisplay";
import {HeadingWithBackButton} from "@/components/HeadingWithBackButton";
import {replaceUnderscoreWithSpace} from "@/functions/utils";
import {SmeltingOutput} from "@/types";
import {useCallback, useEffect, useState} from "react";


export default function MetalPage() {
	const router = useRouter();
	const {type, id, version, metal} = useParams();
	if (metal == null) return;

	const metalString = Array.isArray(metal) ? metal.join(',') : metal;

	const versionsSplit = decodeURIComponent(version as string).split("_", 2);
	const subheadingString = `${decodeURIComponent(id as string)} ${versionsSplit[1]}`;

	const [metals, setMetals] = useState<SmeltingOutput[]>([]);

	useEffect(() => {
		fetch(`/api/${type}/${id}/${version}/metal`)
			.then(response => {
				if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
				return response.json();
			})
			.then(data => setMetals(data))
			.catch(error => console.error("Error fetching metals:", error));
	}, [type, id, version]);

	const handleMetalChange = useCallback((value : string) => {
		router.push(`/${type}/${id}/${version}/${value}`);
	}, [router, type, id, version]);

	const dropdownOptions = metals
		.map(m => ({
			value: m.name,
			label: replaceUnderscoreWithSpace(m.name).toUpperCase()
		}))
		.sort((a, b) => a.label.localeCompare(b.label));

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
							dropdown={{
								options: dropdownOptions,
								selected: metalString,
								onChange: handleMetalChange
							}}
					/>

					<MetalComponentDisplay metal={metalString} />
				</div>
			</main>
	);
}
