import {QuantifiedMineral, SmeltingComponent} from "@/types";

/* ------------------------------ Contract ------------------------------ */

/**
 * Flags for enabling and disabling functionality.
 * Defined as an enum flag.
 * @see FlagValues
 */
export enum Flags {
	/**
	 * Enables logic for finding the closest alternative that can be made.
	 *
	 * For e.g. If the user requested 4 ingots valued at 400mB, but can only make 300mB as determined by the algorithm,
	 * this result would be sent back as a success instead.
	 *
	 * Requires the {@link intervalMb} value to be present in {@link FlagValues}.
	 */
	CLOSEST_ALTERNATIVE = 1,
}

/**
 * Values for enabled flags.
 * Each flag documentation defines which flag value is mandatory.
 * @see Flag
 */
export interface FlagValues {
	/**
	 * The size of specified target output type.
	 *
	 * For e.g. a modpack where an ingot is 100mB would define the interval as 100mB.
	 */
	intervalMb? : number;
}

/**
 * Result of the calculation.
 */
export interface CalculationOutput {
	/**
	 * The status of the calculation.
	 * Some statuses may output additional context in {@link statusContext}.
	 * @see statusContext
	 */
	status : OutputCode;
	/**
	 * Additional context of the status output.
	 */
	statusContext? : string;
	/**
	 * The amount that has been produced.
	 * This may be different from the targetMb parameter in {@link calculateSmeltingOutput} if flags have been applied.
	 * @see Flag
	 */
	amountMb : number;
	/**
	 * The collection of used minerals to produce the outputs, with their quantities.
	 */
	usedMinerals : QuantifiedMineral[];
}

/**
 * Status of the calculation.
 * Some statuses may provide additional context via `statusContext`.
 */
export enum OutputCode {
	/**
	 * It is feasible to create the desired output.
	 */
	SUCCESS,
	/**
	 * Request has missing values or contains invalid input from the caller.
	 */
	BAD_REQUEST,
	/**
	 * Insufficient amount of minerals in total to achieve desired amount.
	 */
	INSUFFICIENT_TOTAL_MB,
	/**
	 * Insufficient amount of {@link statusContext} specified mineral to
	 * meet minimum component criteria for the desired amount.
	 */
	INSUFFICIENT_SPECIFIC_MINERAL_MB,
	/**
	 * Enough resources exist, but it is impossible to create desired
	 * amount taking into account all flags.
	 */
	UNFEASIBLE
}

/**
 * Interface contract defining output calculation methods.
 */
export interface IOutputCalculator {
	/**
	 * Calculate a smelting output feasibility based on the component constraints,
	 * targeting a production of a certain amount of millibuckets.
	 *
	 * Method should not fail or error.
	 *
	 * @param targetMb The amount to produce in millibuckets as part of the calculation.
	 * @param components The components required.
	 * @param availableMinerals Collection of all available minerals.
	 * @param flags Flags to enable functionality as part of the calculation flow.
	 * @param flagValues Values for the given flags.
	 */
	calculateSmeltingOutput(
			targetMb : number,
			components : SmeltingComponent[],
			availableMinerals : Map<string, QuantifiedMineral[]>,
			flags? : Flags,
			flagValues? : FlagValues
	) : CalculationOutput;
}

/* ------------------------------ Utilities ------------------------------ */

const normalize = (s: string) => s.trim().toLowerCase();

/**
 * Normalize keys in inventory map and combine entries with the same normalized key.
 *
 * @param inventoryMap Map with component as key and all minerals producing it as value.
 */
function normalizeInvMap(inventoryMap: Map<string, QuantifiedMineral[]>): Map<string, QuantifiedMineral[]> {
	const out = new Map<string, QuantifiedMineral[]>();
	for (const [key, arr] of inventoryMap) {
		const normKey = normalize(key);
		const prev = out.get(normKey);
		out.set(normKey, prev ? prev.concat(arr) : arr);
	}
	return out;
}

/**
 * Run binary search on a sorted candidate list.
 *
 * @param arr Sorted candidate list.
 * @param x Target to search for.
 */
function hasTarget(arr: number[], x: number): boolean {
	let lo = 0,
		hi = arr.length - 1;
	while (lo <= hi) {
		const mid = (lo + hi) >>> 1;
		if (arr[mid] === x) return true;
		if (arr[mid] < x) lo = mid + 1;
		else hi = mid - 1;
	}
	return false;
}

/**
 * Compute total available mB for the given component from the inventory map.
 *
 * @param component The component to compute total available mB for.
 * @param invByComponent Map with component as key and all minerals producing it as value.
 */
function totalAvailableForComponent(component: string, invByComponent: Map<string, QuantifiedMineral[]>): number {
	const arr = invByComponent.get(normalize(component)) ?? [];
	let total = 0;
	for (const qm of arr) total += qm.yield * qm.quantity;
	return total;
}

/**
 * Detemine if flag for CLOSEST_ALTERNATIVE is on.
 */
function isFlagOn(flags: Flags | undefined, flag: Flags): boolean {
  return (flags ?? 0) & flag ? true : false;
}

/**
 * @param targetMb Target total output in mB to evaluate requirements against.
 * @param normalizedComponents List of normalized components with their minPct windows.
 * @param normalizedInv Inventory map keyed by normalized component name, each to an array
 *   of minerals, where each mineral contributes yield*quantity mB.
 * @returns An array of bottleneck records. Empty if all components meet their minimums.
 */
function computeBottlenecks(
  targetMb: number,
  normalizedComponents: NormalizedComponent[],
  normalizedInv: Map<string, QuantifiedMineral[]>
): Array<{ component: string; needMb: number; haveMb: number; shortfallMb: number }> {
  const out: Array<{ component: string; needMb: number; haveMb: number; shortfallMb: number }> = [];
  for (const { component, minPct } of normalizedComponents) {
    const needMb = Math.ceil((minPct / 100) * targetMb);
    const haveMb = totalAvailableForComponent(component, normalizedInv);
    if (haveMb < needMb) out.push({ component, needMb, haveMb, shortfallMb: needMb - haveMb });
  }
  return out;
}

/** Try to solve exactly amountMb using existing DP/DFS; return minerals or null. */
function trySolveExact(
  amountMb: number,
  normalizedComponents: NormalizedComponent[],
  normalizedInv: Map<string, QuantifiedMineral[]>
): QuantifiedMineral[] | null {
  const plans = buildAllComponentDP(amountMb, normalizedComponents, normalizedInv);
  if (!plans) return null;

  const sumMin = plans.reduce((s, p) => s + p.minMb, 0);
  const sumMax = plans.reduce((s, p) => s + p.maxMb, 0);
  if (sumMin > amountMb || sumMax < amountMb) return null;

  const chosen = pickOneSumPerComponent(plans, amountMb);
  if (!chosen) return null;

  const byName = new Map<string, QuantifiedMineral>();
  for (const plan of plans) {
    const sumChosen = chosen.get(plan.component)!;
    for (const qm of reconstructMinerals(plan.dp, sumChosen)) {
      const existing = byName.get(qm.name);
      if (existing) existing.quantity += qm.quantity;
      else byName.set(qm.name, { ...qm });
    }
  }
  return Array.from(byName.values());
}

/*----------------------- Binary decomposition (chunks) -----------------------*/

type Chunk = {
	/** Total mB this chunk contributes (qm.yield × qty) */
	weight: number;
	/** Which mineral this chunk comes from */
	qm: QuantifiedMineral;
	/** chunkSize: how many units of the mineral this chunk represents */
	qty: number;
};

/**
 * Use binary decomposition to split one QuantifiedMineral into ~log2(q) chunks.
 * Optionally clamp quantity by an upper bound (e.g. cap / yield).
 *
 * @returns array of Chunk objects.
 */
function splitChunks(qm: QuantifiedMineral, clampUnitsTo?: number): Chunk[] {
	const maxUnitsUseful = clampUnitsTo !== undefined ? Math.min(qm.quantity, clampUnitsTo) : qm.quantity;

	const chunks: Chunk[] = [];
	let remaining = Math.max(0, maxUnitsUseful);
	let k = 1;
	while (remaining > 0) {
		const take = Math.min(k, remaining); // always take k except possibly the last chunk
		chunks.push({
			weight: qm.yield * take,
			qm: qm,
			qty: take,
		});
		remaining -= take;
		k *= 2; // double k (1, 2, 4, 8, ...)
	}
	return chunks;
}

/*---------------- Per-component Subset Sum DP with reconstruction ----------------*/

type ComponentDP = {
  /** The component to process*/
  component: string;
  /** Max mB we need to consider for this component */
  cap: number;
  /** reachable[s] === 1 -> exact s mB is achievable */
  reachable: Uint8Array;
  /** prevSum[s] -> sum before adding last chunk to reach s */
  prevSum: Int32Array;
  /** lastChunkIndex[s] -> index of last chunk used to reach s */
  lastChunkIndex: Int32Array;
  /** Chunk list used by DP */
  chunks: Chunk[];
};

/**
 * Build reachability array for one Component using 0/1 Subset Sum DP.
 * cap = min(totalAvailableForComponent, per-component max bound).
 */
function buildComponentDP(component: string, minerals: QuantifiedMineral[], cap: number): ComponentDP {
	// Build chunks and clamp per-mineral units to avoid adding useless chunks.
	// We will never need more than (cap / yield) units of a mineral to reach cap.
	const chunks = minerals.flatMap((qm) => {
		const maxUnitsForThisMineral = qm.yield > 0 ? Math.floor(cap / qm.yield) : 0;
		return splitChunks(qm, maxUnitsForThisMineral);
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
		const weight = Math.trunc(chunks[i].weight); // ensure integer
		if (weight <= 0 || weight > cap) continue; // skip useless chunks
		for (let sumBefore = cap - weight; sumBefore >= 0; sumBefore--) {
			const sumAfter = sumBefore + weight;
			// Only mark sumAfter reachable on first encounter -> more than one path is unnecessary
			if (reachable[sumBefore] && !reachable[sumAfter]) {
				reachable[sumAfter] = 1;
				prevSum[sumAfter] = sumBefore;
				lastChunkIndex[sumAfter] = i;
			}
		}
	}
	return { component, cap, reachable, prevSum, lastChunkIndex, chunks };
}

/**
 * Reconstruct chosen chunks for a given component sum, aggregating by mineral.
 */
function reconstructMinerals(dp: ComponentDP, targetSum: number): QuantifiedMineral[] {
	const used = new Map<string, QuantifiedMineral>(); // key by mineral name
	let sum = targetSum;

	while (sum > 0) {
		const i = dp.lastChunkIndex[sum];
		if (i < 0) {
			// Defensive: will not happen if targetSum is reachable
			break;
		}
		const chunk = dp.chunks[i];
		const m = chunk.qm;
		const key = m.name; // aggregate by mineral name
		const existing = used.get(key);

		if (existing) {
			existing.quantity += chunk.qty;
		} else {
			used.set(key, {
				name: key,
				produces: normalize(m.produces), // keep output normalized
				yield: m.yield,
				uses: m.uses,
				quantity: chunk.qty,
			});
		}
		sum = dp.prevSum[sum];
	}

	return Array.from(used.values());
}

/*------------------------- Cross-component DFS (branch-and-bound) -------------------------*/

type PerComponentPlan = {
	component: string;
	minMb: number; // minimum mB in the percentage threshold
	maxMb: number; // maximum mB in the percentage threshold
	dp: ComponentDP;
	candidates: number[];
};

function pickOneSumPerComponent(plans: PerComponentPlan[], targetMb: number): Map<string, number> | null {
	const n = plans.length;

	// Order by fewest candidates first to find contradictions early (heuristic)
	plans.sort((a, b) => a.candidates.length - b.candidates.length);

	// Precompute suffix min/max bounds
	const suffixMin = new Int32Array(n + 1); // sum of min candidates from plans[i..end]
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
		const options = plan.candidates.slice().sort((a, b) => Math.abs(a - need) - Math.abs(b - need));

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
			dfs(i + 1, newSum); // explore candidates in successive components
			if (solved) return;
			choice.delete(plan.component); // backtrack
		}
	}

	// Fast last-step optimization: if only one component left, do binary search.
	if (n === 1) {
		if (hasTarget(plans[0].candidates, targetMb)) {
			const m = new Map<string, number>();
			m.set(plans[0].component, targetMb);
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
type NormalizedComponent = {
	component: string; // normalized component name
	minPct: number;
	maxPct: number;
};

function earlyFeasibilityChecks(
  targetMb: number,
  normalizedComponents: NormalizedComponent[],
  normalizedInv: Map<string, QuantifiedMineral[]>,
  flags?: Flags,
  _flagValues?: FlagValues
): CalculationOutput | null {
  const closestOn = isFlagOn(flags, Flags.CLOSEST_ALTERNATIVE);

  // Bad inputs are always errors
  if (!Number.isFinite(targetMb) || targetMb <= 0 || !Number.isInteger(targetMb)) {
    return {
      status: OutputCode.BAD_REQUEST,
      amountMb: 0,
      usedMinerals: [],
      statusContext: "targetMb must be a positive integer",
    };
  }
  if (!normalizedComponents?.length) {
    return {
      status: OutputCode.BAD_REQUEST,
      amountMb: 0,
      usedMinerals: [],
      statusContext: "components are required",
    };
  }

  // When CLOSEST_ALTERNATIVE is ON, we don't fail early for "insufficient for the target",
  // because a smaller amount might still be feasible. We keep these as prunable hints only
  let totalAvailableFromRecipe = 0;
  for (const { component } of normalizedComponents) {
    totalAvailableFromRecipe += totalAvailableForComponent(component, normalizedInv);
  }
  if (!closestOn && totalAvailableFromRecipe < targetMb) {
    return {
      status: OutputCode.INSUFFICIENT_TOTAL_MB,
      statusContext: "Not enough total material available",
      amountMb: 0,
      usedMinerals: [],
    };
  }

  for (const { component, minPct } of normalizedComponents) {
    const minMb = Math.ceil((minPct / 100) * targetMb);
    const available = totalAvailableForComponent(component, normalizedInv);
    if (!closestOn && available < minMb) {
      return {
        status: OutputCode.INSUFFICIENT_SPECIFIC_MINERAL_MB,
        statusContext: `Not enough ${component} for minimum requirement`,
        amountMb: 0,
        usedMinerals: [],
      };
    }
  }

  return null; // proceed
}

/** Build DP tables (including candidate lists) for all components */
function buildAllComponentDP(
	targetMb: number,
	normalizedComponents: NormalizedComponent[],
	normalizedInv: Map<string, QuantifiedMineral[]>
): PerComponentPlan[] | null {
	// Build per-component DP + candidate lists
	const plans: PerComponentPlan[] = [];

	for (const { component, minPct, maxPct } of normalizedComponents) {
		const inv: QuantifiedMineral[] = normalizedInv.get(component) ?? [];

		const availableMb = inv.reduce((s, u) => s + u.yield * u.quantity, 0);
		const minMb = Math.ceil((minPct / 100) * targetMb);
		const maxMb = Math.floor((maxPct / 100) * targetMb);

		// DP cap: set max mB we need to consider for this component
		const cap = Math.max(
			0, // defensive
			Math.min(availableMb, maxMb)
		);

		const dp = buildComponentDP(component, inv, cap);

		// Build list of in-window candidates from reachable[]
		const candidates: number[] = [];
		if (minMb <= cap) {
			const lo = Math.max(0, minMb);
			const hi = Math.min(cap, maxMb);
			for (let mb = lo; mb <= hi; mb++) {
				if (dp.reachable[mb]) candidates.push(mb);
			}
		}

		// If no candidates for a component, valid combination is impossible
		if (candidates.length === 0) return null;

		// Deduplicate and sort candidates
		candidates.sort((a, b) => a - b);
		const dedup = [...new Set(candidates)];

		plans.push({
			component,
			minMb,
			maxMb,
			dp,
			candidates: dedup,
		});
	}
	return plans;
}

export function calculateSmeltingOutput(
  targetMb: number,
  components: SmeltingComponent[],
  availableMinerals: Map<string, QuantifiedMineral[]>,
  flags?: Flags,
  flagValues?: FlagValues
): CalculationOutput {
  // Normalize inputs
  const normalizedComponents = components.map((c) => ({
    component: normalize(c.mineral),
    minPct: c.min,
    maxPct: c.max,
  }));
  const normalizedInv = normalizeInvMap(availableMinerals);

  // Early feasibility checks
  const earlyResult = earlyFeasibilityChecks(targetMb, normalizedComponents, normalizedInv, flags, flagValues);
  if (earlyResult) return earlyResult;

  // Try exact target first
  const exactMinerals = trySolveExact(targetMb, normalizedComponents, normalizedInv);
  if (exactMinerals) {
    return { status: OutputCode.SUCCESS, amountMb: targetMb, usedMinerals: exactMinerals };
  }

  // If CLOSEST_ALTERNATIVE is enabled, step down in intervalMb to find best feasible amount
  const closestOn = isFlagOn(flags, Flags.CLOSEST_ALTERNATIVE);
  if (closestOn) {
    const intervalMb = flagValues?.intervalMb ?? 0;
    if (!Number.isInteger(intervalMb) || intervalMb <= 0) {
      return {
        status: OutputCode.BAD_REQUEST,
        amountMb: 0,
        usedMinerals: [],
        statusContext: 
		"intervalMb must be provided as a positive integer when CLOSEST_ALTERNATIVE is set",
      };
    }

    // Upper bound by what's actually available, rounded to the interval
    let totalAvailableFromRecipe = 0;
    for (const { component } of normalizedComponents) {
      totalAvailableFromRecipe += totalAvailableForComponent(component, normalizedInv);
    }
    const start = Math.min(targetMb, Math.floor(totalAvailableFromRecipe / intervalMb) * intervalMb);

    // If nothing even at one interval, fail with a helpful message
    if (start <= 0) {
      const b = computeBottlenecks(targetMb, normalizedComponents, normalizedInv);
      const ctx = b.length
        ? `No valid combination. Bottlenecks at ${targetMb}mB: ` +
          b.map(x => `${x.component} short by ${x.shortfallMb}mB (need ${x.needMb}, have ${x.haveMb})`).join("; ")
        : "No valid combination for any amount.";
      return { status: OutputCode.UNFEASIBLE, amountMb: 0, usedMinerals: [], statusContext: ctx };
    }

    // Walk downward in interval-sized steps until we find a feasible exact combination
    for (let candidate = start; candidate >= intervalMb; candidate -= intervalMb) {
      // quick prune: per-component mins for this candidate
      let ok = true;
      for (const { component, minPct } of normalizedComponents) {
        const need = Math.ceil((minPct / 100) * candidate);
        if (totalAvailableForComponent(component, normalizedInv) < need) { ok = false; break; }
      }
      if (!ok) continue;

      const minerals = trySolveExact(candidate, normalizedComponents, normalizedInv);
      if (minerals) {
        return {
          status: OutputCode.SUCCESS,
          amountMb: candidate,
          usedMinerals: minerals,
          statusContext: candidate === targetMb ? undefined : "closest_alternative",
        };
      }
    }

    // Still nothing—give diagnostics at target
    const b = computeBottlenecks(targetMb, normalizedComponents, normalizedInv);
    const ctx = b.length
      ? `No valid combination. Bottlenecks at ${targetMb}mB: ` +
        b.map(x => `${x.component} short by ${x.shortfallMb}mB (need ${x.needMb}, have ${x.haveMb})`).join("; ")
      : "Could not find valid combination of materials";
    return { status: OutputCode.UNFEASIBLE, amountMb: 0, usedMinerals: [], statusContext: ctx };
  }

  // 3) Flag not set -> keep existing failure behavior
  return {
    status: OutputCode.UNFEASIBLE,
    statusContext: "Could not find valid combination of materials",
    amountMb: 0,
    usedMinerals: [],
  };
}

export class OutputCalculator implements IOutputCalculator {
  calculateSmeltingOutput(
    targetMb: number,
    components: SmeltingComponent[],
    availableMinerals: Map<string, QuantifiedMineral[]>,
    flags?: Flags,
    flagValues?: FlagValues
  ): CalculationOutput {
    return calculateSmeltingOutput(targetMb, components, availableMinerals, flags, flagValues);
  }
}
