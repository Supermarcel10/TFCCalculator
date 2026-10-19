import React from "react";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {capitaliseFirstLetterOfEachWord} from "@/functions/utils";
import {isKnownVersionRoute} from "@/functions/gameVersions";
import gameVersions from "@/data/gameversions.json";


type ParamProps = {
	params: Promise<{
		type: string;
		id: string;
		version: string;
		metal?: string;
	}>;
};

export async function generateMetadata({params} : ParamProps) : Promise<Metadata> {
	const {metal} = await params;
	const metalName = metal ? capitaliseFirstLetterOfEachWord(metal) : null;

	const baseTitle = "TerraFirmaCraft Metal Calculator";
	const shortHandTitle = "TFC Metal Calculator";
	const title = metalName
	              ? `${metalName} - ${shortHandTitle}`
	              : baseTitle;

	const baseDescription = "A simple website to calculate minerals required for metal compositions!";
	const description = metalName
	                    ? `Calculate the mineral requirements for ${metalName}.`
	                    : baseDescription;

	return {
		title,
		description,
		openGraph : {
			title,
			description,
			url : "https://tfc-calculator.devmarcel.net/",
			siteName : "TerraFirmaCraft Metal Calculator",
			images : [
				{
					url : "/api/og",
					width : 1200,
					height : 630,
					alt : "TFC Metal Calculator Cover"
				}
			],
			locale : "en_US",
			type : "website"
		},
		twitter : {
			card : "summary_large_image",
			title,
			description,
			images : ["/api/og"]
		}
	};
}

export default async function VersionLayout(
		{
			children,
			params
		} : {
			children : React.ReactNode;
			params : ParamProps['params'];
		}) {
	const {type, id, version} = await params;
	if (!isKnownVersionRoute(gameVersions, type, id, version)) notFound();

	return children;
}