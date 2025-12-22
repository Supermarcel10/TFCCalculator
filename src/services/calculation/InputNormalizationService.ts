import {QuantifiedMineral, SmeltingComponent} from "@/types";
import {IInputNormalizationService, NormalizedComponent} from "./abstract/IInputNormalizationService";


export class InputNormalizationService implements IInputNormalizationService {
	normalizeComponents(components : SmeltingComponent[]) : NormalizedComponent[] {
		return components.map((c) => ({
			component : this.normalizeKey(c.mineral),
			minPct : c.min,
			maxPct : c.max
		}));
	}

	normalizeInventory(inventory : Map<string, QuantifiedMineral[]>) : Map<string, QuantifiedMineral[]> {
		const out = new Map<string, QuantifiedMineral[]>();
		for (const [key, arr] of inventory) {
			const normKey = this.normalizeKey(key);
			const prev = out.get(normKey);
			out.set(normKey, prev ? prev.concat(arr) : arr);
		}
		return out;
	}

	normalizeKey(key : string) : string {
		return key.trim().toLowerCase();
	}
}
