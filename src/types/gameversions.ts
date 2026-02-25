export type VersionType = "mod" | "modpack";

export interface BaseGameVersion {
	id : string;
	displayName : string;
	version : string;
	gameVersion : string;
	constants : Record<string, number>;
	supported : boolean;
}

export interface GameVersions {
	modpack : BaseGameVersion[];
	mod : BaseGameVersion[];
	lastUpdated : string;
	version : string;
	schemaVersion : string;
}

export interface RouteParams {
	type : string;
	id : string;
	version : string;
}
