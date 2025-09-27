import {MineralUseCase} from "@/types";
import {faker} from "@faker-js/faker";


export function mineralUseCaseFixture() : MineralUseCase {
	const statuses = Object.values(MineralUseCase) as MineralUseCase[];
	return faker.helpers.arrayElement(statuses);
}
