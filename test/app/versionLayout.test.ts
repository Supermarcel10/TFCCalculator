import VersionLayout from "@/app/[type]/[id]/[version]/layout";


const NOT_FOUND = new Error("NEXT_NOT_FOUND");

jest.mock("next/navigation", () => ({
	notFound : jest.fn(() => {
		throw NOT_FOUND;
	})
}));

function renderLayout(type : string, id : string, version : string) {
	return VersionLayout({
		children : "child",
		params : Promise.resolve({type, id, version})
	});
}

describe("VersionLayout", () => {
	it("renders children for a known version", async () => {
		await expect(renderLayout("modpack", "terrafirmagreg", "1.20.x_0.10.5")).resolves.toBe("child");
	});

	it.each([
		["modpack", "terrafirmagreg", "1.20.x_0.10.x"],
		["modpack", "terrafirmagreg", "1.20.x_0.10.2"],
		["foo", "terrafirmagreg", "1.20.x_0.10.5"]
	])("triggers not found for /%s/%s/%s", async (type, id, version) => {
		await expect(renderLayout(type, id, version)).rejects.toBe(NOT_FOUND);
	});
});
