import {Chunk} from "@/services/calculation/abstract/IChunkingService";
import {createQuantifiedMineral} from "@test/helpers";
import {ComponentDP} from "@/services/calculation/abstract/IDPService";


export type TestChunk = {
	weight : number;
	qm : ReturnType<typeof createQuantifiedMineral>;
	qty : number;
};

export function createTestChunks(...specs : Array<{
	name : string;
	produces : string;
	yieldValue : number;
	quantity : number;
	units : number;
}>) : Chunk[] {
	return specs.map(spec => ({
		weight : spec.yieldValue * spec.units,
		qm : createQuantifiedMineral(spec.name, spec.produces, spec.yieldValue, spec.quantity),
		qty : spec.units
	}));
}

export function createDPWithPath(
		component : string,
		cap : number,
		chunks : Chunk[],
		path : Array<{
			sum : number;
			prevSum : number;
			chunkIndex : number;
		}>
) : ComponentDP {
	const reachable = new Uint8Array(cap + 1);
	const prevSum = new Int32Array(cap + 1);
	const lastChunkIndex = new Int32Array(cap + 1);

	// Initialize arrays
	prevSum.fill(-1);
	lastChunkIndex.fill(-1);

	// Always reachable at sum 0
	reachable[0] = 1;
	prevSum[0] = -1;
	lastChunkIndex[0] = -1;

	// Set up path
	for (const {sum, prevSum : prev, chunkIndex} of path) {
		if (sum <= cap) {
			reachable[sum] = 1;
			prevSum[sum] = prev;
			lastChunkIndex[sum] = chunkIndex;
		}
	}

	return {
		component,
		cap,
		reachable,
		prevSum,
		lastChunkIndex,
		chunks
	};
}

export function createSimpleDP(
		component : string,
		cap : number,
		chunks : Chunk[],
		reachableSums : number[]
) : ComponentDP {
	const reachable = new Uint8Array(cap + 1);
	const prevSum = new Int32Array(cap + 1);
	const lastChunkIndex = new Int32Array(cap + 1);

	// Initialize arrays
	prevSum.fill(-1);
	lastChunkIndex.fill(-1);

	// Always reachable at sum 0
	reachable[0] = 1;
	prevSum[0] = -1;
	lastChunkIndex[0] = -1;

	// Linear path where each sum is reached from the previous
	reachableSums.sort((a, b) => a - b);

	for (let i = 0; i < reachableSums.length; i++) {
		const sum = reachableSums[i];
		if (sum <= cap) {
			reachable[sum] = 1;
			prevSum[sum] = i === 0 ? 0 : reachableSums[i - 1];
			lastChunkIndex[sum] = i;
		}
	}

	return {
		component,
		cap,
		reachable,
		prevSum,
		lastChunkIndex,
		chunks
	};
}
