import { NextResponse } from "next/server";
import gameVersionJson from "@/data/gameversions.json";
import {BaseGameVersion, GameVersions, VersionType} from "@/types/gameversions";
import {notFound} from "next/navigation";


export type ApiResponse = Record<string, number>;

interface RouteContext {
	params : Promise<{
		type : string;
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
  const versionType = type as VersionType;

	const resource = (data[versionType] ?? [])
			.find(item => filterVersionAndId(item, id, version));

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
	const isSameId = baseGameVersion.id == id;

	const versionsSplit = versions.split("_", 2);
	const isSameGameVersion = baseGameVersion.gameVersion == versionsSplit[0];
	const isSameResourceVersion = baseGameVersion.version == versionsSplit[1];

	return isSameId && isSameGameVersion && isSameResourceVersion;
}
