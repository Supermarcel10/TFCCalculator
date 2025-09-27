import {faker} from "@faker-js/faker";
import {QuantifiedMineral} from "@/types";
import {quantifiedMineralArrayFixture} from "@test/fixtures/mineralFixture";


export function availableMineralsFixture(
		producedCount : number = 3,
		mineralsPerProduced : number = 2
) : Map<string, QuantifiedMineral[]> {
	const mineralsMap = new Map<string, QuantifiedMineral[]>();

	for (let i = 0; i < producedCount; i++) {
		const producedKey = faker.string.alphanumeric();
		const minerals = quantifiedMineralArrayFixture(mineralsPerProduced);

		mineralsMap.set(producedKey, minerals);
	}

	return mineralsMap;
}