import {Chunk, IChunkingService} from "@/services/calculation/abstract/IChunkingService";
import {QuantifiedMineral} from "@/types";


export class ChunkingService implements IChunkingService {
	splitIntoChunks(qm : QuantifiedMineral, clampUnitsTo? : number) : Chunk[] {
		const maxUnitsUseful = clampUnitsTo === undefined ? qm.quantity : Math.min(qm.quantity, clampUnitsTo);

		const chunks : Chunk[] = [];
		let remaining = Math.max(0, maxUnitsUseful);
		let k = 1;
		while (remaining > 0) {
			const take = Math.min(k, remaining);
			chunks.push(
					{
						weight : qm.yield * take,
						qm : qm,
						qty : take
					});
			remaining -= take;
			k *= 2;
		}
		return chunks;
	}

	splitAllIntoChunks(minerals : QuantifiedMineral[], cap : number) : Chunk[] {
		return minerals.flatMap((qm) => {
			const maxUnitsForThisMineral = qm.yield > 0 ? Math.floor(cap / qm.yield) : 0;
			return this.splitIntoChunks(qm, maxUnitsForThisMineral);
		});
	}
}
