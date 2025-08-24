import type { QuantifiedMineral, SmeltingComponent } from '@/types';

/**
 * Builder for QuantifiedInputMineral
 *
 * calculateMetal() expects a Map<string, QuantifiedInputMineral[]>
 * and each QuantifiedInputMineral has { name, produces, yield, quantity, uses? }
 * Writing this by hand in every test is inefficient, so use a builder
 * with "produces" normalized to lowercase
 * and "uses" defaulting to a harmless array
 */
export function qm(
    name: string,
    produces: string,
    yieldUnits: number,
    quantity: number
): QuantifiedMineral {
    return {
        name,
        produces: produces.toLowerCase(),
        yield: yieldUnits,
        quantity,
        uses: ['vessel', 'crucible'] as any,
    };
}

/**
 * Builder for the Map<string, QuantifiedInputMineral[]>
 *
 * calculateMetal(target, components, availableByType) expects a Map
 * This helper takes an array of tuples and returns that Map,
 * lowercasing the keys to avoid mismatches
 */
export function byTypeMap(
  entries: Array<[type: string, items: QuantifiedMineral[]]>
): Map<string, QuantifiedMineral[]> {
    const m = new Map<string, QuantifiedMineral[]>();
    for (const [type, arr] of entries) m.set(type.toLowerCase(), arr);
    return m;
}

/**
 * Reusable percent window for bronze
 *
 * Many tests use the same component constraints
 */
export function bronzeComponents(): SmeltingComponent[] {
    return [
        { mineral: 'copper', min: 88, max: 92 },
        { mineral: 'tin',    min:  8, max: 12 },
    ];
}

/**
 * Timing helper for micro-benchmarks
 *
 * Smoke tests will record rough timings. This uses high-res
 * timers in Node to measure wall time in milliseconds
 */
export function timeIt<T>(fn: () => T): { result: T; ms: number } {
    const start = process.hrtime.bigint(); // nanoseconds (BigInt)
    const result = fn();
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6; // convert ns to ms as a JS number
    return { result, ms };
}
