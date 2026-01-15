import { Flags, FlagValues } from "./abstract/IOutputCalculator";
import { IOutputResolutionStrategy } from "./abstract/IOutputResolutionStrategy";
import { IOutputResolutionStrategySelector } from "./abstract/IOutputResolutionStrategySelector";
import { ExactMatchResolutionStrategy } from "./strategies/ExactMatchResolutionStrategy";


export class OutputResolutionStrategySelector implements IOutputResolutionStrategySelector {
  private readonly exactMatchStrategy : IOutputResolutionStrategy;

  constructor() {
    this.exactMatchStrategy = new ExactMatchResolutionStrategy();
  }

  public selectStrategy(flags?: Flags, flagValues?: FlagValues): IOutputResolutionStrategy {
  	return this.exactMatchStrategy;
  }
}
