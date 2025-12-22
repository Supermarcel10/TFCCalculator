import {MineralUseCase, QuantifiedMineral, SmeltingComponent} from "@/types";


/**
 * Builder for QuantifiedInputMineral
 *
 * calculateSmeltingOutput() expects a Map<string, QuantifiedMineral[]>
 * and each QuantifiedMineral has { name, produces, yield, quantity, uses? }
 * Writing this by hand in every test is inefficient, so use a builder
 * with "produces" normalized to lowercase
 * and "uses" defaulting to a harmless array
 */
export const createQuantifiedMineral = (
		name : string,
		produces : string,
		yieldUnits : number,
		quantity : number
) : QuantifiedMineral => ({
	name,
	produces : produces.trim().toLowerCase(),
	yield : yieldUnits,
	quantity,
	uses : [MineralUseCase.Vessel, MineralUseCase.Crucible]
});

export const createComponent = (
		mineral : string,
		min : number,
		max : number
) : SmeltingComponent => ({
	mineral,
	min,
	max
});


export function expectUsedToNotExceedAvailable(
		availableMinerals : Map<string, QuantifiedMineral[]>,
		usedMinerals : QuantifiedMineral[]
) {
	const mineralNames = [...new Set(availableMinerals.keys())];

	for (const mineralName of mineralNames) {
		const used = usedMinerals
				.filter(m => m.name.includes(mineralName))
				.reduce((sum, m) => sum + m.quantity, 0);

		const available = availableMinerals
				.get(mineralName)!
				.reduce((sum, m) => sum + m.quantity, 0);

		expect(used).toBeLessThanOrEqual(available);
	}
}

