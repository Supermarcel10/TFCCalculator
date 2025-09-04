import { SmeltingComponent, Mineral, QuantifiedMineral } from "@/types";

export interface MineralWithQuantity {
	mineral: Mineral;
	quantity: number;
}

export interface MetalProductionResult {
	outputMb: number;
	usedMinerals: MineralWithQuantity[];
	success: boolean;
	message?: string;
}

/* ------------------------------ Utilities ------------------------------ */

const normalize = (s: string) => s.trim().toLowerCase();

/**
 * Compute total available mB for the given component from the inventory map.
 * 
 * @param component The component to compute total available mB for.
 * @param invByComponent Map with component as key and all minerals producing it as value.
 */
function totalAvailableForComponent(
  component: string,
  invByComponent: Map<string, QuantifiedMineral[]>
): number {
  const arr = invByComponent.get(normalize(component)) ?? [];
  let total = 0;
  for (const qm of arr) total += qm.yield * qm.quantity;
  return total;
}

/**
 * Convert a QuantifiedMineral[] to MineralWithQuantity[] with normalized keys.
 * Quantity is lifted out of the mineral object and into the wrapper object.
 * 
 * @param mineralsByComponent Map with component as key and all minerals producing it as value.
 * @return array of MineralWithQuantity objects (with mineral and quantity fields).
 */
function toMineralWithQuantity(
  items: QuantifiedMineral[] | undefined
): MineralWithQuantity[] {
  if (!items) return [];
  return items.map((qm) => ({
	mineral: {
	  name: qm.name,
	  produces: normalize(qm.produces), // normalize component key
	  yield: qm.yield,
	  uses: qm.uses,
	},
	quantity: qm.quantity,
  }));
}

/*----------------------- Binary decomposition (chunks) -----------------------*/

type Chunk = {
  w: number;    // total mB this chunk contributes (mineral.yield × qty)
  m: Mineral;   // which mineral this chunk comes from
  qty: number;  // chunkSize: how many units of the mineral this chunk represents
};

/**
 * Use binary decomposition to split one MineralWithQuantity into into ~log2(q) chunks.
 * Optionally clamp quantity by an upper bound (e.g. cap / yield).
 * 
 * @returns array of Chunk objects.
 */
function splitChunks(
  mineral: MineralWithQuantity, 
  clampUnitsTo?: number
): Chunk[] {
  const { mineral: m, quantity } = mineral;
  const maxUnitsUseful =
	clampUnitsTo !== undefined ? Math.min(quantity, clampUnitsTo) : quantity;

  const chunks: Chunk[] = [];
  let remaining = Math.max(0, Math.floor(maxUnitsUseful));
  let k = 1;
  while (remaining > 0) {
	const take = Math.min(k, remaining);  // always take k except possibly the last chunk
	chunks.push({
	  w: m.yield * take,
	  m,
	  qty: take,
	});
	remaining -= take;
	k *= 2;  // double k (1, 2, 4, 8, ...)
  }
  return chunks;
}

/*---------------- Per-component Subset Sum DP with reconstruction ----------------*/

type ComponentDP = {
  component: string;           // e.g. copper, tin
  cap: number;                 // max mB we need to consider for this component
  reachable: Uint8Array;       // reachable[s] === 1 -> exact s mB is achievable
  prevSum: Int32Array;         // prevSum[s] -> sum before adding last chunk to reach s
  lastChunkIndex: Int32Array;  // lastChunkIndex[s] -> index of last chunk used to reach s
  chunks: Chunk[];             // chunk list used by DP
};

/**
 * Build reachability array for one Component using 0/1 Subset Sum DP.
 * cap = min(totalAvailableForComponent, per-component max bound).
 */
function buildComponentDP(
  component: string,
  minerals: MineralWithQuantity[],
  cap: number
): ComponentDP {
  // Build chunks and clamp per-mineral units to avoid adding useless chunks.
  // We will never need more than (cap / yield) units of a mineral to reach cap.
  const chunks = minerals.flatMap((mwq) => {
	const maxUnitsForThisMineral =
	  mwq.mineral.yield > 0 ? Math.floor(cap / mwq.mineral.yield) : 0;
	return splitChunks(mwq, maxUnitsForThisMineral);
  });

  // We can always reach 0 mB by choosing 0 chunks
  const reachable = new Uint8Array(cap + 1);
  reachable[0] = 1;

  // Initialize predecessor arrays for reconstruction
  const prevSum = new Int32Array(cap + 1);
  const lastChunkIndex = new Int32Array(cap + 1);
  prevSum.fill(-1);
  lastChunkIndex.fill(-1);

  // 0/1 Subset Sum DP with descending inner loop
  for (let i = 0; i < chunks.length; i++) {
	const w = Math.trunc(chunks[i].w);  // ensure integer
	if (w <= 0 || w > cap) continue;  // skip useless chunks
	for (let s = cap - w; s >= 0; s--) {
	  // Only mark s + w reachable on first encounter -> more than one path is unnecessary
	  if (reachable[s] && !reachable[s + w]) {
		reachable[s + w] = 1;
		prevSum[s + w] = s;
		lastChunkIndex[s + w] = i;
	  }
	}
  }

  return { component, cap, reachable, prevSum, lastChunkIndex, chunks };
}

/** 
 * Reconstruct chosen chunks for a given component sum, aggregating by mineral.
*/
function reconstructMinerals(
  dp: ComponentDP,
  targetSum: number
): MineralWithQuantity[] {
  const used = new Map<string, MineralWithQuantity>();  // key by mineral name
  let s = targetSum;

  while (s > 0) {
	const i = dp.lastChunkIndex[s];
	if (i < 0) {
	  // Defensive: will not happen if targetSum is reachable
	  break;
	}
	const chunk = dp.chunks[i];
	const key = chunk.m.name;  // aggregate by mineral name
	const existing = used.get(key);
	if (existing) {
	  existing.quantity += chunk.qty;
	} else {
	  used.set(key, { mineral: chunk.m, quantity: chunk.qty });
	}
	s = dp.prevSum[s];
  }

  return Array.from(used.values());
}

/*------------------------- Cross-component DFS (branch-and-bound) -------------------------*/

type PerComponentPlan = {
  component: string;
  minMb: number;  // minimum mB in the percentage threshold
  maxMb: number;  // maximum mB in the percentage threshold
  dp: ComponentDP;
  candidates: number[];
  candidateSet: Set<number>;
};

function pickOneSumPerComponent(
  plans: PerComponentPlan[],
  targetMb: number
): Map<string, number> | null {
  const n = plans.length;

  // Order by fewest candidates first to find contradictions early (heuristic)
  plans.sort((a, b) => a.candidates.length - b.candidates.length);

  // Precompute suffix min/max bounds
  const suffixMin = new Int32Array(n + 1);  // sum of min candidates from plans[i..end]
  const suffixMax = new Int32Array(n + 1);
  suffixMin[n] = 0;
  suffixMax[n] = 0;
  for (let i = n - 1; i >= 0; i--) {
	const minCand = getMin(plans[i].candidates);
	const maxCand = getMax(plans[i].candidates);
	suffixMin[i] = minCand + suffixMin[i + 1];
	suffixMax[i] = maxCand + suffixMax[i + 1];
  }

  const choice = new Map<string, number>();
  const seen = new Set<string>();
  let solved = false;

  function dfs(i: number, sumSoFar: number): void {
	if (solved) return;

	// Prune branches that cannot possibly reach targetMb
	if (sumSoFar > targetMb) return;
	if (sumSoFar + suffixMin[i] > targetMb) return;
	if (sumSoFar + suffixMax[i] < targetMb) return;

	if (i === n) {
	  if (sumSoFar === targetMb) solved = true;
	  return;
	}

	const plan = plans[i];
	// Greedy try-order: closest to the "need" first
	const need = targetMb - sumSoFar - suffixMin[i + 1];
	const options = plan.candidates
	  .slice()
	  .sort((a, b) => Math.abs(a - need) - Math.abs(b - need));

	for (const opt of options) {
	  const newSum = sumSoFar + opt;

	  // Tighter per-option bounds using the rest (i+1..end)
	  if (newSum + suffixMin[i + 1] > targetMb) continue;
	  if (newSum + suffixMax[i + 1] < targetMb) continue;

	  // Avoid revisiting the same (i, newSum) state
	  const key = `${i}|${newSum}`;
	  if (seen.has(key)) continue;
	  seen.add(key);

	  choice.set(plan.component, opt);
	  dfs(i + 1, newSum);  // explore candidates in successive components
	  if (solved) return;
	  choice.delete(plan.component);  // backtrack
	}
  }

  // Fast last-step optimization: if only one component left, do direct membership.
  if (n === 1) {
	const v = targetMb;
	if (plans[0].candidateSet.has(v)) {
	  const m = new Map<string, number>();
	  m.set(plans[0].component, v);
	  return m;
	}
	return null;
  }

  dfs(0, 0);
  return solved ? choice : null;
}

// Candidates are already sorted in ascending order, so min/max are first/last elements
function getMin(arr: number[]): number {
  return arr.length ? arr[0] : 0;
}
function getMax(arr: number[]): number {
  return arr.length ? arr[arr.length - 1] : 0;
}

/* --------------------------------- Public API -------------------------------- */

export function calculateMetal(
  targetMb: number,
  components: SmeltingComponent[],
  availableByComponent: Map<string, QuantifiedMineral[]>
): MetalProductionResult {
  // Normalize component keys for lookups
  const normalizedComponents = components.map((c) => ({
	component: normalize(c.mineral),
	minPct: c.min,
	maxPct: c.max,
  }));

  // Early feasibility check: total available mB must be >= targetMb
  let totalAvailableFromRecipe = 0;
  for (const { component } of normalizedComponents) {
	totalAvailableFromRecipe += totalAvailableForComponent(
	  component,
	  availableByComponent
	);
  }
  if (totalAvailableFromRecipe < targetMb) {
	return {
	  outputMb: 0,
	  usedMinerals: [],
	  success: false,
	  message: "Not enough total material available",
	};
  }

  // Early feasibility check: total available mB for each Component must be >= minPct
  for (const { component, minPct } of normalizedComponents) {
	const minMb = Math.ceil((minPct / 100) * targetMb);
	const available = totalAvailableForComponent(component, availableByComponent);
	if (available < minMb) {
	  return {
		outputMb: 0,
		usedMinerals: [],
		success: false,
		message: `Not enough ${component} for minimum requirement`,
	  };
	}
  }

  // Build per-component DP + candidate lists
  const plans: PerComponentPlan[] = [];

  for (const { component, minPct, maxPct } of normalizedComponents) {
	const inv = toMineralWithQuantity(availableByComponent.get(component));

	const availableMb = inv.reduce(
	  (s, u) => s + u.mineral.yield * u.quantity,
	  0
	);
	const minMb = Math.ceil((minPct / 100) * targetMb);
	const maxMb = Math.floor((maxPct / 100) * targetMb);

	// DP cap: set max mB we need to consider for this component
	const cap = Math.max(
	  0,  // defensive
	  Math.min(availableMb, maxMb)
	);
	
	const dp = buildComponentDP(component, inv, cap);

	// Build list of in-window candidates from reachable[]
	const candidates: number[] = [];
	if (minMb <= cap) {
	  const lo = Math.max(0, minMb);
	  const hi = Math.min(cap, maxMb);
	  for (let s = lo; s <= hi; s++) {
		if (dp.reachable[s]) candidates.push(s);
	  }
	}

	// If no candidates, valid combination is impossible
	if (candidates.length === 0) {
	  return {
		outputMb: 0,
		usedMinerals: [],
		success: false,
		message: "Could not find valid combination of materials",
	  };
	}

	// Deduplicate and sort candidates + prepare a Set for O(1) membership checks
	candidates.sort((a, b) => a - b);
	const dedup: number[] = [];
	let last = Number.NaN;
	for (const v of candidates) {
	  if (v !== last) dedup.push(v), (last = v);
	}

	plans.push({
	  component,
	  minMb,
	  maxMb,
	  dp,
	  candidates: dedup,
	  candidateSet: new Set(dedup),
	});
  }

  // Global window sanity check
  const sumMin = plans.reduce((s, p) => s + p.minMb, 0);
  const sumMax = plans.reduce((s, p) => s + p.maxMb, 0);
  if (sumMin > targetMb || sumMax < targetMb) {
	return {
	  outputMb: 0,
	  usedMinerals: [],
	  success: false,
	  message: "Could not find valid combination of materials",
	};
  }

  // Cross-component DFS to pick one candidate per component
  const chosen = pickOneSumPerComponent(plans, targetMb);
  if (!chosen) {
	return {
	  outputMb: 0,
	  usedMinerals: [],
	  success: false,
	  message: "Could not find valid combination of materials",
	};
  }

  // Reconstruction: turn chosen per-component sums into minerals
  const usedAll: MineralWithQuantity[] = [];
  for (const plan of plans) {
	const s = chosen.get(plan.component)!;  // exists if solved
	const used = reconstructMinerals(plan.dp, s);
	usedAll.push(...used);
  }

  // Merge same minerals (by name) across components (usually unnecessary, but tidy)
  const byName = new Map<string, MineralWithQuantity>();
  for (const u of usedAll) {
	const key = u.mineral.name;
	const val = byName.get(key);
	if (val) val.quantity += u.quantity;
	else byName.set(key, { mineral: u.mineral, quantity: u.quantity });
  }

  return {
	outputMb: targetMb,
	usedMinerals: Array.from(byName.values()),
	success: true,
  };
}
