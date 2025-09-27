import {MineralUseCase, QuantifiedMineral} from "@/types";
import {quantifiedMineralArrayFixture} from "@test/fixtures/mineralFixture";


export class AvailableMineralBuilder {
	private entries : Map<string, QuantifiedMineral[]> = new Map<string, QuantifiedMineral[]>();

	add(mineralType : string, yieldUnits : number, quantity : number) : this {
		const quantifiedMineral : QuantifiedMineral = {
			name : "",
			produces : mineralType,
			yield : yieldUnits,
			quantity,
			uses : [MineralUseCase.Vessel, MineralUseCase.Vessel]
		};

		return this.addType(mineralType, [quantifiedMineral]);
	}

	addNoise(amount : number = 50) : this {
		const minerals : QuantifiedMineral[] = quantifiedMineralArrayFixture(amount);
		return this.addType("noise", minerals);
	}

	build() {
		const m = new Map<string, QuantifiedMineral[]>();
		for (const [type, arr] of this.entries) {
			m.set(type.toLowerCase(), arr);
		}
		return m;
	}

	private addType(mineralType : string, minerals : QuantifiedMineral[]) : this {
		const mineralEntry = this.entries.get(mineralType);
		if (mineralEntry == null) {
			this.entries.set(mineralType, minerals);
		} else {
			const newMinerals = mineralEntry.concat(minerals);
			this.entries.set(mineralType, newMinerals);
		}

		return this;
	}

	static create() : AvailableMineralBuilder {
		return new AvailableMineralBuilder();
	}
}