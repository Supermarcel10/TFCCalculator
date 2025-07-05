import { NextResponse } from "next/server";
import gameVersionJson from "@/data/gameversions.json";
import {BaseGameVersion, GameVersions, VersionType} from "@/types/gameversions";
import {notFound} from "next/navigation";


export type ApiResponse = Record<string, number>;

interface RouteContext {
	params : Promise<{
		type : VersionType;
		id : string;
		version : string;
	}>;
}

export async function GET(
		_ : Request,
		context : RouteContext
) {
	const {type, id, version} = await context.params;
	const data = gameVersionJson as GameVersions;

	let resource = (data[type] as BaseGameVersion[])
			.filter(item => filterVersionAndId(item, id, version))
			.pop();

	if (resource == undefined) {
		return notFound();
	}

	return NextResponse.json(resource.constants);
}

function filterVersionAndId(
		baseGameVersion: BaseGameVersion,
		id: string,
		versions: string
) {
	let isSameId = baseGameVersion.id == id;

	let versionsSplit = versions.split("_", 2);
	let isSameGameVersion = baseGameVersion.gameVersion == versionsSplit[0];
	let isSameResourceVersion = baseGameVersion.version == versionsSplit[1];

	return isSameId && isSameGameVersion && isSameResourceVersion;
}