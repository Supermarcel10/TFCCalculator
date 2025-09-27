import {MineralUseCase, QuantifiedMineral} from "@/types";
import {quantifiedMineralArrayFixture} from "@test/fixtures/mineralFixture";


export class AvailableMineralBuilder {
	private entries : Map<string, QuantifiedMineral[]> = new Map<string, QuantifiedMineral[]>();

	add(mineralType : string, yieldUnits : number, quantity : number) : this {
		const quantifiedMineral : QuantifiedMineral = {
			name : "",
			produces : mineralType,
			yield : yieldUnits,
			quantity : quantity,
			uses : [MineralUseCase.Vessel, MineralUseCase.Vessel]
		};

		return this.addType(mineralType, [quantifiedMineral]);
	}

	addVariants(mineralType : string, variants : number = 10, baseYield : number = 12, quantityEach : number = 60) : this {
		const minerals : QuantifiedMineral[] = new Array(variants);
		const incrementSequence = this.getFibonacciSequence(variants);

		for (let i = 0; i < variants; ++i) {
			minerals[i] = {
				name : "",
				produces : mineralType,
				yield : baseYield + incrementSequence[i],
				quantity : quantityEach,
				uses : [MineralUseCase.Vessel, MineralUseCase.Vessel]
			};
		}

		return this.addType(mineralType, minerals);
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

	private getFibonacciSequence(count : number) {
		const fib = [0, 1];
		for (let i = 2; i < count; ++i) {
			fib[i] = fib[i - 1] + fib[i - 2];
		}

		return fib.slice(0, count);
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