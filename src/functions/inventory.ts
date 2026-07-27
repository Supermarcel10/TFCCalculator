import { QuantifiedMineral } from "@/types";


export function searchMinerals(
  query: string,
  minerals: QuantifiedMineral[],
): QuantifiedMineral[] {
  if (!query) return minerals;

  const lowerQuery = query.toLowerCase();

  return minerals.filter((m) => {
    const display = `${m.name} (${m.yield} mB)`.toLowerCase();
    return display.includes(lowerQuery);
  });
}
