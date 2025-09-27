import {SmeltingComponent} from "@/types";
import {faker} from "@faker-js/faker";


export function smeltingComponentFixture(overrides? : Partial<SmeltingComponent>) : SmeltingComponent {
	const defaults : SmeltingComponent = {
		mineral : faker.string.alphanumeric(),
		min : faker.number.int(),
		max : faker.number.int()
	};

	return {...defaults, ...overrides};
}

export function smeltingComponentArrayFixture(length : number = 5) : SmeltingComponent[] {
	return Array.from({length}, () => smeltingComponentFixture());
}
