import {QuantifiedMineral} from "@/types";
import {Chunk} from "@/services/calculation/abstract/IChunkingService";


export type ComponentDP = {
	/** The component to process*/
	component : string;
	/** Max mB we need to consider for this component */
	cap : number;
	/** reachable[s] === 1 -> exact s mB is achievable */
	reachable : Uint8Array;
	/** prevSum[s] -> sum before adding last chunk to reach s */
	prevSum : Int32Array;
	/** lastChunkIndex[s] -> index of last chunk used to reach s */
	lastChunkIndex : Int32Array;
	/** Chunk list used by DP */
	chunks : Chunk[];
};

export interface IDPService {
	buildComponentDP(component : string, minerals : QuantifiedMineral[], cap : number) : ComponentDP;

	reconstructMinerals(dp : ComponentDP, targetSum : number) : QuantifiedMineral[];
}
