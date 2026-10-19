import {isKnownVersionRoute} from "@/functions/gameVersions";
import {GameVersions} from "@/types/gameversions";


const baseVersion = {
	displayName : "Test",
	constants : {ingot : 144},
	supported : true
};

const gameVersions : GameVersions = {
	modpack : [
		{...baseVersion, id : "terrafirmagreg", version : "0.10.6+", gameVersion : "1.20.x"},
		{...baseVersion, id : "terrafirmagreg", version : "0.10.5", gameVersion : "1.20.x"}
	],
	mod : [
		{...baseVersion, id : "terrafirmacraft", version : "3.2.12", gameVersion : "1.20.1"}
	],
	lastUpdated : "2025-05-23",
	version : "1.1.1",
	schemaVersion : "1"
};

describe("isKnownVersionRoute", () => {
	it.each([
		["modpack", "terrafirmagreg", "1.20.x_0.10.5"],
		["modpack", "terrafirmagreg", "1.20.x_0.10.6+"],
		["modpack", "terrafirmagreg", "1.20.x_0.10.6%2B"],
		["mod", "terrafirmacraft", "1.20.1_3.2.12"]
	])("accepts known route /%s/%s/%s", (type, id, version) => {
		expect(isKnownVersionRoute(gameVersions, type, id, version)).toBe(true);
	});

	it.each([
		["modpack", "terrafirmagreg", "1.20.x_0.10.x"],
		["modpack", "terrafirmagreg", "1.20.x_0.10.2"],
		["modpack", "unknownpack", "1.20.x_0.10.5"],
		["mod", "terrafirmagreg", "1.20.x_0.10.5"],
		["foo", "terrafirmagreg", "1.20.x_0.10.5"],
		["lastUpdated", "terrafirmagreg", "1.20.x_0.10.5"],
		["modpack", "terrafirmagreg", ""],
		["modpack", "terrafirmagreg", "%E0%A4%A"]
	])("rejects unknown route /%s/%s/%s", (type, id, version) => {
		expect(isKnownVersionRoute(gameVersions, type, id, version)).toBe(false);
	});
});
