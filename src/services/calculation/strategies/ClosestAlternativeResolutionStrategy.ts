import {CalculationOutput, FlagValues, OutputCode} from "@/services/calculation/abstract/IOutputCalculator";
import { IOutputResolutionStrategy } from "../abstract/IOutputResolutionStrategy";
import {NormalizedComponent} from "@/services/calculation/abstract/IInputNormalizationService";
import {QuantifiedMineral} from "@/types";
import {IValidationService} from "@/services/calculation/abstract/IValidationService";
import { ExactMatchResolutionStrategy } from "./ExactMatchResolutionStrategy";


export class ClosestAlternativeResolutionStrategy implements IOutputResolutionStrategy {
  private readonly exactMatchResolutionStrategy: ExactMatchResolutionStrategy = new ExactMatchResolutionStrategy();
  private static readonly MAX_ATTEMPTS = 5;

  resolve(
    targetMb: number,
    normalizedComponents: NormalizedComponent[],
    normalizedInventory: Map<string, QuantifiedMineral[]>,
    flagValues: FlagValues | undefined,
    calculationFn: (amount: number) => CalculationOutput | null,
    validationService: IValidationService
  ): CalculationOutput {
    const exactValidation = validationService.validateInput(
      targetMb,
      normalizedComponents,
      normalizedInventory
    );

    if (!exactValidation.isValid && exactValidation.error) {
      return this.handleValidationError(
        exactValidation.error,
        targetMb,
        normalizedComponents,
        normalizedInventory,
        flagValues,
        calculationFn,
        validationService
      );
    }

    return this.findClosestAlternative(
      targetMb,
      normalizedComponents,
      normalizedInventory,
      flagValues,
      calculationFn,
      validationService
    );
  }

  private handleValidationError(
    error: CalculationOutput,
    targetMb: number,
    normalizedComponents: NormalizedComponent[],
    normalizedInventory: Map<string, QuantifiedMineral[]>,
    flagValues: FlagValues | undefined,
    calculationFn: (amount: number) => CalculationOutput | null,
    validationService: IValidationService
  ): CalculationOutput {
    if (this.isFatalError(error)) {
      return error;
    }

    if (this.isInsufficientMbError(error)) {
      return this.handleInsufficientMb(
        targetMb,
        normalizedComponents,
        normalizedInventory,
        flagValues,
        calculationFn,
        validationService
      );
    }

    return this.createUnfeasibleResult();
  }

  private findClosestAlternative(
    targetMb: number,
    normalizedComponents: NormalizedComponent[],
    normalizedInventory: Map<string, QuantifiedMineral[]>,
    flagValues: FlagValues | undefined,
    calculationFn: (amount: number) => CalculationOutput | null,
    validationService: IValidationService
  ): CalculationOutput {
    const interval = this.validateAndGetInterval(flagValues);
    if (!interval) {
      return this.createUnfeasibleResult("intervalMb is required for CLOSEST_ALTERNATIVE flag");
    }

    const exactResult = this.exactMatchResolutionStrategy.resolve(
      targetMb,
      normalizedComponents,
      normalizedInventory,
      flagValues,
      calculationFn,
      validationService
    );

    if (exactResult.status === OutputCode.SUCCESS) {
      return exactResult;
    }

    const upwardResult = this.searchDirection(
      targetMb,
      interval,
      'UP',
      normalizedComponents,
      normalizedInventory,
      calculationFn,
      validationService
    );

    return upwardResult ?? this.searchDirection(
      targetMb,
      interval,
      'DOWN',
      normalizedComponents,
      normalizedInventory,
      calculationFn,
      validationService
    ) ?? this.createUnfeasibleResult("Could not find valid combination at any interval");
  }

  private searchDirection(
    targetMb: number,
    interval: number,
    direction: 'UP' | 'DOWN',
    normalizedComponents: NormalizedComponent[],
    normalizedInventory: Map<string, QuantifiedMineral[]>,
    calculationFn: (amount: number) => CalculationOutput | null,
    validationService: IValidationService
  ): CalculationOutput | null {
    let currentMb = this.getStartingMb(targetMb, interval, direction);
    let attempts = 0;

    while (attempts < ClosestAlternativeResolutionStrategy.MAX_ATTEMPTS && currentMb > 0) {
      const validation = validationService.validateInput(currentMb, normalizedComponents, normalizedInventory);

      if (validation.isValid) {
        const result = calculationFn(currentMb);
        if (result) {
          return result;
        }
      } else if (this.isFatalError(validation.error)) {
        return null;
      }

      currentMb = direction === 'UP'
        ? currentMb + interval
        : currentMb - interval;
      ++attempts;
    }

    return null;
  }

  private getStartingMb(targetMb: number, interval: number, direction: 'UP' | 'DOWN'): number {
    const rounded = direction === 'UP'
      ? Math.ceil(targetMb / interval) * interval
      : Math.floor(targetMb / interval) * interval;

    return rounded === targetMb
      ? direction === 'UP' ? rounded + interval : rounded - interval
      : rounded;
  }

  private handleInsufficientMb(
    targetMb: number,
    normalizedComponents: NormalizedComponent[],
    normalizedInventory: Map<string, QuantifiedMineral[]>,
    flagValues: FlagValues | undefined,
    calculationFn: (amount: number) => CalculationOutput | null,
    validationService: IValidationService
  ): CalculationOutput {
    const interval = this.validateAndGetInterval(flagValues);
    if (!interval) {
      return this.createUnfeasibleResult("intervalMb is required for CLOSEST_ALTERNATIVE flag");
    }

    const downwardResult = this.searchDirection(
      targetMb,
      interval,
      'DOWN',
      normalizedComponents,
      normalizedInventory,
      calculationFn,
      validationService
    );

    return downwardResult ?? this.createUnfeasibleResult("Could not find valid combination at any interval");
  }

  private validateAndGetInterval(flagValues: FlagValues | undefined): number | null {
    return flagValues?.intervalMb && flagValues.intervalMb > 0
      ? flagValues.intervalMb
      : null;
  }

  private isInsufficientMbError(error: CalculationOutput): boolean {
    return error.status === OutputCode.INSUFFICIENT_TOTAL_MB ||
           error.status === OutputCode.INSUFFICIENT_SPECIFIC_MINERAL_MB;
  }

  private isFatalError(error: CalculationOutput | undefined): boolean {
    return error?.status === OutputCode.BAD_REQUEST;
  }

  private createUnfeasibleResult(context?: string): CalculationOutput {
    return {
      status: OutputCode.UNFEASIBLE,
      statusContext: context || "Could not find valid combination of materials",
      amountMb: 0,
      usedMinerals: []
    };
  }
}
