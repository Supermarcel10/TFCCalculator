import { Flags, FlagValues } from "./abstract/IOutputCalculator";
import { IOutputResolutionStrategy } from "./abstract/IOutputResolutionStrategy";
import { IOutputResolutionStrategySelector } from "./abstract/IOutputResolutionStrategySelector";
import { ExactMatchResolutionStrategy } from "./strategies/ExactMatchResolutionStrategy";
import { ClosestAlternativeResolutionStrategy } from "./strategies/ClosestAlternativeResolutionStrategy";


export class OutputResolutionStrategySelector implements IOutputResolutionStrategySelector {
  private readonly exactMatchStrategy : IOutputResolutionStrategy;
  private readonly closestAlternativeStrategy : IOutputResolutionStrategy;

  constructor() {
    this.exactMatchStrategy = new ExactMatchResolutionStrategy();
    this.closestAlternativeStrategy = new ClosestAlternativeResolutionStrategy();
  }

  public selectStrategy(flags?: Flags, _?: FlagValues): IOutputResolutionStrategy {
    if (flags === Flags.CLOSEST_ALTERNATIVE) {
      return this.closestAlternativeStrategy;
    }

  	return this.exactMatchStrategy;
  }
}
