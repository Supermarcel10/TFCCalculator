import { NextResponse } from "next/server";
import gameVersionJson from "@/data/gameversions.json";
import { GameVersions, ModpackVersion, ModVersion } from "@/types/gameversions";

export async function GET() {
	const data = gameVersionJson as GameVersions;

	const modpack = data.modpack
		// Filter out unsupported versions
		.filter(item => item.supported)
		// Combine on displayName into a list of versions
		.reduce((acc, item) => {
			const key = item.displayName;
			acc[key] = acc[key] || [];
			acc[key].push(item);
			return acc;
		}, {} as Record<string, ModpackVersion[]>);

	const mod = data.mod
		// Filter out unsupported versions
		.filter(item => item.supported)
		// Combine on displayName into a list of versions
		.reduce((acc, item) => {
			const key = item.displayName;
			acc[key] = acc[key] || [];
			acc[key].push(item);
			return acc;
		}, {} as Record<string, ModVersion[]>);

	const filtered = {
		modpack,
		mod,
		lastUpdated: data.lastUpdated,
		version: data.version,
		schemaVersion: data.schemaVersion
	};

	return NextResponse.json(filtered);
}