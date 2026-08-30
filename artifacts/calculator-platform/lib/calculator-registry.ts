export type CalculatorStatus = "implemented" | "unimplemented";

export type CalculatorRegistryEntry = {
  id: string;
  status: CalculatorStatus;
  aliases?: string[];
};

/**
 * Single source of truth for calculator implementation availability.
 * Keep executable formulas in trusted TypeScript functions, never in catalog data.
 */
export const calculatorRegistry: Record<string, CalculatorRegistryEntry> = {
  bmi: { id: "bmi", status: "implemented" },
  percentage: { id: "percentage", status: "implemented" },
};

export function isCalculatorImplemented(id: string): boolean {
  return calculatorRegistry[id]?.status === "implemented";
}

export function getCalculatorRegistryEntry(id: string) {
  return calculatorRegistry[id];
}
