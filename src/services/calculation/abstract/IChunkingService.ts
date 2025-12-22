import {QuantifiedMineral} from "@/types";


export type Chunk = {
	/** Total mB this chunk contributes (qm.yield × qty) */
	weight : number;
	/** Which mineral this chunk comes from */
	qm : QuantifiedMineral;
	/** chunkSize: how many units of the mineral this chunk represents */
	qty : number;
};

export interface IChunkingService {
	splitIntoChunks(qm : QuantifiedMineral, clampUnitsTo? : number) : Chunk[];

	splitAllIntoChunks(minerals : QuantifiedMineral[], cap : number) : Chunk[];
}
