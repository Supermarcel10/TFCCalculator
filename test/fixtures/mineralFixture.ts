import {Mineral, QuantifiedMineral} from "@/types";
import {faker} from "@faker-js/faker";
import {mineralUseCaseFixture} from "@test/fixtures/mineralUseCaseFixture";


export function mineralFixture(overrides? : Partial<Mineral>) {
	const defaults : Mineral = {
		name : faker.string.alphanumeric(),
		produces : faker.string.alphanumeric(),
		yield : faker.number.int(),
		uses : [mineralUseCaseFixture()]
	};

	return {...defaults, ...overrides};
}

export function mineralArrayFixture(length : number = 5) : Mineral[] {
	return Array.from({length}, () => mineralFixture());
}

export function quantifiedMineralFixture(overrides? : Partial<QuantifiedMineral>) : QuantifiedMineral {
	const defaultMineral : Mineral = mineralFixture();
	const defaultQuantity = faker.number.int();

	const defaults : QuantifiedMineral = {
		...defaultMineral,
		quantity : defaultQuantity
	};

	return {...defaults, ...overrides};
}

export function quantifiedMineralArrayFixture(length : number = 5) : QuantifiedMineral[] {
	return Array.from({length}, () => quantifiedMineralFixture());
}
