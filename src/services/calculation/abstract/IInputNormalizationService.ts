import {QuantifiedMineral, SmeltingComponent} from "@/types";


export type NormalizedComponent = {
	component : string;
	minPct : number;
	maxPct : number;
};

export interface IInputNormalizationService {
	normalizeComponents(components : SmeltingComponent[]) : NormalizedComponent[];

	normalizeInventory(inventory : Map<string, QuantifiedMineral[]>) : Map<string, QuantifiedMineral[]>;

	normalizeKey(key : string) : string;
}
