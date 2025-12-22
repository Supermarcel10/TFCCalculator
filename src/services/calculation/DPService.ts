import {QuantifiedMineral} from "@/types";
import {IChunkingService} from "./abstract/IChunkingService";
import {ComponentDP, IDPService} from "@/services/calculation/abstract/IDPService";


export class DPService implements IDPService {
	constructor(private chunkingService : IChunkingService) {}

	buildComponentDP(component : string, minerals : QuantifiedMineral[], cap : number) : ComponentDP {
		const chunks = this.chunkingService.splitAllIntoChunks(minerals, cap);

		const reachable = new Uint8Array(cap + 1);
		reachable[0] = 1;

		const prevSum = new Int32Array(cap + 1);
		const lastChunkIndex = new Int32Array(cap + 1);
		prevSum.fill(-1);
		lastChunkIndex.fill(-1);

		for (let i = 0; i < chunks.length; i++) {
			const weight = Math.trunc(chunks[i].weight);
			if (weight <= 0 || weight > cap) {
				continue;
			}

			for (let sumBefore = cap - weight; sumBefore >= 0; sumBefore--) {
				const sumAfter = sumBefore + weight;
				if (reachable[sumBefore] && !reachable[sumAfter]) {
					reachable[sumAfter] = 1;
					prevSum[sumAfter] = sumBefore;
					lastChunkIndex[sumAfter] = i;
				}
			}
		}

		return {component, cap, reachable, prevSum, lastChunkIndex, chunks};
	}

	reconstructMinerals(dp : ComponentDP, targetSum : number) : QuantifiedMineral[] {
		const used = new Map<string, QuantifiedMineral>();
		let sum = targetSum;

		while (sum > 0) {
			const i = dp.lastChunkIndex[sum];
			if (i < 0) {
				break;
			}

			const chunk = dp.chunks[i];
			const m = chunk.qm;
			const key = m.name;
			const existing = used.get(key);

			if (existing) {
				existing.quantity += chunk.qty;
			} else {
				used.set(key, {
					name : key,
					produces : m.produces,
					yield : m.yield,
					uses : m.uses,
					quantity : chunk.qty
				});
			}

			sum = dp.prevSum[sum];
		}

		return Array.from(used.values());
	}
}
