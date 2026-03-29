import { Flags, FlagValues } from "./IOutputCalculator";
import { IOutputResolutionStrategy } from "./IOutputResolutionStrategy";


export interface IOutputResolutionStrategySelector {
  selectStrategy(flags?: Flags, flagValues?: FlagValues): IOutputResolutionStrategy;
}
