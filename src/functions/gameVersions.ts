import {GameVersions, VersionType} from "@/types/gameversions";


const VERSION_TYPES : readonly VersionType[] = ["mod", "modpack"];

export function isKnownVersionRoute(
		gameVersions : GameVersions,
		type : string,
		id : string,
		version : string
) : boolean {
	if (!VERSION_TYPES.includes(type as VersionType)) {
		return false;
	}

	let decodedVersion : string;
	try {
		decodedVersion = decodeURIComponent(version);
	} catch {
		return false;
	}

	return gameVersions[type as VersionType].some(entry =>
			entry.id === id && `${entry.gameVersion}_${entry.version}` === decodedVersion
	);
}
