import type {SmeltingComponent} from "@/types";


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
 * Computes the total output in mB from a set of used minerals.
 * 
 * @param units - an array of objects containing mineral.yield and quantity
 * @returns total produced mB from all minerals
 */
export function totalUsed(units: { yield: number, quantity: number }[]) {
  return units.reduce((s, u) => s + u.yield * u.quantity, 0);
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
